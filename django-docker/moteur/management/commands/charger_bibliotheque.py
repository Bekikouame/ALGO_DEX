"""Charge la BIBLIOTHÈQUE d'exercices, tirée du cours « Algorithmique et programmation »
(D. Bouchiha, chapitres 1 à 6), réécrite en blocs ALGO_DEX.

Ce sont des cœurs (l'élève écrit l'algorithme) d'ordre 2 et plus : le cockpit garde
le cœur d'ordre 1 de chaque notion (CDC-1), et le test de niveau ne voit que les express.
Les données fournies (« lire » du cours) sont des entrées ; les tableaux commencent à 0.
Chaque exercice passe par la même validation que le back-office.
"""

from django.core.management.base import BaseCommand, CommandError

from moteur.models import Exercice
from moteur.serializers import ExerciceSerializer

from .charger_demo import aff, ecrire, point, pour, si, tant_que

EXERCICES = [
    # ---------------------------------------------------------------- variables
    {
        "notion": "variables", "ordre": 2,
        "titre": "La surface d'un cercle",
        "enonce": "Le rayon d'un cercle est fourni. Range 3,14 dans une variable PI, calcule la surface "
                  "(PI × rayon²) : range d'abord rayon × rayon dans carre, puis la surface dans surface. Affiche surface.",
        "entrees": {"rayon": 2},
        "blocs": [aff("PI", "3.14"), aff("carre", "rayon * rayon"), aff("surface", "PI * carre"), ecrire("surface")],
        "points_controle": [
            point("p1", "Que vaut carre ?", "carre"),
            point("p2", "Que vaut surface à la fin ?", "surface"),
        ],
        "indices": [
            "Trois étapes : la constante, le calcul, l'affichage.",
            "La surface d'un cercle vaut PI multiplié par le rayon au carré : rayon × rayon.",
            {"texte": "Commence par ce bloc :", "blocs": [aff("PI", "3.14")]},
        ],
        "sorties_langages": {"python": "rayon = 2\nPI = 3.14\ncarre = rayon * rayon\nsurface = PI * carre\nprint(surface)"},
    },
    {
        "notion": "variables", "ordre": 3,
        "titre": "Le périmètre et la surface d'un rectangle",
        "enonce": "La longueur lg et la largeur la d'un rectangle sont fournies. Calcule son périmètre dans "
                  "perimetre et sa surface dans surface, puis affiche perimetre, puis surface.",
        "entrees": {"lg": 8, "la": 5},
        "blocs": [aff("perimetre", "2 * (lg + la)"), aff("surface", "lg * la"), ecrire("perimetre"), ecrire("surface")],
        "points_controle": [
            point("p1", "Que vaut perimetre à la fin ?", "perimetre"),
            point("p2", "Que vaut surface à la fin ?", "surface"),
        ],
        "indices": [
            "Le périmètre fait le tour : deux longueurs et deux largeurs.",
            "Attention aux parenthèses : 2 * lg + la n'est pas 2 * (lg + la).",
        ],
        "sorties_langages": {"python": "lg = 8\nla = 5\nperimetre = 2 * (lg + la)\nsurface = lg * la\nprint(perimetre)\nprint(surface)"},
    },
    {
        "notion": "variables", "ordre": 4,
        "titre": "Échanger avec une variable temporaire",
        "enonce": "Deux nombres nb1 et nb2 sont fournis. Échange leurs valeurs en passant par une variable nb3, "
                  "puis affiche nb1 et nb2 sur la même ligne.",
        "entrees": {"nb1": 4, "nb2": 9},
        "blocs": [aff("nb3", "nb1"), aff("nb1", "nb2"), aff("nb2", "nb3"), ecrire("nb1", "nb2")],
        "points_controle": [
            point("p1", "Que vaut nb1 juste après son affectation ?", "nb1", "affectation", 1),
            point("p2", "Que vaut nb2 à la fin ?", "nb2"),
        ],
        "indices": [
            "Si tu écris nb1 ← nb2 en premier, l'ancienne valeur de nb1 est perdue.",
            "Mets d'abord nb1 à l'abri dans nb3.",
            {"texte": "Commence par ce bloc :", "blocs": [aff("nb3", "nb1")]},
        ],
        "sorties_langages": {"python": "nb1 = 4\nnb2 = 9\nnb3 = nb1\nnb1 = nb2\nnb2 = nb3\nprint(nb1, nb2)"},
    },
    {
        "notion": "variables", "ordre": 5,
        "titre": "Des secondes en heures",
        "enonce": "Un nombre de secondes nsec est fourni. Calcule le nombre d'heures h, de minutes m et de "
                  "secondes s qu'il représente, puis affiche h, m et s sur la même ligne.",
        "entrees": {"nsec": 3725},
        "blocs": [aff("h", "nsec div 3600"), aff("m", "(nsec mod 3600) div 60"), aff("s", "nsec mod 60"),
                  ecrire("h", "m", "s")],
        "points_controle": [
            point("p1", "Que vaut h ?", "h"),
            point("p2", "Que vaut m ?", "m"),
            point("p3", "Que vaut s ?", "s"),
        ],
        "indices": [
            "Une heure dure 3600 secondes, une minute 60 secondes.",
            "div donne le quotient entier, mod le reste.",
            "Les minutes se cherchent dans ce qui reste une fois les heures retirées : nsec mod 3600.",
        ],
        "sorties_langages": {"python": "nsec = 3725\nh = nsec // 3600\nm = (nsec % 3600) // 60\ns = nsec % 60\nprint(h, m, s)"},
    },
    {
        "notion": "variables", "ordre": 6,
        "titre": "Les priorités de calcul",
        "enonce": "On veut la valeur de 5 + 2 / (3 - 1 / 1) * 6 - 9. Range d'abord la parenthèse (3 - 1 / 1) "
                  "dans d, puis l'expression 5 + 2 / d * 6 - 9 dans r, et affiche r. Calcule-la à la main avant "
                  "d'exécuter, en respectant les priorités.",
        "blocs": [aff("d", "3 - 1 / 1"), aff("r", "5 + 2 / d * 6 - 9"), ecrire("r")],
        "points_controle": [point("p1", "Que vaut d ?", "d"), point("p2", "Que vaut r ?", "r")],
        "indices": [
            "Les parenthèses d'abord, puis multiplications et divisions de gauche à droite, puis additions et soustractions.",
            "Dans la parenthèse : 1 / 1 vaut 1, donc 3 - 1 vaut 2.",
        ],
        "sorties_langages": {"python": "d = 3 - 1 / 1\nr = 5 + 2 / d * 6 - 9\nprint(r)"},
    },
    {
        "notion": "variables", "ordre": 7,
        "titre": "Une expression logique",
        "enonce": "On veut la valeur de ((0 < 1) ou faux) et (vrai ou (9 - 3 = 3)). Range la partie gauche dans g, "
                  "la partie droite dans dr, puis g et dr dans b. Affiche b.",
        "blocs": [aff("g", "(0 < 1) ou faux"), aff("dr", "vrai ou (9 - 3 = 3)"), aff("b", "g et dr"), ecrire("b")],
        "points_controle": [
            point("p1", "Que vaut g ?", "g"),
            point("p2", "Que vaut dr ?", "dr"),
            point("p3", "Que vaut b ?", "b"),
        ],
        "indices": [
            "Évalue chaque parenthèse séparément : chacune vaut vrai ou faux.",
            "« ou » est vrai dès qu'un des deux côtés est vrai ; « et » exige les deux.",
        ],
        "sorties_langages": {"python": "g = (0 < 1) or False\ndr = True or (9 - 3 == 3)\nb = g and dr\nprint(b)"},
    },
    # --------------------------------------------------------------- conditions
    {
        "notion": "conditions", "ordre": 2,
        "titre": "La valeur absolue",
        "enonce": "Un nombre x est fourni. Range sa valeur absolue dans une variable va (x s'il est positif, "
                  "son opposé sinon), puis affiche va.",
        "entrees": {"x": -7},
        "blocs": [si("x < 0", [aff("va", "0 - x")], [aff("va", "x")]), ecrire("va")],
        "points_controle": [
            point("p1", "Que vaut va ?", "va"),
            point("p2", "Que vaut x à la fin ?", "x"),
        ],
        "indices": [
            "Une seule question : x est-il négatif ?",
            "On ne modifie pas x : le résultat va dans va.",
            "L'opposé de x s'écrit 0 - x.",
        ],
        "sorties_langages": {"python": "x = -7\nif x < 0:\n    va = -x\nelse:\n    va = x\nprint(va)"},
    },
    {
        "notion": "conditions", "ordre": 3,
        "titre": "Le plus grand de trois nombres",
        "enonce": "Trois nombres x, y et z sont fournis. Range le plus grand dans une variable pg et le plus "
                  "petit dans pp, puis affiche pg, puis pp.",
        "entrees": {"x": 4, "y": 11, "z": 7},
        "blocs": [si("x ≥ y et x ≥ z", [aff("pg", "x")], [si("y ≥ z", [aff("pg", "y")], [aff("pg", "z")])]),
                  si("x ≤ y et x ≤ z", [aff("pp", "x")], [si("y ≤ z", [aff("pp", "y")], [aff("pp", "z")])]),
                  ecrire("pg"), ecrire("pp")],
        "points_controle": [point("p1", "Que vaut pg ?", "pg"), point("p2", "Que vaut pp ?", "pp")],
        "indices": [
            "x est le plus grand s'il dépasse (ou égale) y ET z.",
            "Sinon, il ne reste que y et z à départager : un second si, dans le sinon.",
            {"texte": "Commence par ce bloc :", "blocs": [si("x ≥ y et x ≥ z", [aff("pg", "x")], [])]},
        ],
        "sorties_langages": {"python": "x, y, z = 4, 11, 7\nif x >= y and x >= z:\n    pg = x\nelif y >= z:\n    pg = y\nelse:\n    pg = z\nif x <= y and x <= z:\n    pp = x\nelif y <= z:\n    pp = y\nelse:\n    pp = z\nprint(pg)\nprint(pp)"},
    },
    {
        "notion": "conditions", "ordre": 4,
        "titre": "Le signe d'un produit",
        "enonce": "Deux nombres a et b sont fournis. Range leur produit dans p, puis dans une variable signe le "
                  "texte \"positif\", \"négatif\" ou \"nul\" selon le signe de p. Affiche signe.",
        "entrees": {"a": -4, "b": 6},
        "blocs": [aff("p", "a * b"),
                  si("p > 0", [aff("signe", '"positif"')],
                     [si("p < 0", [aff("signe", '"négatif"')], [aff("signe", '"nul"')])]),
                  ecrire("signe")],
        "points_controle": [point("p1", "Que vaut p ?", "p"), point("p2", "Que vaut signe ?", "signe")],
        "indices": [
            "Trois cas, donc deux tests : un si, et un second si dans le sinon.",
            "Le cas « nul » est celui qui reste quand p n'est ni positif ni négatif.",
        ],
        "sorties_langages": {"python": "a, b = -4, 6\np = a * b\nif p > 0:\n    signe = \"positif\"\nelif p < 0:\n    signe = \"négatif\"\nelse:\n    signe = \"nul\"\nprint(signe)"},
    },
    {
        "notion": "conditions", "ordre": 5,
        "titre": "L'année bissextile",
        "enonce": "Une année a est fournie. Elle est bissextile si elle est divisible par 4, sauf si elle est "
                  "divisible par 100 sans l'être par 400. Range les restes de a par 4, 100 et 400 dans r4, r100 "
                  "et r400, puis \"bissextile\" ou \"non bissextile\" dans une variable msg. Affiche msg.",
        "entrees": {"a": 1900},
        "blocs": [aff("r4", "a mod 4"), aff("r100", "a mod 100"), aff("r400", "a mod 400"),
                  si("r4 = 0 et (r100 ≠ 0 ou r400 = 0)",
                     [aff("msg", '"bissextile"')], [aff("msg", '"non bissextile"')]),
                  ecrire("msg")],
        "points_controle": [
            point("p1", "Que vaut r100 ?", "r100"),
            point("p2", "Que vaut r400 ?", "r400"),
            point("p3", "Que vaut msg ?", "msg"),
        ],
        "indices": [
            "« Divisible par 4 » se teste avec a mod 4 = 0.",
            "1900 est divisible par 4 et par 100, mais pas par 400.",
            "Tu peux aussi imbriquer deux si au lieu d'une seule condition composée.",
        ],
        "sorties_langages": {"python": "a = 1900\nr4, r100, r400 = a % 4, a % 100, a % 400\nif r4 == 0 and (r100 != 0 or r400 == 0):\n    msg = \"bissextile\"\nelse:\n    msg = \"non bissextile\"\nprint(msg)"},
    },
    {
        "notion": "conditions", "ordre": 6,
        "titre": "La mention",
        "enonce": "Une note sur 20 est fournie. Range la mention dans une variable mention : \"très bien\" à partir "
                  "de 16, \"bien\" à partir de 14, \"assez bien\" à partir de 12, \"passable\" à partir de 10, "
                  "\"ajourné\" sinon. Range aussi dans admis le booléen note ≥ 10. Affiche mention.",
        "entrees": {"note": 14},
        "blocs": [aff("admis", "note ≥ 10"), si("note ≥ 16", [aff("mention", '"très bien"')],
                     [si("note ≥ 14", [aff("mention", '"bien"')],
                         [si("note ≥ 12", [aff("mention", '"assez bien"')],
                             [si("note ≥ 10", [aff("mention", '"passable"')], [aff("mention", '"ajourné"')])])])]),
                  ecrire("mention")],
        "points_controle": [point("p1", "Que vaut admis ?", "admis"), point("p2", "Que vaut mention ?", "mention")],
        "indices": [
            "C'est un choix multiple : on teste les seuils du plus haut au plus bas.",
            "Si note ≥ 16 est faux, inutile de vérifier note < 16 ensuite : le sinon le garantit déjà.",
        ],
        "sorties_langages": {"python": "note = 14\nadmis = note >= 10\nif note >= 16:\n    mention = \"très bien\"\nelif note >= 14:\n    mention = \"bien\"\nelif note >= 12:\n    mention = \"assez bien\"\nelif note >= 10:\n    mention = \"passable\"\nelse:\n    mention = \"ajourné\"\nprint(mention)"},
    },
    # ------------------------------------------------------------------ boucles
    {
        "notion": "boucles", "ordre": 2,
        "titre": "La somme de 1 à n",
        "enonce": "Un entier n est fourni. Calcule 1 + 2 + … + n dans une variable somme avec une boucle pour, "
                  "puis affiche somme.",
        "entrees": {"n": 10},
        "blocs": [aff("somme", "0"), pour("i", "1", "n", [aff("somme", "somme + i")]), ecrire("somme")],
        "points_controle": [
            point("p1", "Que vaut somme à la fin du 3e tour ?", "somme", "iteration", 3),
            point("p2", "Que vaut somme à la fin ?", "somme"),
        ],
        "indices": [
            "somme doit exister avant la boucle : par quelle valeur commence-t-elle ?",
            "À chaque tour, on ajoute le numéro du tour.",
            {"texte": "Commence par ces blocs :", "blocs": [aff("somme", "0"), pour("i", "1", "n", [])]},
        ],
        "sorties_langages": {"python": "n = 10\nsomme = 0\nfor i in range(1, n + 1):\n    somme = somme + i\nprint(somme)"},
    },
    {
        "notion": "boucles", "ordre": 3,
        "titre": "Une table de multiplication",
        "enonce": "Un entier n est fourni. Affiche sa table de multiplication de 1 à 10, une ligne par produit : "
                  "n, \"x\", i, \"=\", et le produit rangé dans une variable p.",
        "entrees": {"n": 7},
        "blocs": [pour("i", "1", "10", [aff("p", "n * i"), ecrire("n", '"x"', "i", '"="', "p")])],
        "points_controle": [
            point("p1", "Que vaut p à la fin du 3e tour ?", "p", "iteration", 3),
            point("p2", "Que vaut p à la fin ?", "p"),
        ],
        "indices": [
            "Le nombre de tours est connu : 10. C'est le cas idéal pour une boucle pour.",
            "Dans la boucle : calculer p, puis l'afficher.",
        ],
        "sorties_langages": {"python": "n = 7\nfor i in range(1, 11):\n    p = n * i\n    print(n, \"x\", i, \"=\", p)"},
    },
    {
        "notion": "boucles", "ordre": 4,
        "titre": "La puissance",
        "enonce": "Deux entiers x et n sont fournis. Calcule x puissance n dans une variable p en multipliant, "
                  "puis affiche p.",
        "entrees": {"x": 2, "n": 10},
        "blocs": [aff("p", "1"), pour("i", "1", "n", [aff("p", "p * x")]), ecrire("p")],
        "points_controle": [
            point("p1", "Que vaut p à la fin du 4e tour ?", "p", "iteration", 4),
            point("p2", "Que vaut p à la fin ?", "p"),
        ],
        "indices": [
            "x puissance n, c'est x multiplié par lui-même n fois.",
            "Comme pour la factorielle, le produit commence à 1.",
        ],
        "sorties_langages": {"python": "x = 2\nn = 10\np = 1\nfor i in range(1, n + 1):\n    p = p * x\nprint(p)"},
    },
    {
        "notion": "boucles", "ordre": 5,
        "titre": "La somme des nombres pairs",
        "enonce": "Un entier n est fourni. Calcule dans une variable s la somme des nombres pairs de 1 à n, "
                  "puis affiche s.",
        "entrees": {"n": 10},
        "blocs": [aff("s", "0"), pour("i", "1", "n", [si("i mod 2 = 0", [aff("s", "s + i")])]), ecrire("s")],
        "points_controle": [
            point("p1", "Que vaut s à la fin du 4e tour ?", "s", "iteration", 4),
            point("p2", "Que vaut s à la fin ?", "s"),
        ],
        "indices": [
            "Un nombre est pair quand le reste de sa division par 2 vaut 0.",
            "Une condition dans la boucle : on n'ajoute i que s'il est pair.",
        ],
        "sorties_langages": {"python": "n = 10\ns = 0\nfor i in range(1, n + 1):\n    if i % 2 == 0:\n        s = s + i\nprint(s)"},
    },
    {
        "notion": "boucles", "ordre": 6,
        "titre": "Compter les chiffres",
        "enonce": "Un entier positif n est fourni. Compte ses chiffres dans une variable c en le divisant par 10 "
                  "tant qu'il reste quelque chose, puis affiche c.",
        "entrees": {"n": 40725},
        "blocs": [aff("c", "0"), tant_que("n > 0", [aff("n", "n div 10"), aff("c", "c + 1")]), ecrire("c")],
        "points_controle": [
            point("p1", "Que vaut n à la fin du 2e tour ?", "n", "iteration", 2),
            point("p2", "Que vaut c à la fin ?", "c"),
        ],
        "indices": [
            "40725 div 10 vaut 4072 : on a retiré un chiffre.",
            "On ne connaît pas le nombre de tours à l'avance : boucle tant que.",
            "Sans n ← n div 10 dans la boucle, elle ne s'arrêterait jamais.",
        ],
        "sorties_langages": {"python": "n = 40725\nc = 0\nwhile n > 0:\n    n = n // 10\n    c = c + 1\nprint(c)"},
    },
    {
        "notion": "boucles", "ordre": 7,
        "titre": "Le PGCD d'Euclide",
        "enonce": "Deux entiers m et n sont fournis. Avec l'algorithme d'Euclide (diviser, puis recommencer avec "
                  "le diviseur et le reste jusqu'à un reste nul), range leur PGCD dans b et affiche b.",
        "entrees": {"m": 24, "n": 18},
        "blocs": [aff("a", "m"), aff("b", "n"), aff("r", "a mod b"),
                  tant_que("r ≠ 0", [aff("a", "b"), aff("b", "r"), aff("r", "a mod b")]), ecrire("b")],
        "points_controle": [
            point("p1", "Que vaut r avant la boucle ?", "r", "affectation", 1),
            point("p2", "Que vaut b à la fin ?", "b"),
        ],
        "indices": [
            "a et b sont des copies de m et n : on garde les données intactes.",
            "Le dernier diviseur, quand le reste devient nul, est le PGCD.",
            {"texte": "Commence par ces blocs :", "blocs": [aff("a", "m"), aff("b", "n"), aff("r", "a mod b")]},
        ],
        "sorties_langages": {"python": "m, n = 24, 18\na, b = m, n\nr = a % b\nwhile r != 0:\n    a = b\n    b = r\n    r = a % b\nprint(b)"},
    },
    {
        "notion": "boucles", "ordre": 8,
        "titre": "Les tables imbriquées",
        "enonce": "Avec deux boucles pour imbriquées (i de 1 à 3, j de 1 à 3), additionne dans total tous les "
                  "produits i × j, puis affiche total.",
        "blocs": [aff("total", "0"), pour("i", "1", "3", [pour("j", "1", "3", [aff("total", "total + i * j")])]),
                  ecrire("total")],
        "points_controle": [
            point("p1", "Que vaut total à la fin du 1er tour de la boucle sur i ?", "total", "iteration", 1),
            point("p2", "Que vaut total à la fin ?", "total"),
        ],
        "indices": [
            "Pour chaque valeur de i, la boucle sur j fait ses 3 tours complets.",
            "Au premier tour de i : 1×1 + 1×2 + 1×3.",
        ],
        "sorties_langages": {"python": "total = 0\nfor i in range(1, 4):\n    for j in range(1, 4):\n        total = total + i * j\nprint(total)"},
    },
    # ----------------------------------------------------------------- tableaux
    {
        "notion": "tableaux", "ordre": 2,
        "titre": "La moyenne d'un tableau",
        "enonce": "Un tableau de notes t est fourni. Calcule leur somme dans s, puis leur moyenne dans moy, "
                  "et affiche moy.",
        "entrees": {"t": [12, 8, 15, 9, 6]},
        "blocs": [aff("s", "0"), pour("i", "0", "longueur(t) - 1", [aff("s", "s + t[i]")]),
                  aff("moy", "s / longueur(t)"), ecrire("moy")],
        "points_controle": [
            point("p1", "Que vaut s à la fin ?", "s"),
            point("p2", "Que vaut moy à la fin ?", "moy"),
        ],
        "indices": [
            "D'abord la somme de toutes les cases, ensuite une seule division.",
            "Les cases vont de 0 à longueur(t) - 1.",
        ],
        "sorties_langages": {"python": "t = [12, 8, 15, 9, 6]\ns = 0\nfor i in range(len(t)):\n    s = s + t[i]\nmoy = s / len(t)\nprint(moy)"},
    },
    {
        "notion": "tableaux", "ordre": 3,
        "titre": "Le maximum et sa position",
        "enonce": "Un tableau t est fourni. Trouve sa plus grande valeur (dans max) et la case où elle se trouve "
                  "(dans pos), puis affiche max et pos sur la même ligne.",
        "entrees": {"t": [3, 17, 8, 21, 5]},
        "blocs": [aff("max", "t[0]"), aff("pos", "0"),
                  pour("i", "1", "longueur(t) - 1", [si("t[i] > max", [aff("max", "t[i]"), aff("pos", "i")])]),
                  ecrire("max", "pos")],
        "points_controle": [
            point("p1", "Que vaut max à la fin du 1er tour ?", "max", "iteration", 1),
            point("p2", "Que vaut pos à la fin ?", "pos"),
        ],
        "indices": [
            "On suppose que la première case est la plus grande, puis on vérifie les autres.",
            "Quand on trouve plus grand, on retient la valeur ET la position.",
            {"texte": "Commence par ces blocs :", "blocs": [aff("max", "t[0]"), aff("pos", "0")]},
        ],
        "sorties_langages": {"python": "t = [3, 17, 8, 21, 5]\nmax_ = t[0]\npos = 0\nfor i in range(1, len(t)):\n    if t[i] > max_:\n        max_ = t[i]\n        pos = i\nprint(max_, pos)"},
    },
    {
        "notion": "tableaux", "ordre": 4,
        "titre": "Chercher avec un drapeau",
        "enonce": "Un tableau t et une valeur x sont fournis. Parcours t avec une boucle tant que et un drapeau "
                  "trouve (faux au départ) : arrête-toi dès que x est trouvé. Affiche trouve et i.",
        "entrees": {"t": [5, 12, 7, 30, 18], "x": 30},
        "blocs": [aff("trouve", "faux"), aff("i", "0"),
                  tant_que("i < longueur(t) et non trouve",
                           [si("t[i] = x", [aff("trouve", "vrai")], [aff("i", "i + 1")])]),
                  ecrire("trouve", "i")],
        "points_controle": [
            point("p1", "Que vaut i à la fin du 2e tour ?", "i", "iteration", 2),
            point("p2", "Que vaut trouve à la fin ?", "trouve"),
        ],
        "indices": [
            "Le drapeau passe à vrai au moment où l'on trouve, et la boucle s'arrête au tour suivant.",
            "Deux raisons d'arrêter : on a trouvé, ou on est au bout du tableau.",
            {"texte": "Commence par ces blocs :", "blocs": [aff("trouve", "faux"), aff("i", "0")]},
        ],
        "sorties_langages": {"python": "t = [5, 12, 7, 30, 18]\nx = 30\ntrouve = False\ni = 0\nwhile i < len(t) and not trouve:\n    if t[i] == x:\n        trouve = True\n    else:\n        i = i + 1\nprint(trouve, i)"},
    },
    {
        "notion": "tableaux", "ordre": 5,
        "titre": "La recherche dichotomique",
        "enonce": "Un tableau trié t et une valeur x sont fournis. Cherche x par dichotomie : compare x à la case "
                  "du milieu (entre inf et sup), puis garde la moitié qui peut le contenir. Affiche milieu, la "
                  "case où x est trouvé.",
        "entrees": {"t": [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], "x": 23},
        "blocs": [aff("inf", "0"), aff("sup", "longueur(t) - 1"), aff("trouve", "faux"),
                  tant_que("non trouve et sup ≥ inf", [
                      aff("milieu", "(inf + sup) div 2"),
                      si("t[milieu] = x", [aff("trouve", "vrai")],
                         [si("x < t[milieu]", [aff("sup", "milieu - 1")], [aff("inf", "milieu + 1")])]),
                  ]),
                  ecrire("milieu")],
        "points_controle": [
            point("p1", "Que vaut milieu au 1er tour ?", "milieu", "iteration", 1),
            point("p2", "Que vaut milieu à la fin ?", "milieu"),
        ],
        "indices": [
            "La recherche se fait entre inf et sup ; au départ, c'est tout le tableau.",
            "Si x est plus petit que la case du milieu, il ne peut être qu'à gauche : sup ← milieu - 1.",
            "Déroule-le sur papier : au 1er tour, milieu = (0 + 9) div 2.",
        ],
        "sorties_langages": {"python": "t = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]\nx = 23\ninf, sup = 0, len(t) - 1\ntrouve = False\nwhile not trouve and sup >= inf:\n    milieu = (inf + sup) // 2\n    if t[milieu] == x:\n        trouve = True\n    elif x < t[milieu]:\n        sup = milieu - 1\n    else:\n        inf = milieu + 1\nprint(milieu)"},
    },
    {
        "notion": "tableaux", "ordre": 6,
        "titre": "Inverser un tableau",
        "enonce": "Un tableau t est fourni. Inverse l'ordre de ses cases sur place (la première échange avec la "
                  "dernière, et ainsi de suite jusqu'au milieu), puis affiche t.",
        "entrees": {"t": [1, 2, 3, 4, 5, 6]},
        "blocs": [aff("n", "longueur(t)"),
                  pour("i", "0", "n div 2 - 1", [aff("tmp", "t[i]"), aff("t", "t[n - 1 - i]", index="i"),
                                                aff("t", "tmp", index="n - 1 - i")]),
                  ecrire("t")],
        "points_controle": [
            point("p1", "Que contient t à la fin du 1er tour ?", "t", "iteration", 1),
            point("p2", "Que contient t à la fin ?", "t"),
        ],
        "indices": [
            "La case i échange avec la case n - 1 - i.",
            "On s'arrête au milieu : sinon on réinverserait ce qui est déjà inversé.",
            "Un échange demande une variable temporaire, comme pour deux variables.",
        ],
        "sorties_langages": {"python": "t = [1, 2, 3, 4, 5, 6]\nn = len(t)\nfor i in range(n // 2):\n    tmp = t[i]\n    t[i] = t[n - 1 - i]\n    t[n - 1 - i] = tmp\nprint(t)"},
    },
    {
        "notion": "tableaux", "ordre": 7,
        "titre": "Le tri par sélection",
        "enonce": "Un tableau t est fourni. Trie-le par ordre croissant : pour chaque case i, compare-la à toutes "
                  "les cases suivantes j et échange-les si t[i] > t[j]. Affiche t.",
        "entrees": {"t": [29, 10, 14, 37, 13]},
        "blocs": [pour("i", "0", "longueur(t) - 2", [
                      pour("j", "i + 1", "longueur(t) - 1", [
                          si("t[i] > t[j]", [aff("x", "t[i]"), aff("t", "t[j]", index="i"), aff("t", "x", index="j")]),
                      ]),
                  ]),
                  ecrire("t")],
        "points_controle": [
            point("p1", "Que contient t à la fin du 1er tour de la boucle sur i ?", "t", "iteration", 1),
            point("p2", "Que contient t à la fin ?", "t"),
        ],
        "indices": [
            "Après le premier tour de i, la plus petite valeur est en case 0.",
            "La boucle sur j commence juste après i : de i + 1 à la dernière case.",
            "L'échange de t[i] et t[j] passe par une variable x.",
        ],
        "sorties_langages": {"python": "t = [29, 10, 14, 37, 13]\nfor i in range(len(t) - 1):\n    for j in range(i + 1, len(t)):\n        if t[i] > t[j]:\n            t[i], t[j] = t[j], t[i]\nprint(t)"},
    },
]


class Command(BaseCommand):
    help = "Charge la bibliothèque d'exercices du cours (idempotent : met à jour par titre)."

    def handle(self, *args, **options):
        for donnees in EXERCICES:
            donnees = {"type": "coeur", "entrees": {}, **donnees}
            instance = Exercice.objects.filter(titre=donnees["titre"]).first()
            serializer = ExerciceSerializer(instance, data=donnees)
            if not serializer.is_valid():
                raise CommandError(f"{donnees['titre']} : {serializer.errors}")
            serializer.save()
            self.stdout.write(f"{'mis à jour' if instance else 'créé'} : [{donnees['notion']}] {donnees['titre']}")
        self.stdout.write(self.style.SUCCESS(f"{len(EXERCICES)} exercices de bibliothèque prêts."))
