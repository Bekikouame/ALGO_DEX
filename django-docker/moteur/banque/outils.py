"""Construction des fiches : valeurs par défaut cohérentes (prérequis, tags, description)."""

SOURCES = {
    "bouchiha": {"document": "Algorithmique et programmation en Pascal", "auteur": "D. Bouchiha"},
    "debrauwer": {"document": "Algorithmique — Entraînez-vous et améliorez votre pratique de la programmation", "auteur": "L. Debrauwer (ENI)"},
    "challenge": {"document": "Challenge d'entraînement Algorithme", "auteur": "non précisé"},
    "assale": {"document": "Algorithme et Programmation (cours et TD)", "auteur": "A. L. Assalé (INP-HB)"},
    "recursivite": {"document": "Exercices sur la récursivité", "auteur": "A. L. Assalé (INP-HB)"},
    "td_sdc": {"document": "Travaux dirigés : structures de données complexes", "auteur": "A. L. Assalé (INP-HB)"},
    "algodex": {"document": "Exercices de démonstration ALGO_DEX", "auteur": "ALGO_DEX"},
    "acte": {"document": "Exercices actés du cahier des charges ALGO_DEX (12 exercices, section 16)", "auteur": "Porteur du projet"},
}

# Ce qu'il faut savoir avant d'aborder une notion (parcours ALGO_DEX, puis notions avancées).
PREREQUIS = {
    "variables": ["Affectation", "Opérations arithmétiques"],
    "conditions": ["Variables et affectation", "Expressions booléennes"],
    "boucles": ["Variables", "Conditions"],
    "tableaux": ["Boucle pour", "Conditions", "Indices à partir de 0"],
    "chaines": ["Variables", "Boucles", "Tableaux"],
    "fonctions": ["Variables", "Conditions", "Boucles"],
    "recursivite": ["Fonctions et procédures", "Conditions"],
    "tableaux_2d": ["Tableaux à une dimension", "Boucles imbriquées"],
    "complexite": ["Boucles", "Tableaux", "Fonctions"],
    "enregistrements": ["Variables et types", "Tableaux"],
    "fichiers": ["Enregistrements", "Boucles"],
    "pointeurs": ["Variables et types", "Enregistrements"],
    "listes_chainees": ["Pointeurs", "Enregistrements", "Procédures et fonctions"],
    "piles_files": ["Tableaux ou listes chaînées", "Procédures et fonctions"],
    "arbres": ["Pointeurs", "Récursivité"],
    "graphes": ["Tableaux à deux dimensions", "Listes chaînées", "Boucles imbriquées"],
    "hachage": ["Tableaux", "Listes chaînées", "Chaînes de caractères"],
    "objets": ["Enregistrements", "Fonctions et procédures"],
}

NATURES = {"reprise", "reformulation", "variante"}


def source(code, chapitre=None, numero=None, nature="reformulation", autres=None):
    s = {**SOURCES[code], "code": code, "chapitre": chapitre, "numero": numero, "nature": nature}
    if autres:
        s["autres_sources"] = autres
    return s


def fiche(cle, titre, notion, niveau, difficulte, enonce, objectifs, src, *, secondaires=(), tags=(),
          indices=(), exemples=(), complexite=None, remarques="", consignes="", description=None, prerequis=None,
          solution=""):
    premiere = enonce.split(". ")[0].rstrip(".") + "."
    return {
        "cle": cle,
        "titre": titre,
        "description": (description or premiere)[:240],
        "enonce": enonce,
        "consignes": consignes,
        "niveau": niveau,
        "difficulte": difficulte,
        "notion": notion,
        "notions_secondaires": list(secondaires),
        "objectifs": list(objectifs),
        "prerequis": list(prerequis if prerequis is not None else PREREQUIS[notion]),
        "exemples": list(exemples),
        "indices": list(indices),
        "complexite": complexite or {},
        "source": src,
        "tags": sorted({notion, niveau, *secondaires, *tags}),
        "remarques": remarques,
        "solution": solution,
    }
