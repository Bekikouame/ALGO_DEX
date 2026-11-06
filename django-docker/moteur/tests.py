from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.management import call_command
from unittest.mock import patch
from rest_framework.test import APITestCase

from . import interpreteur
from .interpreteur import BlocInvalide
from .models import CarteMaitrise, Exercice, Tentative
from .views import LimiteCreationProfil, LimiteReprise

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
        cache.clear()  # les compteurs de limites ne passent pas d'un test à l'autre
        call_command("charger_actes", stdout=open("/dev/null", "w"))
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
                         ["L'échange des clés", "Le gardien de la fête", "La table de multiplication",
                          "Le compteur de pairs"])
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

    def test_format_pseudo(self):
        creer = lambda p: self.client.post("/api/profil", {"pseudo": p}, format="json")
        for valable in ["becca", "becc@", "becc__", "becc12", "@becca", "__moi", "Léa", "  bob  "]:
            self.assertEqual(creer(valable).status_code, 201, valable)
        for refuse in ["sans nom", "@@", "$$$", "123", "__", "be@c@", "b@@b", "becca!", "a", "x" * 41, "é-lo"]:
            r = creer(refuse)
            self.assertEqual(r.status_code, 400, refuse)
        self.assertIn("espace", creer("sans nom").json()["detail"])
        self.assertIn("au moins une lettre", creer("123").json()["detail"])
        self.assertIn("Un seul @", creer("b@@b").json()["detail"])

    def test_limites(self):
        cache.clear()
        # DRF lit les taux au chargement de la classe : on remplace ceux de la limite de création.
        with patch.object(LimiteCreationProfil, "THROTTLE_RATES", {"creation_profil": "3/hour"}):
            statuts = [self.client.post("/api/profil", {"pseudo": f"limite{n}"}, format="json").status_code for n in range(4)]
        self.assertEqual(statuts, [201, 201, 201, 429])
        ids = ",".join(["00000000-0000-0000-0000-000000000000"] * 21)
        self.assertEqual(self.client.get(f"/api/profil?ids={ids}").status_code, 400)

    def test_reprise_par_code(self):
        cree = self.client.post("/api/profil", {"pseudo": "lina"}, format="json").json()
        code = cree["code_reprise"]
        self.assertRegex(code, r"^[A-Z2-9]{4}-[A-Z2-9]{4}$")
        self.assertNotIn("code_reprise", self.client.get(f"/api/profil?ids={cree['id']}").json()[0])
        cockpit = self.client.get(f"/api/cockpit?profil_id={cree['id']}").json()
        self.assertEqual(cockpit["profil"]["code_reprise"], code)
        reprendre = lambda pseudo, c: self.client.post("/api/profil/reprendre", {"pseudo": pseudo, "code": c}, format="json")
        # pseudo sans tenir compte de la casse, code avec ou sans tiret, en minuscules
        r = reprendre("LINA", code.replace("-", "").lower())
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["id"], cree["id"])
        self.assertEqual(reprendre("lina", "AAAA-AAAA").status_code, 404)
        self.assertEqual(reprendre("personne", code).status_code, 404)

    def test_reprise_limitee(self):
        cache.clear()
        with patch.object(LimiteReprise, "THROTTLE_RATES", {"reprise": "2/hour"}):
            statuts = [self.client.post("/api/profil/reprendre", {"pseudo": "Alex", "code": "AAAA-AAAA"}, format="json").status_code
                       for _ in range(3)]
        self.assertEqual(statuts, [404, 404, 429])

    def test_chapitres_lus(self):
        lire = lambda: self.client.get(f"/api/cours?profil_id={self.profil}").json()["termines"]
        marquer = lambda c, t: self.client.post("/api/cours", {"profil_id": self.profil, "chapitre": c, "termine": t}, format="json")
        self.assertEqual(lire(), [])
        self.assertEqual(marquer("introduction", True).json()["termines"], ["introduction"])
        marquer("introduction", True)  # deux fois : un seul enregistrement
        marquer("variables-et-types", True)
        self.assertEqual(lire(), ["introduction", "variables-et-types"])
        marquer("introduction", False)
        self.assertEqual(lire(), ["variables-et-types"])
        self.assertEqual(marquer("../Pas Valable", True).status_code, 400)

    def test_entrainement_sans_effet_sur_la_carte(self):
        muet = open("/dev/null", "w")
        call_command("charger_bibliotheque", stdout=muet)
        carte = lambda: {c["notion"]: c["etat"] for c in self.client.get(f"/api/cockpit?profil_id={self.profil}").json()["carte"]}
        exo = Exercice.objects.get(titre="Échanger avec une variable temporaire")
        r = self.ouvrir(exo)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(carte()["variables"], "a_faire")  # ouvrir un entraînement ne change rien
        tid = r.json()["tentative"]["id"]
        reel = interpreteur.executer(exo.blocs, exo.entrees, exo.points_controle)
        self.patch(tid, action="predire", blocs=exo.blocs,
                   prediction={"points": {p: v["valeur"] for p, v in reel["points"].items()}, "sortie": reel["console"]})
        self.client.post("/api/executer", {"tentative_id": tid, "blocs": exo.blocs}, format="json")
        self.patch(tid, action="comparer", blocs=exo.blocs)
        fin = self.patch(tid, action="soumettre", blocs=exo.blocs).json()
        self.assertTrue(fin["resultat"]["valide"])
        self.assertTrue(fin["resultat"]["entrainement"])
        self.assertEqual(carte()["variables"], "a_faire")  # réussir non plus : seul le cœur principal valide
        ok = self.client.get(f"/api/bibliotheque?profil_id={self.profil}").json()["exercices"]
        self.assertTrue(next(e for e in ok if e["id"] == str(exo.id))["reussi"])

    def test_coeurs_actes(self):
        attendu = {
            "L'échange des clés": ([9, 4, 4], ["a = 9", "b = 4"]),
            "Le gardien de la fête": (["entrée accompagnée", 15], ["entrée accompagnée"]),
            "La table de multiplication": ([3, 5], [f"7 × {i} = {7 * i}" for i in range(1, 6)]),
            "Le compteur de pairs": ([2, 4], ["Pairs : 2"]),
        }
        principaux = Exercice.objects.filter(type="coeur", ordre=1)
        self.assertEqual({e.titre for e in principaux}, set(attendu))
        for e in principaux:
            r = interpreteur.executer(e.blocs, e.entrees, e.points_controle)
            self.assertEqual([p["valeur"] for p in r["points"].values()], attendu[e.titre][0], e.titre)
            self.assertEqual(r["console"], attendu[e.titre][1], e.titre)

    def test_ouverture_atomique(self):
        """select_for_update exige une transaction : sur PostgreSQL, sans elle, ouvrir un exercice plante."""
        from . import regles
        self.assertTrue(hasattr(regles.ouvrir_tentative, "__wrapped__"))

    def test_questions_du_test_de_niveau(self):
        """Les 8 express actés : valeurs et sorties attendues, relevées dans leurs énoncés d'origine."""
        attendu = {
            "La chaîne d'affectations": ([7, 2, 14], ["x vaut 14", "y vaut 2"]),
            "La caisse du magasin": ([36, 30, 2], ["Total : 30", "Rendu : 2"]),
            "Pair ou impair ?": (["impair", 7], ["impair", "fin du test"]),
            "La mention": (["passable", 12], ["Résultat : passable"]),
            "L'escalier des sommes": ([3, 3, 10, 15], ["Somme : 15"]),
            "Le compte à rebours": ([1, 0, 0], ["3", "2", "1", "Décollage !"]),
            "La caisse du marché": ([11, 2, 22], ["Total : 22"]),
            "Le sommet": ([12, 3, 12], ["Max : 12"]),
        }
        express = Exercice.objects.filter(type="express", actif=True)
        self.assertEqual({e.titre for e in express}, set(attendu))
        for e in express:
            r = interpreteur.executer(e.blocs, e.entrees, e.points_controle)
            self.assertEqual([p["valeur"] for p in r["points"].values()], attendu[e.titre][0], e.titre)
            self.assertEqual(r["console"], attendu[e.titre][1], e.titre)
            self.assertTrue(all(p["atteint"] for p in r["points"].values()), e.titre)

    def test_reponses_du_catalogue(self):
        """Les réponses écrites à la main dans le catalogue, recalculées ici."""
        import heapq
        from .banque.catalogue_lecture import DISTANCES_DEPUIS_C, GRAPHE_DIJKSTRA
        dist, file = {"C": 0}, [(0, "C")]
        while file:
            d, s = heapq.heappop(file)
            for v, p in GRAPHE_DIJKSTRA[s].items():
                if d + p < dist.get(v, 10**9):
                    dist[v] = d + p
                    heapq.heappush(file, (d + p, v))
        self.assertEqual(dist, DISTANCES_DEPUIS_C)
        self.assertEqual([[2 * k + m + 1 for m in (1, 2)] for k in (1, 2)], [[4, 5], [6, 7]])
        self.assertEqual([[k + 1 + 4 * m for m in (1, 2)] for k in (1, 4)], [[6, 10], [9, 13]])

        def imp_par_variable():  # bouchiha-6-6
            i, sortie = 1, []
            while i < 10:
                sortie.append(i)
                i += 2
                i += 3
            return sortie
        self.assertEqual(imp_par_variable(), [1, 6])

    def test_banque(self):
        from .models import ExerciceBanque
        muet = open("/dev/null", "w")
        call_command("charger_bibliotheque", stdout=muet)
        call_command("importer_banque", stdout=muet)
        total, jouables = ExerciceBanque.objects.count(), ExerciceBanque.objects.filter(exercice__isnull=False).count()
        self.assertGreater(total, 200)
        call_command("importer_banque", stdout=muet)  # réexécutable : aucun doublon
        self.assertEqual(ExerciceBanque.objects.count(), total)
        self.assertEqual(Exercice.objects.filter(titre="Le tri à bulles avec arrêt anticipé").count(), 1)
        # chaque fiche jouable a sa correction exécutée par le moteur
        self.assertFalse(ExerciceBanque.objects.filter(exercice__isnull=False, solution_verifiee=False).exists())

        b = self.client.get("/api/banque").json()
        self.assertEqual(b["nombre"], total)
        self.assertTrue(all("solution" not in e for e in b["exercices"]))  # jamais la correction
        self.assertEqual(sum(e["jouable"] for e in b["exercices"]), jouables)
        avances = self.client.get("/api/banque?niveau=avance&notion=arbres").json()["exercices"]
        self.assertTrue(avances and all(e["niveau"] == "avance" and e["notion"] == "arbres" for e in avances))
        faciles = self.client.get("/api/banque?difficulte=1,2&jouable=1").json()["exercices"]
        self.assertTrue(faciles and all(e["difficulte"] <= 2 and e["jouable"] for e in faciles))
        self.assertTrue(self.client.get("/api/banque?q=hanoi").json()["nombre"] >= 1)

        # le parcours n'est pas touché : 4 cœurs principaux, 8 questions au test de niveau
        cockpit = self.client.get(f"/api/cockpit?profil_id={self.profil}").json()
        self.assertEqual([e["titre"] for e in cockpit["exercices"]],
                         ["L'échange des clés", "Le gardien de la fête", "La table de multiplication", "Le compteur de pairs"])
        self.assertEqual(sum(len(n["express"]) for n in cockpit["calibrage"]["notions"]), 8)
        biblio = self.client.get(f"/api/bibliotheque?profil_id={self.profil}").json()["exercices"]
        self.assertTrue(all(e["niveau"] for e in biblio))

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

        faux = [{"type": "affectation", "variable": "temp", "valeur": "a"},
                {"type": "affectation", "variable": "a", "valeur": "b"},
                {"type": "affectation", "variable": "b", "valeur": "a"},
                {"type": "ecrire", "valeurs": ['"a ="', "a"]},
                {"type": "ecrire", "valeurs": ['"b ="', "b"]}]
        juste = exo.blocs

        # F4 : pas de visualisation sans prédiction.
        self.assertEqual(self.client.post("/api/executer", {"tentative_id": tid, "blocs": faux},
                                          format="json").status_code, 409)
        self.patch(tid, action="predire", prediction={"points": {"p1": 9, "p2": 9, "p3": 4}, "sortie": ["a = 9", "b = 9"]}, blocs=faux)
        self.assertEqual(self.patch(tid, action="predire", prediction={"points": {"p1": 0, "p2": 0, "p3": 0}, "sortie": []},
                                    blocs=faux).status_code, 409)
        # Comparer exige d'avoir visualisé ; valider exige d'avoir comparé.
        self.assertEqual(self.patch(tid, action="comparer", blocs=faux).status_code, 409)
        self.client.post("/api/executer", {"tentative_id": tid, "blocs": faux}, format="json")
        self.assertEqual(self.patch(tid, action="soumettre", blocs=juste).status_code, 409)

        comparaison = self.patch(tid, action="comparer", blocs=faux).json()["resultat"]
        self.assertTrue(comparaison["tout_juste"])  # prédire juste un code faux reste possible

        r = self.patch(tid, action="soumettre", blocs=faux).json()
        self.assertFalse(r["resultat"]["valide"])
        self.assertNotIn("b = 4", str(r))  # la sortie de référence ne fuit pas

        self.client.post("/api/executer", {"tentative_id": tid, "blocs": juste}, format="json")
        r = self.patch(tid, action="soumettre", blocs=juste).json()
        self.assertTrue(r["resultat"]["valide"])
        self.assertIn("temp = a", r["resultat"]["recompense"]["python"])
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
        self.patch(tid, action="predire", prediction={"points": {"p1": 9, "p2": 4, "p3": 4}, "sortie": ["a = 9", "b = 4"]},
                   blocs=exo.blocs)
        self.client.post("/api/executer", {"tentative_id": tid, "blocs": exo.blocs}, format="json")
        self.patch(tid, action="comparer", blocs=exo.blocs)
        r = self.patch(tid, action="soumettre", blocs=exo.blocs).json()
        self.assertEqual({c["notion"]: c["etat"] for c in r["carte"]}["variables"], "demontree")

    def test_indices(self):
        tid = self.ouvrir(self.exo("variables", "coeur")).json()["tentative"]["id"]
        r = self.patch(tid, action="indice", marche=4).json()["resultat"]
        self.assertTrue(r["derniere"])
        self.assertEqual(r["suivante"], "deroulement_guide")
        self.assertEqual(self.patch(tid, action="indice", marche=9).status_code, 400)


class BackOfficeTests(APITestCase):
    def setUp(self):
        call_command("charger_actes", stdout=open("/dev/null", "w"))
        call_command("charger_demo", stdout=open("/dev/null", "w"))
        User.objects.create_superuser("admin", "", "motdepasse")

    def test_reserve_aux_admins(self):
        self.assertIn(self.client.get("/api/exercices").status_code, (401, 403))
        self.client.login(username="admin", password="motdepasse")
        self.assertEqual(len(self.client.get("/api/exercices").json()), 16)

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
        exo = Exercice.objects.get(notion="variables", type="coeur", ordre=1)
        self.client.post("/api/tentative", {"profil_id": profil, "exercice_id": str(exo.id)}, format="json")
        self.assertEqual(self.client.delete(f"/api/exercices/{exo.id}").status_code, 409)
        self.assertEqual(self.client.patch(f"/api/exercices/{exo.id}", {"actif": False}, format="json").status_code, 200)
        self.assertTrue(Tentative.objects.filter(exercice=exo).exists())
