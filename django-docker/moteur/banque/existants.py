"""Fiches des exercices déjà en base (démonstration et bibliothèque), reliées par leur titre.

L'énoncé et les indices sont repris de l'exercice exécutable à l'import (enonce vide ici).
"""

from .outils import fiche, source


def E(titre, notion, niveau, difficulte, objectifs, src, **reste):
    return {"titre_exercice": titre, "fiche": fiche(_cle(titre), titre, notion, niveau, difficulte, "", objectifs, src, **reste)}


def _cle(titre):
    import unicodedata, re
    s = unicodedata.normalize("NFD", titre).encode("ascii", "ignore").decode().lower()
    return "algodex-" + re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:50]


ACTE = source("acte", nature="reprise")
EXPRESS = ["express", "prediction", "test-de-niveau"]
PRINCIPAL = ["coeur-principal"]
DEMO = "Exercice d'entraînement écrit pour les premiers tests de l'application, hors des 12 exercices actés."

EXISTANTS = [
    # ------------------------------------------------ test de niveau : les 8 express actés
    E("La chaîne d'affectations", "variables", "debutant", 1, ["Suivre plusieurs affectations qui se réutilisent"], ACTE, tags=EXPRESS),
    E("La caisse du magasin", "variables", "debutant", 2, ["Suivre un calcul en plusieurs étapes", "Lire mod"], ACTE, tags=EXPRESS),
    E("Pair ou impair ?", "conditions", "debutant", 1, ["Prévoir quelle branche s'exécute"], ACTE, tags=EXPRESS),
    E("La mention", "conditions", "debutant", 2, ["Suivre des conditions imbriquées"], ACTE, tags=EXPRESS),
    E("L'escalier des sommes", "boucles", "debutant", 1, ["Dérouler une boucle pour tour par tour"], ACTE, tags=EXPRESS + ["accumulateur"]),
    E("Le compte à rebours", "boucles", "debutant", 2, ["Dérouler une boucle tant que", "Repérer la sortie de boucle"], ACTE, tags=EXPRESS),
    E("La caisse du marché", "tableaux", "debutant", 1, ["Suivre le parcours d'un tableau"], ACTE, tags=EXPRESS + ["accumulateur"]),
    E("Le sommet", "tableaux", "debutant", 2, ["Suivre la mise à jour d'un maximum"], ACTE, tags=EXPRESS),

    # ------------------------------------------------ parcours : les 4 cœurs actés
    E("L'échange des clés", "variables", "debutant", 2, ["Permuter deux variables avec une variable temporaire"], ACTE, tags=PRINCIPAL),
    E("Le gardien de la fête", "conditions", "debutant", 3, ["Écrire une condition à trois issues", "Combiner deux tests avec et"], ACTE, tags=PRINCIPAL),
    E("La table de multiplication", "boucles", "debutant", 2, ["Répéter un affichage avec une boucle pour"], ACTE, tags=PRINCIPAL),
    E("Le compteur de pairs", "tableaux", "debutant", 3, ["Combiner boucle, condition et compteur"], ACTE, tags=PRINCIPAL + ["compteur"]),

    # ------------------------------------------------ entraînement : premiers exercices de l'application
    E("La moyenne de deux notes", "variables", "debutant", 1, ["Enchaîner deux calculs dépendants"],
      source("algodex", nature="reprise", autres=[{"code": "bouchiha", "chapitre": 2, "numero": 3}]),
      tags=["entrainement"], remarques=DEMO),
    E("Le plus grand des deux", "conditions", "debutant", 1, ["Écrire une alternative si/sinon complète"],
      source("algodex", nature="reprise"), tags=["entrainement"], remarques=DEMO),
    E("La factorielle", "boucles", "debutant", 2, ["Initialiser correctement un produit", "Écrire une boucle pour"],
      source("algodex", nature="reprise", autres=[{"code": "bouchiha", "chapitre": 4, "numero": 2}]),
      tags=["entrainement", "accumulateur"], remarques=DEMO),
    E("La somme d'un tableau", "tableaux", "debutant", 1, ["Parcourir toutes les cases d'un tableau"],
      source("algodex", nature="reprise"), tags=["entrainement", "accumulateur"], remarques=DEMO),

    # ------------------------------------------------ bibliothèque (cours de D. Bouchiha)
    E("La surface d'un cercle", "variables", "debutant", 1, ["Utiliser une constante", "Décomposer un calcul"],
      source("bouchiha", 1, None, "reformulation")),
    E("Le périmètre et la surface d'un rectangle", "variables", "debutant", 1, ["Traduire une formule en affectations"],
      source("bouchiha", 2, 7)),
    E("Échanger avec une variable temporaire", "variables", "debutant", 1, ["Permuter deux variables sans perte"],
      source("bouchiha", 2, 11)),
    E("Des secondes en heures", "variables", "debutant", 2, ["Utiliser div et mod pour convertir des unités"],
      source("bouchiha", 2, 12)),
    E("Les priorités de calcul", "variables", "debutant", 2, ["Appliquer les priorités des opérateurs"],
      source("bouchiha", 2, 1)),
    E("Une expression logique", "variables", "debutant", 2, ["Évaluer et, ou, non"], source("bouchiha", 2, 1)),
    E("La valeur absolue", "conditions", "debutant", 1, ["Écrire une alternative simple"], source("bouchiha", 3, 2)),
    E("Le plus grand de trois nombres", "conditions", "debutant", 2, ["Combiner des conditions avec et", "Imbriquer des si"],
      source("bouchiha", 3, 5)),
    E("Le signe d'un produit", "conditions", "debutant", 2, ["Traiter trois cas dont le cas nul"],
      source("bouchiha", 3, 7, "variante", autres=[{"code": "bouchiha", "chapitre": 3, "numero": 1}])),
    E("L'année bissextile", "conditions", "intermediaire", 2, ["Écrire une condition composée avec des exceptions"],
      source("bouchiha", 3, 16, autres=[{"code": "debrauwer", "chapitre": 1, "numero": 6}])),
    E("La mention détaillée", "conditions", "debutant", 2, ["Ordonner des tests sur des seuils"], source("bouchiha", 3, None, "variante"),
      remarques="Pas d'exercice équivalent dans la source : variante ALGO_DEX inspirée du chapitre sur les conditions."),
    E("La somme de 1 à n", "boucles", "debutant", 1, ["Accumuler dans une boucle pour"], source("bouchiha", 4, 1),
      tags=["accumulateur"]),
    E("Une table de multiplication", "boucles", "debutant", 1, ["Afficher dans une boucle"], source("bouchiha", 4, 7)),
    E("La puissance", "boucles", "debutant", 1, ["Multiplier de façon répétée"], source("bouchiha", 4, 3)),
    E("La somme des nombres pairs", "boucles", "debutant", 2, ["Filtrer dans une boucle avec mod"],
      source("debrauwer", 1, 4, "variante"), tags=["accumulateur"]),
    E("Compter les chiffres", "boucles", "debutant", 2, ["Choisir une boucle tant que", "Utiliser div"],
      source("bouchiha", 4, 14, "variante")),
    E("Le PGCD d'Euclide", "boucles", "intermediaire", 3, ["Traduire l'algorithme d'Euclide", "Faire glisser des variables"],
      source("bouchiha", 4, 8, autres=[{"code": "debrauwer", "chapitre": 1, "numero": 13}]),
      complexite={"temps": "O(log min(m, n))", "espace": "O(1)"}),
    E("Les tables imbriquées", "boucles", "intermediaire", 2, ["Comprendre les boucles imbriquées"],
      source("bouchiha", 4, None, "variante"), tags=["boucles-imbriquees"]),
    E("La moyenne d'un tableau", "tableaux", "debutant", 2, ["Accumuler puis diviser par la longueur"],
      source("bouchiha", 5, 4, autres=[{"code": "debrauwer", "chapitre": 2, "numero": 1}])),
    E("Le maximum et sa position", "tableaux", "debutant", 2, ["Retenir une valeur et sa position"],
      source("bouchiha", 5, 5, autres=[{"code": "bouchiha", "chapitre": 4, "numero": 10}])),
    E("Chercher avec un drapeau", "tableaux", "intermediaire", 2, ["Arrêter une recherche avec un drapeau"],
      source("bouchiha", 5, 3, autres=[{"code": "debrauwer", "chapitre": 2, "numero": 3}]), tags=["drapeau", "recherche"],
      complexite={"temps": "O(n)", "espace": "O(1)"}),
    E("La recherche dichotomique", "tableaux", "intermediaire", 3, ["Diviser l'espace de recherche par deux"],
      source("bouchiha", 5, None, "reformulation", autres=[{"code": "challenge", "chapitre": None, "numero": 3}]),
      tags=["recherche"], complexite={"temps": "O(log n)", "espace": "O(1)"}),
    E("Inverser un tableau", "tableaux", "intermediaire", 2, ["Échanger des cases symétriques"], source("bouchiha", 5, 16),
      complexite={"temps": "O(n)", "espace": "O(1)"}),
    E("Le tri par sélection", "tableaux", "intermediaire", 3, ["Trier par sélection du minimum"],
      source("bouchiha", 5, 14, autres=[{"code": "debrauwer", "chapitre": 2, "numero": 10}]), tags=["tri"],
      complexite={"temps": "O(n²)", "espace": "O(1)"}),
]
