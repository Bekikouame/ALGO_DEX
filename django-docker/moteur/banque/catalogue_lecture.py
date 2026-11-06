"""Exercices relus directement sur les pages des documents (code non extractible en texte).

La plupart demandent de lire un programme et de prévoir ce qu'il affiche : le traçage, cœur d'ALGO_DEX. Ils utilisent
goto, sous-programmes, matrices ou pointeurs, absents du moteur V1 : fiche seule, réponse dans `solution` (back-office).
Les codes sont réécrits en pseudo-code ; les réponses ont été calculées, non vérifiées par le moteur.
"""

from .outils import fiche, source

B = lambda ch, n, nature="reformulation", **k: source("bouchiha", ch, n, nature, **k)
D = lambda ch, n, **k: source("debrauwer", ch, n, "variante", **k)
C = fiche
OBJET = "Exercice orienté objet de la source (Java), reformulé en type abstrait indépendant du langage."
TITRE_SEUL = "Énoncé non lisible dans la copie scannée : exercice construit à partir de son titre et des exercices qui s'y réfèrent."
MATRICE = "pour i de 1 à 2 faire\n    pour j de 1 à 3 faire\n        X[i, j] ← val\n        val ← val + 1"

# Le graphe de l'exercice 12.11 et ses plus courtes distances depuis C (recalculées par le test de la banque).
GRAPHE_DIJKSTRA = {"A": {"B": 8}, "B": {"C": 2}, "C": {"G": 14, "D": 5}, "D": {"E": 3}, "E": {"A": 11, "F": 2}, "F": {"G": 9, "D": 7}, "G": {"B": 6}}
DISTANCES_DEPUIS_C = {"A": 19, "B": 20, "C": 0, "D": 5, "E": 8, "F": 10, "G": 14}

CATALOGUE = [
    C("bouchiha-4-15", "Tracer un programme avec branchement", "conditions", "avance", 4,
      "Pour i prenant les valeurs faux puis vrai : si non i, alors tant que i aller à l'étiquette 200 ; sinon, si i et "
      "(5 < 6), afficher « bon courage », sinon pour j de 'd' à 'b' afficher « bonjour ». Puis pour k de 3 à 5 : si (faux "
      "ou i) alors, si k = 3, afficher « merci » ; sinon afficher k - 2. Étiquette 200 : afficher « *** ». Qu'affiche ce "
      "programme ?",
      ["Tracer des conditions imbriquées", "Attribuer chaque sinon au bon si"], B(4, 15), secondaires=["boucles"], tags=["tracage"],
      solution="1 / 2 / 3 / *** / bon courage / merci / ***",
      remarques="Le branchement (goto) n'existe pas dans le moteur V1, et la source le déconseille."),
    C("bouchiha-5-22", "Remplir une matrice ligne par ligne", "tableaux_2d", "intermediaire", 1,
      f"Soit X une matrice de 2 lignes et 3 colonnes et val ← 1.\n{MATRICE}\nPuis on affiche X ligne par ligne. Que fait cet "
      "algorithme, et qu'affiche-t-il ?",
      ["Tracer deux boucles imbriquées"], B(5, 22), tags=["tracage"], solution="1 2 3 4 5 6 : la matrice est remplie ligne par ligne."),
    C("bouchiha-5-23", "Afficher une matrice colonne par colonne", "tableaux_2d", "intermediaire", 2,
      f"Même remplissage que l'exercice précédent :\n{MATRICE}\nmais l'affichage parcourt j de 1 à 3, puis i de 1 à 2. Quel "
      "résultat obtient-on ?",
      ["Voir l'effet de l'ordre des boucles"], B(5, 23), tags=["tracage"], solution="1 4 2 5 3 6"),
    C("bouchiha-5-24", "Une matrice T[k, m] = k + m", "tableaux_2d", "intermediaire", 1,
      "Soit T une matrice de 4 lignes et 2 colonnes (indices à partir de 1). Pour chaque k et m : T[k, m] ← k + m. Représente "
      "T après exécution.",
      ["Calculer une case à partir de ses indices"], B(5, 24), tags=["tracage"], solution="[2, 3] / [3, 4] / [4, 5] / [5, 6]"),
    C("bouchiha-5-25", "Deux variantes de remplissage", "tableaux_2d", "intermediaire", 2,
      "Même matrice que l'exercice précédent, avec a) T[k, m] ← 2 × k + (m + 1), puis b) T[k, m] ← (k + 1) + 4 × m. "
      "Représente T dans chaque cas.",
      ["Évaluer une formule pour chaque case"], B(5, 25), tags=["tracage"],
      solution="a) [4, 5] / [6, 7] / [8, 9] / [10, 11]  b) [6, 10] / [7, 11] / [8, 12] / [9, 13]"),
    C("bouchiha-5-30", "Un texte ou une variable ?", "chaines", "debutant", 1,
      "La variable azerty reçoit \"qwerty\", puis on affiche le texte \"azerty\" suivi de la variable azerty. Qu'affiche ce "
      "programme ?",
      ["Distinguer un texte et le nom d'une variable"], B(5, 30), tags=["tracage", "piege"], solution="azertyqwerty"),
    C("bouchiha-5-31", "Majuscule et troncature", "chaines", "intermediaire", 2,
      "Un mot ch est lu. Sa première lettre est mise en majuscule ; si sa longueur dépasse 3, ch est réduit à ses 3 premiers "
      "caractères ; ch est affiché. Que fait ce programme, et qu'affiche-t-il pour « bonjour » et pour « oui » ?",
      ["Comprendre des opérations sur les chaînes"], B(5, 31), tags=["tracage"], solution="« Bon » et « Oui »."),
    C("bouchiha-6-3", "Remplacer une fonction par une procédure", "fonctions", "intermediaire", 2,
      "Un programme lit x et y, et affiche S(x, y) où la fonction S(a, b) renvoie a + b. Réécris-le avec une procédure qui "
      "transmet le résultat par un paramètre.",
      ["Transformer une fonction en procédure", "Passer un résultat par variable"], B(6, 3),
      solution="procédure S(a, b : entier ; var r : entier)\n    r ← a + b\nfin procédure\n\nS(x, y, somme)\nécrire(\"Somme = \", somme)"),
    C("bouchiha-6-6", "Passage par valeur ou par variable", "fonctions", "intermediaire", 3,
      "La procédure imp(a) affiche a, puis fait a ← a + 2. Le programme fait : i ← 1 ; tant que i < 10 : imp(i) ; i ← i + 3. "
      "Qu'affiche-t-il quand a est passé par valeur ? Et quand a est passé par variable ?",
      ["Tracer les deux modes de passage"], B(6, 6), tags=["tracage"],
      solution="Par valeur : 1 / 4 / 7. Par variable : 1 / 6 (i passe par 1, 3, 6, 8, 11)."),
    C("bouchiha-6-7", "Quatre signatures, quatre affichages", "fonctions", "avance", 4,
      "La fonction M(a, b) renvoie (a + b) div 2, puis fait a ← b et b ← 2. Le programme fait x ← 11, y ← 9, moy ← M(x, y), "
      "et affiche « La moyenne de x et y est moy ». Qu'affiche-t-il avec a et b par valeur ? Avec b seul par variable ? Avec "
      "a seul par variable ? Avec les deux par variable ?",
      ["Prévoir les effets de bord d'une fonction"], B(6, 7), tags=["tracage", "piege"],
      solution="Toujours moy = 10. Par valeur : 11 et 9. b par variable : 11 et 2. a par variable : 9 et 9. Les deux : 9 et 2."),
    C("bouchiha-6-10", "Réduire un programme répétitif", "fonctions", "intermediaire", 1,
      "Un programme lit x, y, z, puis affiche trois fois une somme sous la forme « x + y = s » (x + y, y + z, z + x), en "
      "répétant les mêmes instructions. Réduis sa taille avec un sous-programme.",
      ["Factoriser des instructions répétées"], B(6, 10),
      solution="procédure afficher(a, b : entier)\n    écrire(a, \" + \", b, \" = \", a + b)\nfin procédure\n\nafficher(x, y)\nafficher(y, z)\nafficher(z, x)"),
    C("bouchiha-6-14", "Une factorielle qui ne remonte pas", "recursivite", "avance", 4,
      "La procédure mod(F, N) fait F ← F × N, puis si N ≠ 1 appelle mod(F, N - 1). essai(N) fait Fact ← 1, mod(Fact, N), puis "
      "affiche Fact et N. Qu'affiche essai(3) si F et N sont passés par valeur ? Si F est passé par variable ? Que se "
      "passe-t-il si N aussi est passé par variable ?",
      ["Comprendre le passage de paramètres dans la récursivité"], B(6, 14), secondaires=["fonctions"], tags=["tracage", "piege"],
      solution="Par valeur : 1..3. F par variable : 6..3. N par variable : erreur, N - 1 est une expression et ne peut pas "
               "être passé par variable."),
    C("bouchiha-6-15", "Que font ces trois procédures ?", "recursivite", "avance", 3,
      "Pour n ≥ 0, explique ce que font : P1(n) : si n > 0 : écrire n, P1(n - 1), écrire n. P2(n) : si n > 0 : P2(n - 1), "
      "sinon écrire n. P3(n) : si n > 0 : écrire n, P3(n div 2).",
      ["Distinguer ce qui se passe avant et après l'appel récursif"], B(6, 15), tags=["tracage"],
      solution="P1 écrit n, n-1, …, 1 puis 1, …, n. P2 écrit toujours 0. P3 écrit n, n div 2, … jusqu'à 1.",
      remarques="La copie du document porte « P2(n-l) » : lu comme n - 1."),
    C("bouchiha-7-1", "Le coût en mémoire d'un programme", "complexite", "avance", 2,
      "Un programme a un tableau T de 5 réels, un entier i et un réel s. Il fait T[i] ← i × i, s ← T[1] + T[5], puis affiche "
      "T et s. Un entier occupe 2 octets, un réel 6. Quel est son coût en espace ? Propose une optimisation, et donne le "
      "nouveau coût.",
      ["Compter l'espace occupé", "Supprimer une donnée inutile"], B(7, 1), secondaires=["tableaux"],
      solution="5 × 6 + 2 + 6 = 38 octets. Sans tableau, en affichant i × i, et avec s entier (1 + 25) : 2 + 2 = 4 octets."),
    C("bouchiha-7-4", "Le coût de boucles imbriquées dans un appel", "complexite", "avance", 3,
      "AF1(x) lit k, puis pour i de 1 à x : si i ≤ k, écrit i. AF2(y) : pour j de 1 à y, pour p de 1 à y, appelle AF1(y). Le "
      "programme lit n et appelle AF2(n). Détermine le nombre de comparaisons au pire, au mieux et en moyenne. Cet "
      "algorithme est-il efficace ?",
      ["Multiplier les coûts d'appels imbriqués"], B(7, 4), secondaires=["fonctions"],
      complexite={"temps": "O(n³)", "espace": "O(1)"},
      solution="Cmax = Cmin = Cmoy = n³ comparaisons, quel que soit k : cubique, donc peu efficace."),
    C("bouchiha-8-7", "L'enregistrement père", "enregistrements", "intermediaire", 2,
      "Définis un enregistrement pere avec les champs nom, date_nais, nbr_enf (entier) et liste_enf (chaînes). Lis puis "
      "affiche les informations d'une variable pere1.",
      ["Déclarer et utiliser un enregistrement"], B(8, 7)),
    C("bouchiha-8-8", "Enregistrements imbriqués", "enregistrements", "intermediaire", 3,
      "Reprends pere : date_nais devient un enregistrement (jour, mois, annee) et liste_enf un tableau de chaînes.",
      ["Imbriquer un enregistrement", "Combiner enregistrement et tableau"], B(8, 8), secondaires=["tableaux"]),
    C("bouchiha-8-9", "Un enregistrement en paramètre", "enregistrements", "intermediaire", 2,
      "Reprends pere avec une procédure qui reçoit une variable de ce type et l'affiche.",
      ["Passer un enregistrement à un sous-programme"], B(8, 9), secondaires=["fonctions"]),
    C("bouchiha-8-10", "Le total des enfants", "enregistrements", "intermediaire", 1,
      "Déclare deux variables pere1 et pere2 de type pere, lis uniquement leur nombre d'enfants, puis calcule et affiche "
      "le total.", ["Accéder à un champ précis"], B(8, 10)),
    C("bouchiha-8-11", "Un tableau d'enregistrements", "enregistrements", "intermediaire", 2,
      "Déclare un tableau de cinq enregistrements pere (version avec date et enfants détaillés), lis ses éléments, puis "
      "affiche-les.", ["Parcourir un tableau d'enregistrements"], B(8, 11), secondaires=["tableaux"]),
    C("bouchiha-8-13", "Simplifier l'accès aux champs", "enregistrements", "intermediaire", 1,
      "Dix candidats (nom, note) sont rangés dans un tableau d'enregistrements ; on affiche ceux qui atteignent la moyenne. "
      "Simplifie l'écriture avec une structure « avec … faire » (with … do), qui évite de répéter le nom de la variable.",
      ["Alléger l'accès aux champs"], B(8, 13)),
    C("bouchiha-10-1", "Lire la mémoire d'un pointeur", "pointeurs", "avance", 2,
      "y est un pointeur d'entier, x un entier. On fait x ← 7, y ← adresse de x. En mémoire, x est à l'adresse 10012 et y à "
      "l'adresse 10016. Qu'affichent, dans l'ordre : x, la valeur pointée par y, y, l'adresse de y ?",
      ["Distinguer valeur, valeur pointée et adresse"], B(10, 1), tags=["tracage"], solution="7 7 10012 10016"),
    C("bouchiha-11-2", "D'un arbre n-aire à un arbre binaire", "arbres", "avance", 3,
      "Transforme en arbre binaire équivalent (le premier fils devient le fils gauche, le frère suivant le fils droit) "
      "l'arbre dont la racine A a pour fils B, C et D ; B a pour fils E et F ; D a pour fils G.",
      ["Appliquer la règle fils gauche, frère droit"], B(11, 2, "variante"),
      solution="A : gauche B. B : gauche E, droit C. E : droit F. C : droit D. D : gauche G.",
      remarques="La figure de la source est remplacée par un arbre plus petit."),
    C("bouchiha-11-13", "La somme des valeurs d'un arbre", "arbres", "avance", 2,
      "Écris une fonction qui calcule la somme des valeurs des nœuds d'un arbre binaire d'entiers.",
      ["Combiner des résultats récursifs"], B(11, 13), secondaires=["recursivite"],
      complexite={"temps": "O(n)", "espace": "O(hauteur)"}),
    C("bouchiha-11-14", "La plus grande valeur d'un arbre", "arbres", "avance", 3,
      "Écris une fonction qui détermine la plus grande valeur des nœuds d'un arbre binaire d'entiers (non forcément ordonné).",
      ["Parcourir tout l'arbre", "Traiter un sous-arbre vide"], B(11, 14), secondaires=["recursivite"]),
    C("bouchiha-11-15", "La plus petite valeur d'un arbre", "arbres", "avance", 3,
      "Écris une fonction qui détermine la plus petite valeur des nœuds d'un arbre binaire d'entiers.",
      ["Adapter un parcours récursif"], B(11, 15), secondaires=["recursivite"]),
    C("bouchiha-11-16", "Un arbre d'entiers ordonné ?", "arbres", "avance", 4,
      "Écris une fonction booléenne qui dit si un arbre binaire d'entiers est ordonné : dans chaque nœud, les valeurs de "
      "gauche sont inférieures et celles de droite supérieures ou égales.",
      ["Vérifier un invariant sur tout l'arbre"], B(11, 16), secondaires=["recursivite"],
      indices=["Comparer un nœud à ses seuls fils ne suffit pas."]),
    C("bouchiha-12-7", "Existe-t-il un chemin ?", "graphes", "avance", 3,
      "Écris une fonction booléenne qui teste s'il existe un chemin entre deux sommets d'un graphe donné par une matrice "
      "d'adjacence M(5 × 5).",
      ["Parcourir un graphe depuis un sommet"], B(12, 7)),
    C("bouchiha-12-11", "Les plus courts chemins de Dijkstra", "graphes", "avance", 4,
      "Un graphe orienté a les arcs pondérés : A→B 8, B→C 2, C→G 14, C→D 5, D→E 3, E→A 11, E→F 2, F→G 9, F→D 7, G→B 6. Avec "
      "l'algorithme de Dijkstra, cherche les plus courts chemins de C vers tous les autres sommets.",
      ["Dérouler l'algorithme de Dijkstra à la main"], B(12, 11), tags=["tracage"],
      solution="D 5, E 8, F 10, G 14, A 19, B 20 (par G)."),
    C("debrauwer-4-13", "Le jeu de devinette", "objets", "avance", 2,
      "Définis un type qui tire un nombre secret et mène une partie : il demande des propositions et répond « plus grand » "
      "ou « plus petit » jusqu'à la bonne réponse.", ["Encapsuler un état et une boucle de jeu"], D(4, 13), remarques=TITRE_SEUL),
    C("debrauwer-5-6", "Une représentation textuelle", "objets", "avance", 1,
      "Ajoute aux types Rectangle et Complexe une opération qui renvoie leur description sous forme de chaîne, utilisée pour "
      "les afficher.", ["Convertir un objet en texte"], D(5, 6), secondaires=["chaines"], remarques=OBJET),
    C("debrauwer-6-9", "Les portes logiques", "objets", "avance", 4,
      "Modélise des portes logiques (ET, OU, NON) reliables entre elles, et calcule la sortie d'un petit circuit à partir de "
      "ses entrées.", ["Composer des objets", "Spécialiser un comportement"], D(6, 9), remarques=TITRE_SEUL),
]
