"""Le moteur : toutes les règles de la V1, et nulle part ailleurs.

Ce module ne connaît ni HTTP ni l'interface : il reçoit des modèles et des
données, renvoie des dictionnaires, et lève ErreurRegle quand une règle
non négociable est enfreinte. Le client ne calcule jamais un état.
"""

import hmac
import re
import unicodedata

from django.db import transaction
from django.utils import timezone

from . import interpreteur
from .interpreteur import BlocInvalide
from .models import ETAPES, ETATS_VERTS, NOTIONS, CarteMaitrise, ChapitreLu, Exercice, Profil, Tentative

LANGAGES = ("python", "javascript", "java", "c")


class ErreurRegle(Exception):
    def __init__(self, message, statut=409, code="regle"):
        super().__init__(message)
        self.message = message
        self.statut = statut
        self.code = code


# --------------------------------------------------------------------------
# Profils (ARCH-1) : un pseudo suffit
# --------------------------------------------------------------------------


def nettoyer_pseudo(pseudo):
    if not isinstance(pseudo, str):
        return ""
    pseudo = re.sub(r"[\x00-\x1f\x7f]", "", pseudo)
    return re.sub(r"\s+", " ", pseudo).strip()


def verifier_pseudo(pseudo):
    """Format d'un pseudo : lettres, chiffres, _ et un seul @, sans espace, avec au moins une lettre.
    Renvoie le message d'erreur, ou None si le pseudo est valable."""
    if not 2 <= len(pseudo) <= 40:
        return "Le pseudo doit faire entre 2 et 40 caractères."
    if re.search(r"\s", pseudo):
        return "Pas d'espace dans le pseudo : colle les mots ou relie-les avec _ (ex. becca_12)."
    interdits = sorted(set(re.sub(r"[\w@]", "", pseudo)))
    if interdits:
        return f"Caractère non autorisé : {' '.join(interdits)}. Utilise seulement des lettres, des chiffres, _ et @."
    if pseudo.count("@") > 1:
        return "Un seul @ par pseudo."
    if not re.search(r"[^\W\d_]", pseudo):
        return "Le pseudo doit contenir au moins une lettre."
    return None


@transaction.atomic
def creer_profil(pseudo):
    pseudo = nettoyer_pseudo(pseudo)
    if message := verifier_pseudo(pseudo):
        raise ErreurRegle(message, 400, "pseudo_invalide")
    if Profil.objects.filter(pseudo__iexact=pseudo).exists():
        raise ErreurRegle("Ce pseudo est déjà pris : choisis-en un autre.", 409, "pseudo_pris")
    profil = Profil.objects.create(pseudo=pseudo)
    CarteMaitrise.objects.bulk_create(
        [CarteMaitrise(profil=profil, notion=n, etat="a_faire") for n in NOTIONS]
    )
    return profil


def normaliser_code(code):
    """« k7qf m2xp », « K7QFM2XP » ou « K7QF-M2XP » : la même chose."""
    brut = re.sub(r"[^A-Za-z0-9]", "", code or "").upper()
    return f"{brut[:4]}-{brut[4:]}" if len(brut) == 8 else brut


def reprendre_profil(pseudo, code):
    """Retrouver un profil sur un nouvel appareil : le pseudo et son code de reprise."""
    profil = Profil.objects.filter(pseudo__iexact=nettoyer_pseudo(pseudo)).first()
    if profil is None or not hmac.compare_digest(profil.code_reprise, normaliser_code(code)):
        raise ErreurRegle("Pseudo ou code de reprise incorrect.", 404, "reprise_impossible")
    return profil


def toucher_visite(profil):
    profil.derniere_visite = timezone.now()
    profil.save(update_fields=["derniere_visite"])


# --------------------------------------------------------------------------
# Carte de maîtrise (CDC-6) et parcours linéaire
# --------------------------------------------------------------------------


def etats_carte(profil):
    etats = dict(profil.cartes.values_list("notion", "etat"))
    return {n: etats.get(n, "a_faire") for n in NOTIONS}


def carte(profil):
    lignes = {c.notion: c for c in profil.cartes.all()}
    return [
        {
            "notion": n,
            "etat": lignes[n].etat if n in lignes else "a_faire",
            "date_maj": lignes[n].date_maj if n in lignes else None,
        }
        for n in NOTIONS
    ]


def notions_debloquees(etats):
    """Parcours unique : une notion s'ouvre quand toutes les précédentes sont au vert."""
    ouvertes = []
    for n in NOTIONS:
        ouvertes.append(n)
        if etats[n] not in ETATS_VERTS:
            break
    return ouvertes


def prochaine_notion(etats):
    return next((n for n in NOTIONS if etats[n] not in ETATS_VERTS), None)


def _changer_etat(profil, notion, etat):
    ligne, _ = CarteMaitrise.objects.get_or_create(profil=profil, notion=notion)
    if ligne.etat != etat:
        ligne.etat = etat
        ligne.save(update_fields=["etat", "date_maj"])
        return True
    return False


# --------------------------------------------------------------------------
# Calibrage en cascade (CDC-5) : recalculé depuis les tentatives réelles
# --------------------------------------------------------------------------


def _express_par_notion():
    express = Exercice.objects.filter(type="express", actif=True).order_by("ordre", "date_creation")
    par_notion = {n: [] for n in NOTIONS}
    for e in express:
        par_notion[e.notion].append(e)
    return par_notion


def plan_cascade(profil):
    """Premier passage terminé de chaque express = celui qui fait foi.
    2/2 → notion démontrée ; premier échec → la cascade s'arrête."""
    premiers = {}
    for t in Tentative.objects.filter(profil=profil, type="express", terminee=True).order_by("date_debut"):
        premiers.setdefault(t.exercice_id, t)

    # Le test est « en cours » dès qu'une question a été ouverte, même pas encore terminée.
    joue = bool(premiers) or Tentative.objects.filter(profil=profil, type="express").exists()
    notions, prochain, arret = [], None, None
    stoppe = False
    for notion, express in _express_par_notion().items():
        details = []
        for e in express:
            t = premiers.get(e.id)
            resultat = None if t is None else ("juste" if t.sortie_correcte else "faux")
            details.append({"id": e.id, "titre": e.titre, "resultat": resultat})
        entree = {"notion": notion, "express": details, "statut": "non_testee"}
        notions.append(entree)
        if stoppe:
            continue
        if not express:
            stoppe, arret = True, notion
            continue
        for d in details:
            if d["resultat"] == "faux":
                stoppe, arret = True, notion
                entree["statut"] = "echec"
                break
            if d["resultat"] is None:
                prochain = d["id"]
                stoppe = True
                entree["statut"] = "en_cours"
                break
        else:
            entree["statut"] = "demontree"

    if prochain is not None:
        statut = "en_cours" if joue else "a_commencer"
    else:
        statut = "terminee"
    return {
        "statut": statut,
        "prochain_exercice_id": prochain,
        "arret": arret,
        "notions": notions,
    }


@transaction.atomic
def appliquer_calibrage(profil):
    plan = plan_cascade(profil)
    etats = etats_carte(profil)
    changements = []
    for entree in plan["notions"]:
        notion = entree["notion"]
        if entree["statut"] == "demontree" and etats[notion] not in ETATS_VERTS:
            _changer_etat(profil, notion, "demontree")
            changements.append({"notion": notion, "avant": etats[notion], "apres": "demontree"})
    return plan, changements


# --------------------------------------------------------------------------
# Vues « apprenant » des exercices : jamais la solution de référence
# --------------------------------------------------------------------------


def exercice_public(exercice):
    vue = {
        "id": exercice.id,
        "notion": exercice.notion,
        "type": exercice.type,
        "titre": exercice.titre,
        "enonce": exercice.enonce,
        "entrees": exercice.entrees,
        "points_controle": [
            {"id": p["id"], "question": p["question"], "variable": p["variable"], "moment": p["moment"]}
            for p in exercice.points_controle
        ],
        "nb_indices": len(exercice.indices),
    }
    if exercice.type == "express":
        # L'express se lit : l'algorithme est fourni (CDC-4).
        vue["algorithme"] = exercice.algorithme
        vue["lignes"] = interpreteur.Programme(exercice.blocs).lignes
    return vue


def cockpit(profil):
    toucher_visite(profil)
    etats = etats_carte(profil)
    ouvertes = notions_debloquees(etats)
    en_cours = {
        t.exercice_id: t.id
        for t in Tentative.objects.filter(profil=profil, type="coeur", terminee=False)
    }
    reussis = set(
        Tentative.objects.filter(profil=profil, type="coeur", sortie_correcte=True).values_list(
            "exercice_id", flat=True
        )
    )
    coeurs = Exercice.objects.filter(type="coeur", actif=True).order_by("ordre", "date_creation")
    exercices, recompenses, vus = [], [], set()
    for e in coeurs:
        if e.notion in vus:
            continue  # un seul cœur par notion (CDC-1)
        vus.add(e.notion)
        exercices.append({
            "id": e.id,
            "notion": e.notion,
            "titre": e.titre,
            "accessible": e.notion in ouvertes,
            "tentative_en_cours": en_cours.get(e.id),
            "reussi": e.id in reussis,
        })
        if etats[e.notion] in ETATS_VERTS:
            recompenses.append({"notion": e.notion, "titre": e.titre, "langages": e.sorties_langages})
    exercices.sort(key=lambda x: NOTIONS.index(x["notion"]))
    recompenses.sort(key=lambda x: NOTIONS.index(x["notion"]))
    return {
        "profil": {
            "id": profil.id,
            "pseudo": profil.pseudo,
            "derniere_visite": profil.derniere_visite,
            "code_reprise": profil.code_reprise,
        },
        "carte": carte(profil),
        "notions_debloquees": ouvertes,
        "prochaine_notion": prochaine_notion(etats),
        "calibrage": plan_cascade(profil),
        "exercices": exercices,
        "recompenses": recompenses,
    }


def bibliotheque(profil):
    """Tous les cœurs actifs, pour s'entraîner au-delà du cœur de chaque notion (jamais la solution).
    « principal » marque le cœur que montre le cockpit (CDC-1) ; les mêmes règles d'ouverture s'appliquent."""
    ouvertes = notions_debloquees(etats_carte(profil))
    en_cours = {
        t.exercice_id: t.id
        for t in Tentative.objects.filter(profil=profil, type="coeur", terminee=False)
    }
    reussis = set(
        Tentative.objects.filter(profil=profil, type="coeur", sortie_correcte=True).values_list(
            "exercice_id", flat=True
        )
    )
    coeurs = Exercice.objects.filter(type="coeur", actif=True).select_related("fiche").order_by("ordre", "date_creation")
    exercices, principaux = [], set()
    for e in coeurs:
        principal = e.notion not in principaux
        principaux.add(e.notion)
        exercices.append({
            "id": e.id,
            "notion": e.notion,
            "titre": e.titre,
            "enonce": e.enonce,
            "ordre": e.ordre,
            "principal": principal,
            # Classement de la banque, quand l'exercice a sa fiche.
            "niveau": getattr(getattr(e, "fiche", None), "niveau", None),
            "difficulte": getattr(getattr(e, "fiche", None), "difficulte", None),
            "accessible": e.notion in ouvertes,
            "tentative_en_cours": en_cours.get(e.id),
            "reussi": e.id in reussis,
        })
    exercices.sort(key=lambda x: (NOTIONS.index(x["notion"]), x["ordre"]))
    return {"exercices": exercices}


# --------------------------------------------------------------------------
# Tentatives : le cycle complet (CDC-2), vérifié côté serveur
# --------------------------------------------------------------------------


def _rang(etape):
    return ETAPES.index(etape)


def _avancer(tentative, etape):
    if _rang(etape) > _rang(tentative.etape_atteinte):
        tentative.etape_atteinte = etape


def tentative_vue(t):
    return {
        "id": t.id,
        "profil_id": t.profil_id,
        "exercice_id": t.exercice_id,
        "type": t.type,
        "prediction": t.prediction,
        "etape_atteinte": t.etape_atteinte,
        "comparaison_vue": t.comparaison_vue,
        "sortie_correcte": t.sortie_correcte,
        "terminee": t.terminee,
        "date_debut": t.date_debut,
        "date_maj": t.date_maj,
    }


def progression(tentative, resultat=None):
    """Toute réponse de progression : tentative, carte recalculée, notions débloquées."""
    profil = tentative.profil
    etats = etats_carte(profil)
    reponse = {
        "tentative": tentative_vue(tentative),
        "carte": carte(profil),
        "notions_debloquees": notions_debloquees(etats),
    }
    if tentative.type == "express":
        reponse["calibrage"] = plan_cascade(profil)
    if resultat is not None:
        reponse["resultat"] = resultat
    return reponse


def est_coeur_principal(exercice):
    """Le cœur de la notion (CDC-1) : le premier actif, celui que montre le cockpit.
    Les autres cœurs sont de l'entraînement : mêmes règles de cycle, sans effet sur la carte."""
    premier = (
        Exercice.objects.filter(type="coeur", actif=True, notion=exercice.notion)
        .order_by("ordre", "date_creation")
        .values_list("id", flat=True)
        .first()
    )
    return premier == exercice.id


@transaction.atomic
def ouvrir_tentative(profil, exercice):
    if not exercice.actif:
        raise ErreurRegle("Cet exercice n'est plus disponible.", 404, "exercice_inactif")
    # Deux ouvertures simultanées (double clic, double effet React) passent l'une après l'autre :
    # la seconde retrouve la tentative de la première au lieu d'en créer une deuxième.
    Profil.objects.select_for_update().only("pk").get(pk=profil.pk)
    existante = Tentative.objects.filter(profil=profil, exercice=exercice, terminee=False).first()

    if exercice.type == "express":
        plan = plan_cascade(profil)
        if plan["prochain_exercice_id"] != exercice.id:
            raise ErreurRegle(
                "Cet express n'est pas le prochain de ta cascade de calibrage.", 409, "hors_cascade"
            )
    else:
        etats = etats_carte(profil)
        if exercice.notion not in notions_debloquees(etats):
            raise ErreurRegle(
                f"La notion « {exercice.notion} » s'ouvre quand « {prochaine_notion(etats)} » est au vert.",
                403,
                "notion_verrouillee",
            )
        if etats[exercice.notion] == "a_faire" and est_coeur_principal(exercice):
            _changer_etat(profil, exercice.notion, "en_cours")

    if existante:
        return existante, False
    return Tentative.objects.create(profil=profil, exercice=exercice, type=exercice.type), True


def _blocs_pour(tentative, blocs):
    """Express : on exécute l'algorithme fourni. Cœur : celui de l'élève."""
    if tentative.type == "express":
        return tentative.exercice.blocs
    if blocs is None:
        raise ErreurRegle("Envoie les blocs de ton algorithme (« blocs »).", 400, "blocs_manquants")
    return blocs


def _exiger_prediction(tentative):
    if not tentative.prediction:
        raise ErreurRegle(
            "Prédis d'abord : la visualisation se débloque après ta prédiction.", 409, "prediction_requise"
        )


@transaction.atomic
def executer(tentative, blocs=None):
    """Visualisation pas à pas (F5). Interdite avant la prédiction (F4)."""
    _exiger_prediction(tentative)
    exercice = tentative.exercice
    resultat = interpreteur.executer(
        _blocs_pour(tentative, blocs), exercice.entrees, exercice.points_controle
    )
    if not tentative.terminee:
        if tentative.etape_atteinte == "predite":
            _avancer(tentative, "visualisee")
        elif tentative.etape_atteinte == "comparee":
            _avancer(tentative, "corrigee")  # ré-exécution après comparaison = correction
        tentative.save()
    return resultat


def _valider_prediction(exercice, prediction):
    if not isinstance(prediction, dict):
        raise ErreurRegle("La prédiction doit être un objet {points, sortie}.", 400, "prediction_invalide")
    points = prediction.get("points")
    attendus = [p["id"] for p in exercice.points_controle]
    if not isinstance(points, dict) or any(pid not in points for pid in attendus):
        raise ErreurRegle(
            f"Prédis une valeur pour chaque point de contrôle : {', '.join(attendus)}.",
            400,
            "prediction_incomplete",
        )
    sortie = prediction.get("sortie")
    if not isinstance(sortie, (list, str)):
        raise ErreurRegle("Prédis aussi la sortie finale (« sortie »).", 400, "prediction_incomplete")
    return {
        "points": {pid: points[pid] for pid in attendus},
        "sortie": interpreteur.normaliser_console(sortie),
    }


def _exiger_ouverte(tentative):
    if tentative.terminee:
        raise ErreurRegle("Cette tentative est close.", 409, "tentative_close")


@transaction.atomic
def predire(tentative, prediction, blocs=None):
    _exiger_ouverte(tentative)
    if tentative.prediction:
        raise ErreurRegle("Ta prédiction est déjà engagée : place à la visualisation.", 409, "deja_predite")
    if tentative.type == "coeur":
        # On prédit ce que SON code fera : il doit être bien formé.
        interpreteur.Programme(_blocs_pour(tentative, blocs))
    tentative.prediction = _valider_prediction(tentative.exercice, prediction)
    _avancer(tentative, "predite")
    tentative.save()
    return {"prediction": tentative.prediction}


@transaction.atomic
def comparer(tentative, blocs=None):
    """Écran de comparaison (F6) : marque la comparaison comme vue."""
    _exiger_prediction(tentative)
    if _rang(tentative.etape_atteinte) < _rang("visualisee"):
        raise ErreurRegle("Visualise d'abord l'exécution, puis compare.", 409, "visualisation_requise")
    exercice = tentative.exercice
    resultat = interpreteur.executer(
        _blocs_pour(tentative, blocs), exercice.entrees, exercice.points_controle
    )
    comparaison = interpreteur.comparer(tentative.prediction, resultat, exercice.points_controle)
    comparaison["erreur"] = resultat["erreur"]
    if not tentative.terminee:
        tentative.comparaison_vue = True
        _avancer(tentative, "comparee")
        tentative.save()
    return comparaison


def indice(tentative, marche):
    """Échelle d'indices (F7) : une marche par clic, aucune pénalité, rien n'est compté."""
    indices = tentative.exercice.indices
    if not isinstance(marche, int) or not 1 <= marche <= len(indices):
        raise ErreurRegle(f"Marche d'indice invalide : de 1 à {len(indices)}.", 400, "marche_invalide")
    contenu = indices[marche - 1]
    if isinstance(contenu, str):
        contenu = {"texte": contenu}
    return {
        "marche": marche,
        "indice": contenu,
        "derniere": marche == len(indices),
        # Au-delà des marches écrites : le déroulement guidé, c'est-à-dire la visualisation.
        "suivante": "deroulement_guide" if marche == len(indices) else marche + 1,
    }


@transaction.atomic
def soumettre(tentative, blocs=None):
    """La coche verte : cycle entier ET comparaison vue ET sortie correcte (CDC-2)."""
    _exiger_ouverte(tentative)
    _exiger_prediction(tentative)
    if not tentative.comparaison_vue:
        raise ErreurRegle(
            "Compare ta prédiction à la réalité avant de valider.", 409, "comparaison_requise"
        )
    exercice = tentative.exercice
    profil = tentative.profil

    if tentative.type == "express":
        resultat = interpreteur.executer(exercice.blocs, exercice.entrees, exercice.points_controle)
        comparaison = interpreteur.comparer(tentative.prediction, resultat, exercice.points_controle)
        tentative.sortie_correcte = comparaison["tout_juste"]
        tentative.terminee = True
        _avancer(tentative, "reussie" if tentative.sortie_correcte else "comparee")
        tentative.save()
        return {"prediction_juste": tentative.sortie_correcte}

    eleve = interpreteur.executer(_blocs_pour(tentative, blocs), exercice.entrees, exercice.points_controle)
    reference = interpreteur.executer(exercice.blocs, exercice.entrees)
    correcte = eleve["erreur"] is None and interpreteur.consoles_egales(eleve["console"], reference["console"])
    if not correcte:
        tentative.sortie_correcte = False
        tentative.save()
        message = (
            eleve["erreur"]["message"]
            if eleve["erreur"]
            else "Ta sortie ne correspond pas encore à ce que l'énoncé demande. "
                 "Regarde la visualisation de ta boucle, puis corrige."
        )
        return {"valide": False, "message": message, "console": eleve["console"]}

    tentative.sortie_correcte = True
    tentative.terminee = True
    _avancer(tentative, "reussie")
    tentative.save()
    if not est_coeur_principal(exercice):
        return {
            "valide": True,
            "entrainement": True,
            "recompense": {"notion": exercice.notion, "python": exercice.sorties_langages.get("python")},
            "nouvelles_notions": [],
        }
    etats_avant = etats_carte(profil)
    if etats_avant[exercice.notion] not in ETATS_VERTS:  # ne jamais régresser un état déjà acquis
        _changer_etat(profil, exercice.notion, "validee")
    ouvertes_avant = notions_debloquees(etats_avant)
    nouvelles = [n for n in notions_debloquees(etats_carte(profil)) if n not in ouvertes_avant]
    return {
        "valide": True,
        "recompense": {
            "notion": exercice.notion,
            "python": exercice.sorties_langages.get("python"),
        },
        "nouvelles_notions": nouvelles,
    }


# --------------------------------------------------------------------------
# Back-office : validation de forme stricte (BDD-1)
# --------------------------------------------------------------------------


def valider_exercice(donnees):
    """Lève BlocInvalide si l'exercice ne peut pas être sauvegardé.
    Exécute la solution de référence : chaque point de contrôle doit être atteint."""
    interpreteur.valider_points_controle(donnees.get("points_controle"))
    interpreteur.valider_entrees(donnees.get("entrees") or {})
    programme = interpreteur.Programme(donnees.get("blocs"))
    if not programme.corps:
        raise BlocInvalide("L'algorithme de référence est vide.", "blocs")

    indices = donnees.get("indices") or []
    if not isinstance(indices, list) or not 1 <= len(indices) <= 4:
        raise BlocInvalide("Un exercice propose de 1 à 4 marches d'indices.", "indices")
    for i, marche in enumerate(indices):
        if isinstance(marche, str) and marche.strip():
            continue
        if isinstance(marche, dict) and isinstance(marche.get("texte"), str) and marche["texte"].strip():
            if "blocs" in marche:
                interpreteur.Programme(marche["blocs"])
            continue
        raise BlocInvalide("Chaque marche d'indice a un « texte » (et des « blocs » facultatifs).", f"indices[{i}]")

    sorties = donnees.get("sorties_langages") or {}
    if not isinstance(sorties, dict) or any(k not in LANGAGES or not isinstance(v, str) for k, v in sorties.items()):
        raise BlocInvalide(f"sorties_langages : clés possibles {', '.join(LANGAGES)}, valeurs texte.", "sorties_langages")
    if donnees.get("type") == "coeur" and not sorties.get("python"):
        raise BlocInvalide("Un cœur doit fournir sa version Python (récompense de fin de notion).", "sorties_langages")

    resultat = interpreteur.executer(programme, donnees.get("entrees") or {}, donnees["points_controle"])
    if resultat["erreur"]:
        raise BlocInvalide(
            f"La solution de référence échoue ligne {resultat['erreur']['ligne']} : {resultat['erreur']['message']}",
            "blocs",
        )
    for pid, etat in resultat["points"].items():
        if not etat["atteint"]:
            raise BlocInvalide(f"Le point de contrôle « {pid} » n'est jamais atteint par la référence.", "points_controle")
    return resultat


def supprimer_exercice(exercice):
    if exercice.tentatives.exists():
        raise ErreurRegle(
            "Cet exercice a des tentatives : désactive-le (actif = false) au lieu de le supprimer.",
            409,
            "suppression_interdite",
        )
    exercice.delete()


# --------------------------------------------------------------------------
# Lecture du cours : les chapitres marqués comme terminés
# --------------------------------------------------------------------------

MAX_CHAPITRES = 50


def chapitres_lus(profil):
    return list(profil.chapitres_lus.values_list("chapitre", flat=True))


@transaction.atomic
def marquer_chapitre(profil, chapitre, termine):
    if termine:
        if profil.chapitres_lus.count() >= MAX_CHAPITRES and not profil.chapitres_lus.filter(chapitre=chapitre).exists():
            raise ErreurRegle("Trop de chapitres enregistrés pour ce profil.", 400, "trop_de_chapitres")
        ChapitreLu.objects.get_or_create(profil=profil, chapitre=chapitre)
    else:
        profil.chapitres_lus.filter(chapitre=chapitre).delete()
    return chapitres_lus(profil)


# --------------------------------------------------------------------------
# Banque d'exercices : validation des fiches (comme le back-office pour les exercices)
# --------------------------------------------------------------------------

NATURES_SOURCE = {"reprise", "reformulation", "variante"}


def valider_fiche(f):
    """Lève ValueError si une fiche de la banque est incomplète ou mal formée."""
    from .models import NIVEAUX, NOTIONS_BANQUE

    def erreur(message):
        raise ValueError(f"{f.get('cle', '?')} : {message}")

    if not re.fullmatch(r"[a-z0-9-]{1,60}", f.get("cle") or ""):
        erreur("clé invalide (minuscules, chiffres et tirets)")
    for champ, maxi in (("titre", 120), ("description", 240)):
        if not isinstance(f.get(champ), str) or not f[champ].strip() or len(f[champ]) > maxi:
            erreur(f"{champ} obligatoire, {maxi} caractères au plus")
    if not isinstance(f.get("enonce"), str) or len(f["enonce"].strip()) < 20:
        erreur("énoncé manquant ou trop court")
    if f.get("niveau") not in NIVEAUX:
        erreur(f"niveau parmi {NIVEAUX}")
    if not isinstance(f.get("difficulte"), int) or not 1 <= f["difficulte"] <= 5:
        erreur("difficulté entière de 1 à 5")
    if f.get("notion") not in NOTIONS_BANQUE:
        erreur(f"notion inconnue : {f.get('notion')}")
    if any(n not in NOTIONS_BANQUE for n in f.get("notions_secondaires", [])):
        erreur("notion secondaire inconnue")
    if not f.get("objectifs") or not all(isinstance(o, str) and o.strip() for o in f["objectifs"]):
        erreur("au moins un objectif pédagogique")
    src = f.get("source") or {}
    if not src.get("document") or src.get("nature") not in NATURES_SOURCE:
        erreur("source : document et nature (reprise, reformulation, variante) obligatoires")
    for champ in ("prerequis", "indices", "exemples", "tags"):
        if not isinstance(f.get(champ, []), list):
            erreur(f"{champ} doit être une liste")


def _sans_accents(texte):
    return unicodedata.normalize("NFD", texte).encode("ascii", "ignore").decode().lower()


def banque(filtres):
    """Les fiches actives de la banque, filtrées ; jamais la correction (elle reste au back-office)."""
    from .models import ExerciceBanque

    qs = ExerciceBanque.objects.filter(actif=True)
    for champ in ("niveau", "notion"):
        if valeur := filtres.get(champ):
            qs = qs.filter(**{f"{champ}__in": valeur.split(",")})
    if valeur := filtres.get("difficulte"):
        qs = qs.filter(difficulte__in=[int(v) for v in valeur.split(",") if v.isdigit()])
    if (valeur := filtres.get("jouable")) in ("0", "1"):
        qs = qs.filter(exercice__isnull=valeur == "0")
    fiches = list(qs)
    if tag := filtres.get("tag"):
        fiches = [f for f in fiches if tag in f.tags or tag in f.notions_secondaires]
    if q := _sans_accents((filtres.get("q") or "").strip()):
        fiches = [f for f in fiches if q in _sans_accents(f"{f.titre} {f.enonce} {' '.join(f.tags)}")]
    ordre_niveau = {"debutant": 0, "intermediaire": 1, "avance": 2}
    fiches.sort(key=lambda f: (ordre_niveau[f.niveau], f.difficulte, f.notion, f.titre))
    return {
        "nombre": len(fiches),
        "exercices": [
            {
                "cle": f.cle, "titre": f.titre, "description": f.description, "enonce": f.enonce,
                "consignes": f.consignes, "niveau": f.niveau, "difficulte": f.difficulte, "notion": f.notion,
                "notions_secondaires": f.notions_secondaires, "objectifs": f.objectifs, "prerequis": f.prerequis,
                "exemples": f.exemples, "indices": f.indices, "complexite": f.complexite, "tags": f.tags,
                "source": {k: f.source.get(k) for k in ("document", "auteur", "chapitre", "numero", "nature")},
                "remarques": f.remarques, "jouable": f.exercice_id is not None, "exercice_id": f.exercice_id,
                "correction_disponible": bool(f.solution), "correction_verifiee": f.solution_verifiee,
            }
            for f in fiches
        ],
    }
