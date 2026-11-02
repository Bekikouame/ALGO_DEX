from django.contrib.auth.models import User
from django.core.management import call_command
from rest_framework.test import APITestCase

from . import interpreteur
from .interpreteur import BlocInvalide
from .models import CarteMaitrise, Exercice, Tentative

SOMME_TABLEAU = [
    {"type": "affectation", "variable": "s", "valeur": "0"},
    {"type": "pour", "variable": "i", "debut": "0", "fin": "longueur(t) - 1", "corps": [
        {"type": "affectation", "variable": "s", "valeur": "s + t[i]"},
    ]},
    {"type": "ecrire", "valeurs": ["s"]},
]


class InterpreteurTests(APITestCase):
    def test_trace_et_points(self):
        points = [
            {"id": "p1", "question": "?", "variable": "s", "moment": {"type": "iteration", "numero": 2}},
            {"id": "p2", "question": "?", "variable": "s", "moment": {"type": "fin"}},
        ]
        r = interpreteur.executer(SOMME_TABLEAU, {"t": [5, 3, 8, 4]}, points)
        self.assertIsNone(r["erreur"])
        self.assertEqual(r["console"], ["20"])
        self.assertEqual(r["points"]["p1"], {"atteint": True, "valeur": 8})
        self.assertEqual(r["points"]["p2"]["valeur"], 20)
        self.assertEqual(r["lignes"][1]["texte"], "pour i de 0 à longueur(t) - 1 faire")

    def test_boucle_infinie_arretee(self):
        r = interpreteur.executer([
            {"type": "affectation", "variable": "i", "valeur": "0"},
            {"type": "tant_que", "condition": "i < 10", "corps": [
                {"type": "affectation", "variable": "x", "valeur": "1"}]},
        ])
        self.assertIn("probablement infinie", r["erreur"]["message"])

    def test_nombre_qui_explose(self):
        r = interpreteur.executer([
            {"type": "affectation", "variable": "x", "valeur": "2"},
            {"type": "tant_que", "condition": "vrai", "corps": [
                {"type": "affectation", "variable": "x", "valeur": "x * x"}]},
        ])
        self.assertIn("trop grand", r["erreur"]["message"])

    def test_messages_pedagogiques(self):
        r = interpreteur.executer([{"type": "ecrire", "valeurs": ["y + 1"]}])
        self.assertIn("« y » est utilisée avant", r["erreur"]["message"])
        self.assertEqual(r["erreur"]["ligne"], 1)
        r = interpreteur.executer([{"type": "ecrire", "valeurs": ["t[4]"]}], {"t": [1, 2]})
        self.assertIn("numérotées de 0 à 1", r["erreur"]["message"])

    def test_code_arbitraire_refuse(self):
        for expr in ["__import__('os')", "x.__class__", "(lambda: 1)()", "t[0:2]", "2 ** 999"]:
            with self.assertRaises(BlocInvalide, msg=expr):
                interpreteur.Programme([{"type": "ecrire", "valeurs": [expr]}])

    def test_bloc_mal_forme(self):
        with self.assertRaises(BlocInvalide) as ctx:
            interpreteur.Programme([{"type": "si", "alors": []}])
        self.assertIn("il manque la condition", ctx.exception.message)


class ParcoursTests(APITestCase):
    def setUp(self):
        call_command("charger_demo", stdout=open("/dev/null", "w"))
        self.profil = self.client.post("/api/profil", {"pseudo": "Alex"}, format="json").json()["id"]

    def exo(self, notion, type_, ordre=1):
        return Exercice.objects.get(notion=notion, type=type_, ordre=ordre)

    def ouvrir(self, exercice):
        return self.client.post("/api/tentative", {"profil_id": self.profil, "exercice_id": str(exercice.id)},
                                format="json")

    def patch(self, tid, **corps):
        return self.client.patch(f"/api/tentative/{tid}", corps, format="json")

    def passer_express(self, exercice, juste):
        tid = self.ouvrir(exercice).json()["tentative"]["id"]
        reel = interpreteur.executer(exercice.blocs, exercice.entrees, exercice.points_controle)
        points = {pid: v["valeur"] for pid, v in reel["points"].items()}
        if not juste:
            points = {pid: "faux" for pid in points}
        self.patch(tid, action="predire", prediction={"points": points, "sortie": reel["console"]})
        self.client.post("/api/executer", {"tentative_id": tid}, format="json")
        self.patch(tid, action="comparer")
        return self.patch(tid, action="soumettre").json()

    # -- profil --

    def test_profil(self):
        self.assertEqual(self.client.post("/api/profil", {"pseudo": " a "}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/profil", {"pseudo": "ALEX"}, format="json").status_code, 409)
        self.assertEqual(
            set(CarteMaitrise.objects.filter(profil_id=self.profil).values_list("etat", flat=True)), {"a_faire"}
        )
        liste = self.client.get(f"/api/profil?ids={self.profil}").json()
        self.assertEqual([p["pseudo"] for p in liste], ["Alex"])

    # -- bibliothèque --

    def test_bibliotheque(self):
        call_command("charger_bibliotheque", stdout=open("/dev/null", "w"))
        r = self.client.get(f"/api/bibliotheque?profil_id={self.profil}").json()["exercices"]
        self.assertEqual(len(r), Exercice.objects.filter(type="coeur").count())
        self.assertTrue(all("blocs" not in e for e in r))  # jamais la solution
        self.assertEqual([e["titre"] for e in r if e["principal"]],
                         ["La moyenne de deux notes", "Le plus grand des deux", "La factorielle",
                          "La somme d'un tableau"])
        # Le cockpit et le test de niveau ne changent pas.
        cockpit = self.client.get(f"/api/cockpit?profil_id={self.profil}").json()
        self.assertEqual(len(cockpit["exercices"]), 4)
        self.assertEqual(sum(len(n["express"]) for n in cockpit["calibrage"]["notions"]), 8)
        # Mêmes règles d'ouverture que les cœurs : variables ouverte, boucles verrouillée.
        acces = {e["titre"]: e["accessible"] for e in r}
        self.assertTrue(acces["Des secondes en heures"])
        self.assertFalse(acces["Le PGCD d'Euclide"])
        self.assertEqual(self.ouvrir(Exercice.objects.get(titre="Le PGCD d'Euclide")).status_code, 403)
        self.assertEqual(self.ouvrir(Exercice.objects.get(titre="Des secondes en heures")).status_code, 201)

    # -- calibrage (F1) --

    def test_cascade(self):
        statut = lambda: self.client.get(f"/api/cockpit?profil_id={self.profil}").json()["calibrage"]["statut"]
        self.assertEqual(statut(), "a_commencer")
        self.assertEqual(self.ouvrir(self.exo("variables", "express", 2)).status_code, 409)
        self.assertEqual(self.ouvrir(self.exo("variables", "express", 1)).status_code, 201)
        # Une question ouverte suffit : le test est « en cours », on le reprend au lieu de le recommencer.
        self.assertEqual(statut(), "en_cours")
        self.passer_express(self.exo("variables", "express", 1), juste=True)
        r = self.passer_express(self.exo("variables", "express", 2), juste=True)
        self.assertEqual(r["calibrage"]["prochain_exercice_id"], str(self.exo("conditions", "express").id))
        r = self.passer_express(self.exo("conditions", "express", 1), juste=False)
        self.assertEqual(r["calibrage"]["statut"], "terminee")
        self.assertEqual(r["calibrage"]["arret"], "conditions")
        # Un express déjà passé ne se rejoue pas.
        self.assertEqual(self.ouvrir(self.exo("conditions", "express", 1)).status_code, 409)

        r = self.client.post("/api/calibrage", {"profil_id": self.profil}, format="json").json()
        etats = {c["notion"]: c["etat"] for c in r["carte"]}
        self.assertEqual(etats["variables"], "demontree")
        self.assertEqual(etats["conditions"], "a_faire")
        self.assertEqual(r["notions_debloquees"], ["variables", "conditions"])
        self.assertEqual(self.ouvrir(self.exo("boucles", "coeur")).status_code, 403)

    # -- cycle cœur (F2, F4, F6, CDC-2) --

    def test_cycle_coeur(self):
        exo = self.exo("variables", "coeur")
        r = self.ouvrir(exo)
        self.assertEqual(r.status_code, 201)
        self.assertNotIn("blocs", r.json()["exercice"])  # jamais la solution
        self.assertEqual({c["notion"]: c["etat"] for c in r.json()["carte"]}["variables"], "en_cours")
        tid = r.json()["tentative"]["id"]

        faux = [{"type": "affectation", "variable": "somme", "valeur": "note1 + note2"},
                {"type": "affectation", "variable": "moyenne", "valeur": "somme / 3"},
                {"type": "ecrire", "valeurs": ["moyenne"]}]
        juste = exo.blocs

        # F4 : pas de visualisation sans prédiction.
        self.assertEqual(self.client.post("/api/executer", {"tentative_id": tid, "blocs": faux},
                                          format="json").status_code, 409)
        self.patch(tid, action="predire", prediction={"points": {"p1": 27, "p2": 9}, "sortie": ["9"]}, blocs=faux)
        self.assertEqual(self.patch(tid, action="predire", prediction={"points": {"p1": 0, "p2": 0}, "sortie": []},
                                    blocs=faux).status_code, 409)
        # Comparer exige d'avoir visualisé ; valider exige d'avoir comparé.
        self.assertEqual(self.patch(tid, action="comparer", blocs=faux).status_code, 409)
        self.client.post("/api/executer", {"tentative_id": tid, "blocs": faux}, format="json")
        self.assertEqual(self.patch(tid, action="soumettre", blocs=juste).status_code, 409)

        comparaison = self.patch(tid, action="comparer", blocs=faux).json()["resultat"]
        self.assertTrue(comparaison["tout_juste"])  # prédire juste un code faux reste possible

        r = self.patch(tid, action="soumettre", blocs=faux).json()
        self.assertFalse(r["resultat"]["valide"])
        self.assertNotIn("13.5", str(r))  # la sortie de référence ne fuit pas

        self.client.post("/api/executer", {"tentative_id": tid, "blocs": juste}, format="json")
        r = self.patch(tid, action="soumettre", blocs=juste).json()
        self.assertTrue(r["resultat"]["valide"])
        self.assertIn("print(moyenne)", r["resultat"]["recompense"]["python"])
        self.assertEqual(r["resultat"]["nouvelles_notions"], ["conditions"])
        self.assertEqual(r["tentative"]["etape_atteinte"], "reussie")
        self.assertEqual({c["notion"]: c["etat"] for c in r["carte"]}["variables"], "validee")

        cockpit = self.client.get(f"/api/cockpit?profil_id={self.profil}").json()
        self.assertEqual(cockpit["prochaine_notion"], "conditions")
        self.assertEqual([x["notion"] for x in cockpit["recompenses"]], ["variables"])

    def test_pas_de_regression(self):
        CarteMaitrise.objects.filter(profil_id=self.profil, notion="variables").update(etat="demontree")
        exo = self.exo("variables", "coeur")
        tid = self.ouvrir(exo).json()["tentative"]["id"]
        self.patch(tid, action="predire", prediction={"points": {"p1": 27, "p2": 13.5}, "sortie": "13.5"},
                   blocs=exo.blocs)
        self.client.post("/api/executer", {"tentative_id": tid, "blocs": exo.blocs}, format="json")
        self.patch(tid, action="comparer", blocs=exo.blocs)
        r = self.patch(tid, action="soumettre", blocs=exo.blocs).json()
        self.assertEqual({c["notion"]: c["etat"] for c in r["carte"]}["variables"], "demontree")

    def test_indices(self):
        tid = self.ouvrir(self.exo("variables", "coeur")).json()["tentative"]["id"]
        r = self.patch(tid, action="indice", marche=3).json()["resultat"]
        self.assertTrue(r["derniere"])
        self.assertEqual(r["suivante"], "deroulement_guide")
        self.assertEqual(self.patch(tid, action="indice", marche=9).status_code, 400)


class BackOfficeTests(APITestCase):
    def setUp(self):
        call_command("charger_demo", stdout=open("/dev/null", "w"))
        User.objects.create_superuser("admin", "", "motdepasse")

    def test_reserve_aux_admins(self):
        self.assertIn(self.client.get("/api/exercices").status_code, (401, 403))
        self.client.login(username="admin", password="motdepasse")
        self.assertEqual(len(self.client.get("/api/exercices").json()), 12)

    def test_validation_de_forme(self):
        self.client.login(username="admin", password="motdepasse")
        base = {"notion": "boucles", "type": "express", "titre": "T", "enonce": "E",
                "blocs": [{"type": "affectation", "variable": "x", "valeur": "1"}, {"type": "ecrire", "valeurs": ["x"]}],
                "indices": ["regarde x"], "entrees": {}}
        un_point = [{"id": "p1", "question": "?", "variable": "x", "moment": {"type": "fin"}}]
        r = self.client.post("/api/exercices", {**base, "points_controle": un_point}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("2 à 4", str(r.json()))
        jamais = un_point + [{"id": "p2", "question": "?", "variable": "x", "moment": {"type": "iteration", "numero": 1}}]
        r = self.client.post("/api/exercices", {**base, "points_controle": jamais}, format="json")
        self.assertIn("jamais atteint", str(r.json()))

    def test_suppression_restrict(self):
        self.client.login(username="admin", password="motdepasse")
        profil = self.client.post("/api/profil", {"pseudo": "Alex"}, format="json").json()["id"]
        exo = Exercice.objects.get(notion="variables", type="coeur")
        self.client.post("/api/tentative", {"profil_id": profil, "exercice_id": str(exo.id)}, format="json")
        self.assertEqual(self.client.delete(f"/api/exercices/{exo.id}").status_code, 409)
        self.assertEqual(self.client.patch(f"/api/exercices/{exo.id}", {"actif": False}, format="json").status_code, 200)
        self.assertTrue(Tentative.objects.filter(exercice=exo).exists())
