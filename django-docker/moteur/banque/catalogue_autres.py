"""Exercices des autres documents, hors de ce que le moteur V1 exécute : fiche seule.

Debrauwer (éditions ENI) est un ouvrage protégé : ses exercices sont des variantes rédigées par ALGO_DEX,
qui gardent la compétence travaillée sans reprendre le texte ni les données. Les exercices propres à Java
sont reformulés en termes de types abstraits et d'opérations.
"""

from .outils import fiche, source

D = lambda ch, n, **k: source("debrauwer", ch, n, "variante", **k)


def C(cle, titre, notion, niveau, diff, enonce, objectifs, src, **k):
    return fiche(cle, titre, notion, niveau, diff, enonce, objectifs, src, **k)


OBJET = "Exercice orienté objet de la source (Java), reformulé en type abstrait indépendant du langage."

CATALOGUE = [
    # ================================================================ Debrauwer
    C("debrauwer-1-11", "Deviner un nombre pair", "boucles", "debutant", 2,
      "L'ordinateur tire un nombre pair entre 0 et 100. L'utilisateur propose des nombres ; après chaque essai, "
      "l'algorithme répond « plus grand » ou « plus petit », jusqu'à la bonne réponse, puis affiche le nombre d'essais.",
      ["Boucler jusqu'à une condition de réussite", "Compter des essais"], D(1, 11), secondaires=["conditions"],
      remarques="Nécessite un tirage aléatoire et une saisie interactive."),
    C("debrauwer-1-12", "L'ordinateur devine", "boucles", "intermediaire", 3,
      "L'utilisateur pense à un nombre pair entre 0 et 100. L'algorithme propose des nombres et l'utilisateur répond "
      "« plus grand », « plus petit » ou « trouvé ». Trouve le nombre en un minimum d'essais.",
      ["Appliquer une stratégie dichotomique", "Mettre à jour des bornes"], D(1, 12),
      complexite={"temps": "O(log n) essais", "espace": "O(1)"}, remarques="Nécessite une saisie interactive."),
    C("debrauwer-2-15", "La somme de deux matrices", "tableaux_2d", "intermediaire", 2,
      "Deux matrices carrées de même taille sont données. Calcule leur somme case par case dans une troisième matrice.",
      ["Parcourir des matrices en parallèle"], D(2, 15), complexite={"temps": "O(n²)", "espace": "O(n²)"}),
    C("debrauwer-2-16", "Construire un index alphabétique", "chaines", "avance", 4,
      "Un tableau de mots en minuscules, trié par ordre alphabétique, est donné. Construis un index qui associe à chaque "
      "lettre l'indice du premier mot qui commence par elle (ou -1 si aucun).",
      ["Exploiter un tableau trié", "Construire une table d'accès"], D(2, 16), secondaires=["tableaux"],
      complexite={"temps": "O(n + 26)", "espace": "O(26)"}),
    C("debrauwer-3-1", "Une bannière de bienvenue", "fonctions", "intermediaire", 1,
      "Écris une procédure qui affiche un cadre d'étoiles entourant le mot BIENVENUE.",
      ["Écrire une procédure sans paramètre", "Organiser des affichages répétés"], D(3, 1)),
    C("debrauwer-3-3", "Afficher un tableau", "fonctions", "intermediaire", 2,
      "Écris une procédure qui affiche le contenu d'un tableau ; un paramètre booléen indique s'il faut revenir à la "
      "ligne après chaque valeur.",
      ["Paramétrer le comportement d'une procédure"], D(3, 3), secondaires=["tableaux"]),
    C("debrauwer-3-4", "Fonctions de conversion d'angles", "fonctions", "intermediaire", 1,
      "Écris une fonction qui convertit des degrés en radians, et une autre qui fait l'inverse.",
      ["Écrire des fonctions réciproques"], D(3, 4)),
    C("debrauwer-3-5", "Un entier aléatoire entre deux bornes", "fonctions", "intermediaire", 2,
      "Écris une fonction qui renvoie un entier aléatoire compris entre deux bornes données, à partir d'un générateur "
      "qui fournit un réel aléatoire entre 0 et 1.",
      ["Transformer un intervalle de valeurs"], D(3, 5)),
    C("debrauwer-3-6", "La factorielle en fonction", "fonctions", "intermediaire", 2,
      "Écris une fonction qui renvoie la factorielle d'un entier positif ou nul, puis un programme qui l'appelle.",
      ["Encapsuler un calcul dans une fonction"], D(3, 6), secondaires=["boucles"]),
    C("debrauwer-3-7", "Minimum et maximum de trois réels", "fonctions", "intermediaire", 2,
      "Écris une fonction qui renvoie le minimum de trois réels, puis une autre pour le maximum.",
      ["Écrire des fonctions à plusieurs paramètres"], D(3, 7), secondaires=["conditions"]),
    C("debrauwer-3-8", "La racine carrée par approximations", "fonctions", "avance", 4,
      "Écris une fonction qui calcule la racine carrée d'un réel par approximations successives (méthode de Newton) ; "
      "elle renvoie faux si le nombre est négatif et le résultat par un paramètre.",
      ["Itérer jusqu'à une précision", "Renvoyer un statut et une valeur"], D(3, 8), secondaires=["boucles"],
      indices=["x suivant = (x + a / x) / 2."]),
    C("debrauwer-3-9", "Remplir un tableau au hasard", "fonctions", "intermediaire", 2,
      "Écris une procédure qui remplit un tableau reçu en paramètre avec des entiers aléatoires entre deux bornes.",
      ["Modifier un tableau passé en paramètre"], D(3, 9, autres=[{"code": "debrauwer", "chapitre": 3, "numero": 2}]),
      secondaires=["tableaux"]),
    C("debrauwer-3-10", "La division euclidienne", "fonctions", "intermediaire", 2,
      "Écris une fonction qui calcule le quotient et le reste d'une division entière par soustractions successives, et "
      "les renvoie ensemble.",
      ["Renvoyer plusieurs résultats"], D(3, 10), secondaires=["boucles"],
      exemples=[{"entree": "17, 5", "sortie": "quotient 3, reste 2"}]),
    C("debrauwer-3-11", "Chercher dans une matrice", "fonctions", "intermediaire", 2,
      "Écris une fonction qui cherche un entier dans une matrice et renvoie sa position (ligne, colonne) ou indique son "
      "absence.",
      ["Parcourir une matrice dans une fonction"], D(3, 11), secondaires=["tableaux_2d"]),
    C("debrauwer-3-12", "Des matrices en modules", "fonctions", "intermediaire", 3,
      "Réorganise le calcul de la somme de deux matrices en trois sous-programmes : lire une matrice, calculer la somme, "
      "afficher une matrice.",
      ["Découper un programme en modules réutilisables"], D(3, 12), secondaires=["tableaux_2d"]),
    C("debrauwer-4-1", "Le type Rectangle", "objets", "avance", 1,
      "Définis un type Rectangle (hauteur, largeur) avec ses opérations : créer, lire et modifier les dimensions, "
      "calculer le périmètre et l'aire.", ["Associer données et opérations"], D(4, 1), remarques=OBJET),
    C("debrauwer-4-2", "Le type Calculatrice", "objets", "avance", 1,
      "Définis un type Calculatrice qui garde une valeur courante, avec les opérations ajouter, soustraire, multiplier, "
      "diviser et remettre à zéro.", ["Gérer un état interne"], D(4, 2), remarques=OBJET),
    C("debrauwer-4-3", "Le type Complexe", "objets", "avance", 2,
      "Définis un type Complexe (partie réelle, partie imaginaire) avec la création, l'accès aux parties et le calcul du "
      "module.", ["Modéliser un objet mathématique"], D(4, 3), remarques=OBJET),
    C("debrauwer-4-4", "Le type NombreAléatoire", "objets", "avance", 2,
      "Définis un type qui mémorise deux bornes et fournit à chaque demande un entier aléatoire entre elles.",
      ["Encapsuler des paramètres"], D(4, 4), remarques=OBJET),
    C("debrauwer-4-5", "Le type Vecteur", "objets", "avance", 2,
      "Définis un type Vecteur (tableau d'entiers de taille fixée à la création) avec : lire et écrire une composante, "
      "produit scalaire, somme de deux vecteurs.", ["Encapsuler un tableau"], D(4, 5), secondaires=["tableaux"], remarques=OBJET),
    C("debrauwer-4-6", "Opérations sur les complexes", "objets", "avance", 3,
      "Ajoute au type Complexe l'addition et la multiplication par un autre complexe.",
      ["Étendre un type avec des opérations"], D(4, 6), remarques=OBJET),
    C("debrauwer-4-7", "Le type Angle", "objets", "avance", 2,
      "Définis un type Angle qui mémorise une valeur unique et permet de la lire ou de la fixer en degrés, en radians ou "
      "en grades.", ["Cacher la représentation interne"], D(4, 7), remarques=OBJET),
    C("debrauwer-4-8", "Le type Fraction", "objets", "avance", 3,
      "Définis un type Fraction (numérateur, dénominateur positifs) toujours simplifiée, avec l'addition, la "
      "multiplication et la comparaison de deux fractions.", ["Maintenir un invariant (fraction irréductible)"], D(4, 8),
      remarques=OBJET, indices=["Le PGCD sert à simplifier."]),
    C("debrauwer-4-9", "Le type Rectangle positionné", "objets", "avance", 3,
      "Définis un rectangle aux côtés parallèles aux axes par ses coordonnées extrêmes, avec : tester si un point est "
      "dedans, tester si deux rectangles se chevauchent, calculer leur intersection.",
      ["Raisonner sur des intervalles en deux dimensions"], D(4, 9), remarques=OBJET),
    C("debrauwer-4-10", "Le type Ensemble", "objets", "avance", 3,
      "Définis un type Ensemble d'entiers (tableau et taille) avec : ajouter, retirer, tester l'appartenance, afficher.",
      ["Encapsuler une structure et ses invariants"], D(4, 10), secondaires=["tableaux"], remarques=OBJET),
    C("debrauwer-4-11", "Le type Ensemble trié", "objets", "avance", 4,
      "Même type Ensemble, mais dont les valeurs restent triées : l'appartenance se teste par dichotomie.",
      ["Exploiter un invariant de tri"], D(4, 11), remarques=OBJET),
    C("debrauwer-4-12", "Le type Matrice", "objets", "avance", 3,
      "Définis un type Matrice rectangulaire (nombre de lignes, de colonnes, valeurs) avec l'accès aux cases, la somme et "
      "le produit de deux matrices compatibles.", ["Vérifier des préconditions de dimensions"], D(4, 12),
      secondaires=["tableaux_2d"], remarques=OBJET),
    C("debrauwer-5-1", "Voyelles et consonnes", "chaines", "intermediaire", 2,
      "Un mot est donné. Compte ses voyelles et ses consonnes non accentuées.",
      ["Classer des caractères"], D(5, 1, autres=[{"code": "bouchiha", "chapitre": 8, "numero": 5}])),
    C("debrauwer-5-2", "Le palindrome, sans tenir compte des espaces", "chaines", "intermediaire", 3,
      "Un texte est donné. Dis si c'est un palindrome en ignorant les espaces (« esope reste ici et se repose »).",
      ["Parcourir une chaîne par les deux bouts", "Sauter les caractères à ignorer"], D(5, 2),
      complexite={"temps": "O(n)", "espace": "O(1)"}),
    C("debrauwer-5-3", "Un entier en chaîne", "chaines", "intermediaire", 3,
      "Convertis un entier (éventuellement négatif) en chaîne de caractères sans fonction de conversion toute faite.",
      ["Extraire les chiffres", "Construire une chaîne"], D(5, 3), remarques=OBJET),
    C("debrauwer-5-4", "Une chaîne en entier", "chaines", "intermediaire", 3,
      "Convertis une chaîne de chiffres (avec un signe éventuel) en entier, en signalant une chaîne invalide.",
      ["Accumuler des chiffres", "Valider une saisie"], D(5, 4)),
    C("debrauwer-5-5", "Le chiffrement ROT13", "chaines", "intermediaire", 3,
      "Chiffre un texte en décalant chaque lettre de 13 rangs dans l'alphabet (A → N, N → A), sans toucher aux autres "
      "caractères. Que donne un double chiffrement ?", ["Calculer avec les codes des caractères et mod"], D(5, 5)),
    C("debrauwer-5-7", "Repérer des numéros de téléphone", "chaines", "avance", 4,
      "Dans un texte, trouve tous les numéros de la forme nn.nn.nn.nn.nn (n chiffre) et affiche-les.",
      ["Reconnaître un motif dans un texte"], D(5, 7)),
    C("debrauwer-5-8", "La distance de Levenshtein", "chaines", "avance", 5,
      "Calcule la distance de Levenshtein entre deux mots : le nombre minimal d'insertions, suppressions ou substitutions "
      "de lettres pour passer de l'un à l'autre.",
      ["Programmation dynamique avec un tableau à deux dimensions"], D(5, 8), secondaires=["tableaux_2d"],
      exemples=[{"entree": "chien / niche", "sortie": "4"}], complexite={"temps": "O(m × n)", "espace": "O(m × n)"},
      remarques="Énoncé source illisible dans le document ; exercice construit à partir de son titre (problème classique)."),
    C("debrauwer-6-1", "Une automobile en composants", "objets", "avance", 3,
      "Modélise une automobile composée d'un moteur relié à deux roues motrices : définis les trois types et faites-les "
      "interagir (démarrer, accélérer, faire tourner les roues).", ["Composer des objets"], D(6, 1), remarques=OBJET),
    C("debrauwer-6-2", "Le jeu de devinette sans affichage", "objets", "avance", 3,
      "Définis un type qui tire un nombre secret et répond à une proposition par 0 (trouvé), -1 (trop petit) ou 1 (trop "
      "grand), sans aucune lecture ni affichage.", ["Séparer la logique des entrées-sorties"], D(6, 2), remarques=OBJET),
    C("debrauwer-6-3", "Un chercheur de nombre", "objets", "avance", 3,
      "Définis un type qui devine un nombre entre deux bornes en s'appuyant uniquement sur les réponses -1, 0 ou 1.",
      ["Implémenter une recherche dichotomique interactive"], D(6, 3), remarques=OBJET),
    C("debrauwer-6-4", "L'ordinateur joue contre lui-même", "objets", "avance", 4,
      "Fais dialoguer le type qui cache un nombre et celui qui le cherche, et compte les essais nécessaires.",
      ["Faire collaborer deux objets"], D(6, 4), remarques=OBJET),
    C("debrauwer-6-5", "La course automobile", "objets", "avance", 4,
      "Simule une course : à chaque tour, chaque voiture avance d'une distance aléatoire ; affiche le classement et le "
      "vainqueur.", ["Simuler un système de plusieurs objets"], D(6, 5), remarques=OBJET),
    C("debrauwer-6-6", "Hériter des complexes", "objets", "avance", 3,
      "Définis les opérations d'addition et de multiplication des complexes comme une extension (héritage) du type "
      "Complexe.", ["Réutiliser un type par héritage"], D(6, 6), remarques=OBJET),
    C("debrauwer-6-7", "Les comptes en banque", "objets", "avance", 3,
      "Définis deux sortes de comptes : un compte classique dont le solde ne peut pas être négatif, et un compte avec "
      "découvert autorisé jusqu'à une limite. Les retraits respectent la règle de chacun.",
      ["Spécialiser un comportement"], D(6, 7), remarques=OBJET),
    C("debrauwer-6-8", "Une interface pour les ensembles", "objets", "avance", 3,
      "Définis l'interface commune des ensembles (ajouter, retirer, appartient, afficher) et fais-la respecter par "
      "l'ensemble trié et non trié.", ["Programmer par interface"], D(6, 8), remarques=OBJET),
    C("debrauwer-7-1", "La factorielle récursive", "recursivite", "avance", 1,
      "Écris une fonction récursive fact(n) avec 0! = 1 et n! = n × (n - 1)!.",
      ["Écrire une première fonction récursive"], D(7, 1), complexite={"temps": "O(n)", "espace": "O(n)"}),
    C("debrauwer-7-3", "L'additionneur-multiplicateur récursif", "recursivite", "avance", 3,
      "L'utilisateur saisit des entiers jusqu'à un symbole + ou * ; écris une fonction récursive qui renvoie leur somme "
      "ou leur produit selon le symbole final.", ["Décider après le retour des appels"], D(7, 3),
      remarques="Nécessite une saisie interactive."),
    C("debrauwer-7-4", "Le tri par sélection récursif", "recursivite", "avance", 3,
      "Écris une procédure récursive de tri par sélection : place le minimum au début, puis trie récursivement le reste.",
      ["Transformer une boucle en récursion"], D(7, 4), secondaires=["tableaux"], complexite={"temps": "O(n²)", "espace": "O(n)"}),
    C("debrauwer-7-5", "Évaluer une expression arithmétique", "recursivite", "avance", 4,
      "Écris une fonction récursive qui évalue une expression arithmétique entièrement parenthésée, comme ((2+3)*4).",
      ["Analyser une expression récursivement"], D(7, 5), secondaires=["chaines"]),
    C("debrauwer-7-6", "Compter fichiers et répertoires", "recursivite", "avance", 3,
      "Une arborescence de répertoires contenant fichiers et sous-répertoires est donnée. Écris une fonction récursive "
      "qui compte les fichiers et les répertoires.", ["Parcourir une structure arborescente"], D(7, 6), secondaires=["arbres"]),
    C("debrauwer-8-1", "Une liste chaînée de données", "listes_chainees", "avance", 3,
      "Définis une liste chaînée de données (clé entière, texte) avec insertion, recherche par clé et affichage.",
      ["Implémenter une liste chaînée complète"], D(8, 1)),
    C("debrauwer-8-2", "Une table de hachage", "hachage", "avance", 4,
      "Définis une table de hachage de données (clé, texte) avec les mêmes opérations que la liste chaînée : insertion, "
      "recherche, affichage.", ["Comparer liste et table de hachage"], D(8, 2), secondaires=["listes_chainees"]),
    C("debrauwer-8-3", "L'arbre binaire de recherche", "arbres", "avance", 4,
      "Définis un arbre binaire de recherche de données (clé, texte) avec insertion, recherche et affichage dans l'ordre "
      "des clés.", ["Maintenir la propriété d'ordre d'un ABR"], D(8, 3),
      complexite={"temps": "O(hauteur) par opération", "espace": "O(n)"}),
    C("debrauwer-8-4", "Le B-arbre", "arbres", "avance", 5,
      "Implémente un B-arbre d'ordre donné avec la recherche et l'insertion (éclatement des nœuds pleins).",
      ["Gérer des nœuds à plusieurs clés", "Éclater et remonter des clés"], D(8, 4),
      remarques="Énoncé source illisible dans le document ; exercice construit à partir de son titre (structure classique)."),
    C("debrauwer-8-5", "Une pile de chaînes", "piles_files", "avance", 2,
      "Implémente une pile de chaînes dans un tableau de taille fixe : empiler, dépiler, sommet, pile vide, pile pleine.",
      ["Implémenter une pile", "Gérer les cas limites"], D(8, 5), complexite={"temps": "O(1) par opération", "espace": "O(n)"}),
    C("debrauwer-8-6", "Évaluer une expression postfixée", "piles_files", "avance", 4,
      "Évalue une expression postfixée (« 2 3 + 4 * » vaut 20) à l'aide d'une pile.",
      ["Utiliser une pile pour évaluer"], D(8, 6), secondaires=["chaines"],
      exemples=[{"entree": "2 3 + 4 *", "sortie": "20"}]),

    # ================================================================ Récursivité (A. L. Assalé)
    C("recursivite-1", "Le PGCD, deux méthodes récursives", "recursivite", "avance", 2,
      "Écris une fonction récursive du PGCD par la méthode d'Euclide (pgcd(a, b) = b si a mod b = 0, sinon pgcd(b, a mod "
      "b)), puis une autre par la méthode égyptienne (pgcd(u, u) = u ; si u > v, pgcd(u - v, v) ; sinon pgcd(v, u)).",
      ["Traduire une définition récursive", "Comparer deux algorithmes"],
      source("recursivite", None, 1, autres=[{"code": "debrauwer", "chapitre": 7, "numero": 2}]),
      complexite={"temps": "O(log min(a, b)) pour Euclide", "espace": "O(profondeur)"}),
    C("recursivite-2", "L'addition avec +1 et -1", "recursivite", "avance", 3,
      "Avec seulement +1, -1 et les comparaisons à 0, écris une fonction récursive qui additionne deux entiers naturels, "
      "puis étends-la aux entiers relatifs.", ["Construire une opération à partir d'opérations élémentaires"],
      source("recursivite", None, 2)),
    C("recursivite-3", "La multiplication par additions", "recursivite", "avance", 3,
      "Avec seulement l'addition, -1 et la comparaison à 0, écris une fonction récursive qui multiplie deux entiers "
      "naturels, puis étends-la aux relatifs.", ["Définir un produit par récurrence"], source("recursivite", None, 3)),
    C("hanoi", "Les tours de Hanoï", "recursivite", "avance", 4,
      "Déplace n disques d'une tour de départ vers une tour d'arrivée en t'aidant d'une tour intermédiaire, un disque à "
      "la fois, sans jamais poser un disque sur un plus petit. Écris l'algorithme récursif qui affiche les déplacements, "
      "et donne leur nombre en fonction de n.",
      ["Décomposer un problème en sous-problèmes identiques", "Compter les déplacements (2ⁿ - 1)"],
      source("challenge", None, 4, autres=[{"code": "recursivite", "chapitre": None, "numero": 6}]),
      exemples=[{"entree": "n = 2, tours A, B, C", "sortie": "A→B, A→C, B→C"}],
      complexite={"temps": "O(2ⁿ)", "espace": "O(n)"}),

    # ================================================================ TD structures de données complexes
    C("td-sdc-1", "Une liste chaînée depuis un tableau", "listes_chainees", "avance", 2,
      "Écris une fonction qui construit une liste chaînée contenant, dans le même ordre, les éléments d'un tableau.",
      ["Créer des maillons à partir d'un tableau"], source("td_sdc", None, 1)),
    C("td-sdc-3", "Recherche récursive dans une liste de chaînes", "listes_chainees", "avance", 3,
      "Écris une fonction récursive qui cherche une chaîne x dans une liste chaînée de chaînes.",
      ["Récursivité sur une liste"], source("td_sdc", None, 3), secondaires=["recursivite"]),
    C("td-sdc-4", "Comparer deux listes de caractères", "listes_chainees", "avance", 3,
      "Écris les fonctions égal, sup et inf (ou une fonction compare) qui comparent deux listes de caractères dans "
      "l'ordre alphabétique.", ["Comparer lexicographiquement deux listes"], source("td_sdc", None, 4)),
    C("td-sdc-7", "Supprimer toutes les occurrences", "listes_chainees", "avance", 3,
      "Écris une fonction qui supprime d'une liste toutes les occurrences d'une valeur.",
      ["Supprimer plusieurs maillons, y compris en tête"], source("td_sdc", None, 7)),
    C("td-sdc-8", "Chercher une sous-liste", "listes_chainees", "avance", 4,
      "Écris une fonction qui dit si une liste l1 apparaît dans une liste l, à l'aide d'une fonction préfixe qui teste si "
      "l1 est le début de l.", ["Décomposer en fonction auxiliaire"], source("td_sdc", None, 8)),
    C("td-sdc-9", "Un arbre binaire ordonné ?", "arbres", "avance", 4,
      "Écris, en version récursive puis itérative, une fonction qui vérifie qu'un arbre binaire est ordonné (arbre "
      "binaire de recherche).", ["Vérifier un invariant d'arbre", "Passer du récursif à l'itératif"], source("td_sdc", None, 9)),
    C("td-sdc-11", "L'arbre d'une expression préfixée", "arbres", "avance", 5,
      "Une expression arithmétique en notation préfixée, terminée par #, est donnée dans une chaîne. Construis "
      "récursivement l'arbre qui la représente.", ["Analyser une expression", "Construire un arbre récursivement"],
      source("td_sdc", None, 11), secondaires=["recursivite", "chaines"]),

    # ================================================================ Pointeurs (A. L. Assalé)
    C("assale-pointeurs", "Dérouler des manipulations de pointeurs", "pointeurs", "avance", 2,
      "Pour chacun des quatre petits programmes du cours (création par nouveau, affectation par *, copie de pointeurs, "
      "libération), dessine l'état de la mémoire après chaque instruction et dis ce qui est affiché.",
      ["Distinguer un pointeur et la valeur pointée", "Repérer les erreurs de libération"],
      source("assale", 1, None, "reformulation"),
      remarques="Les autres exercices des cours d'A. L. Assalé renvoient à une « fiche de TD » non fournie."),
]
