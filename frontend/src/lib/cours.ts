// Le cours d'algorithmique de la rubrique Ressources.
// Source : D. Bouchiha, « Algorithmique et programmation en Pascal » (chapitres 1 à 6),
// réécrit en pseudo-code ALGO_DEX, sans syntaxe Pascal. Le backend ne stocke pas encore de cours :
// le contenu vit ici, et seules les notions travaillées dans le laboratoire viennent du moteur.

import type { Notion } from "./api";

export type Bloc =
  | { type: "texte"; texte: string }
  | { type: "liste"; items: string[]; ordonnee?: boolean }
  | { type: "code"; titre?: string; lignes: string[] }
  | { type: "tableau"; legende?: string; entetes: string[]; lignes: string[][] }
  | { type: "retenir"; texte: string }
  | { type: "attention"; texte: string }
  | { type: "exercice"; titre: string; enonce: string; solution: Bloc[] };

export interface Section {
  id: string;
  titre: string;
  blocs: Bloc[];
}

export interface Chapitre {
  numero: number;
  slug: string;
  titre: string;
  resume: string;
  duree: number; // minutes
  /** Notions du moteur que le chapitre prépare : leurs exercices se font dans le laboratoire. */
  notions: Notion[];
  objectifs: string[];
  sections: Section[];
}

export const COURS = {
  titre: "Algorithmique",
  niveau: "Niveau débutant",
  source: "D. Bouchiha, Algorithmique et programmation en Pascal, chapitres 1 à 6",
};

export const CHAPITRES: Chapitre[] = [
  // ------------------------------------------------------------------
  {
    numero: 1,
    slug: "introduction",
    titre: "Introduction à l'algorithmique",
    resume: "Découvre ce qu'est un algorithme, son rôle et les bases de la logique.",
    duree: 25,
    notions: [],
    objectifs: [
      "Définir ce qu'est un algorithme",
      "Distinguer données, traitement et résultats",
      "Lire un pseudo-code et un organigramme",
    ],
    sections: [
      {
        id: "definition",
        titre: "Qu'est-ce qu'un algorithme ?",
        blocs: [
          {
            type: "texte",
            texte:
              "Un ordinateur ne fait qu'exécuter, très vite et sans se tromper, une suite d'instructions simples qu'on lui a données. Avant d'écrire ces instructions, il faut savoir **quoi** faire et **dans quel ordre** : c'est le rôle de l'algorithme.",
          },
          {
            type: "retenir",
            texte:
              "Un algorithme est une suite d'opérations élémentaires, exécutées dans un ordre donné, pour résoudre un problème ou accomplir une tâche.",
          },
          {
            type: "texte",
            texte:
              "Le mot vient du mathématicien Mohammed ibn Moussa **al-Khwârizmî** (IXe siècle), auteur d'ouvrages sur les méthodes de calcul. Son nom latinisé, « algorisme », est devenu « algorithme ».",
          },
        ],
      },
      {
        id: "vie-courante",
        titre: "Des algorithmes partout",
        blocs: [
          { type: "texte", texte: "Tu suis des algorithmes tous les jours sans le savoir. Démarrer une voiture, par exemple :" },
          {
            type: "liste",
            ordonnee: true,
            items: ["Ouvrir la porte.", "S'asseoir dans la voiture.", "Fermer la porte.", "Tourner la clé de contact.", "Relâcher la clé."],
          },
          {
            type: "texte",
            texte: "L'ordre compte : tourner la clé avant d'être assis n'a pas de sens. Un algorithme, c'est d'abord un **ordre** rigoureux.",
          },
        ],
      },
      {
        id: "boite-noire",
        titre: "Données, traitement, résultats",
        blocs: [
          {
            type: "texte",
            texte:
              "On peut voir un algorithme comme une boîte qui reçoit des **données d'entrée**, leur applique un **traitement**, et produit des **données de sortie** (les résultats).",
          },
          {
            type: "tableau",
            legende: "Calculer la somme de deux nombres",
            entetes: ["Entrées", "Traitement", "Sortie"],
            lignes: [["deux valeurs", "les additionner", "la somme"]],
          },
          {
            type: "texte",
            texte: "Pour résoudre un problème avec un ordinateur, on suit toujours la même démarche :",
          },
          {
            type: "liste",
            ordonnee: true,
            items: [
              "**Analyser** le problème : quels résultats veut-on ? de quelles informations dispose-t-on ?",
              "**Trouver une méthode** : la suite d'opérations qui mène des données au résultat.",
              "**Formuler** l'algorithme dans un langage précis (pseudo-code ou organigramme).",
              "**Traduire** l'algorithme dans un langage de programmation.",
            ],
          },
        ],
      },
      {
        id: "pseudo-code",
        titre: "Écrire un algorithme en pseudo-code",
        blocs: [
          {
            type: "texte",
            texte:
              "Le pseudo-code (ou langage de description d'algorithme) décrit les actions avec des verbes simples, sans dépendre d'un langage de programmation. Voici la somme de deux nombres :",
          },
          {
            type: "code",
            titre: "Algorithme Somme",
            lignes: [
              "variables valeur1, valeur2, som : entier",
              "écrire(\"Entrez la première valeur\")",
              "lire(valeur1)",
              "écrire(\"Entrez la deuxième valeur\")",
              "lire(valeur2)",
              "som ← valeur1 + valeur2",
              "écrire(som)",
            ],
          },
          {
            type: "liste",
            items: [
              "`lire` récupère une valeur tapée au clavier.",
              "`écrire` affiche un message ou une valeur à l'écran.",
              "`←` est l'affectation : `som ← valeur1 + valeur2` se lit « som reçoit valeur1 plus valeur2 ».",
            ],
          },
        ],
      },
      {
        id: "organigramme",
        titre: "Représenter un algorithme par un organigramme",
        blocs: [
          {
            type: "texte",
            texte:
              "Un organigramme dessine l'ossature de la solution avec des symboles géométriques reliés par des flèches. Il est souvent plus facile à comprendre qu'un texte.",
          },
          {
            type: "tableau",
            entetes: ["Symbole", "Sens"],
            lignes: [
              ["Rectangle aux coins arrondis", "Début ou fin de l'algorithme"],
              ["Parallélogramme", "Entrée ou sortie (lire, écrire)"],
              ["Rectangle", "Traitement (une affectation, un calcul)"],
              ["Losange", "Test d'une condition, avec une sortie oui et une sortie non"],
              ["Flèche", "L'ordre dans lequel on enchaîne les opérations"],
            ],
          },
          {
            type: "attention",
            texte:
              "Pour vérifier un organigramme, choisis des données simples, calculables à la main, et assez variées pour passer par toutes les branches.",
          },
        ],
      },
      {
        id: "qualites",
        titre: "Les qualités d'un bon algorithme",
        blocs: [
          {
            type: "liste",
            items: [
              "**Lisible** : clair pour toute personne qui le lit.",
              "**De haut niveau** : indépendant du langage et de la machine.",
              "**Précis** : aucune étape ne doit prêter à confusion.",
              "**Concis** : le moins d'opérations et de mémoire possible.",
              "**Structuré** : découpé en parties faciles à identifier.",
            ],
          },
          {
            type: "texte",
            texte:
              "Une bonne technique est la **méthode descendante** : on regarde le problème dans son ensemble, puis on le découpe en sous-problèmes plus simples, qu'on découpe à leur tour si besoin.",
          },
          {
            type: "texte",
            texte:
              "Une fois l'algorithme prêt, on le traduit en programme. Un **compilateur** traduit tout le programme en code machine avant de l'exécuter ; un **interpréteur** exécute les instructions une à une. Le raisonnement, lui, ne change pas.",
          },
        ],
      },
      {
        id: "exercices",
        titre: "À toi de jouer",
        blocs: [
          {
            type: "exercice",
            titre: "La surface d'un cercle",
            enonce:
              "Décris d'abord en trois étapes, puis en pseudo-code, l'algorithme qui lit le rayon d'un cercle et affiche sa surface (π × rayon²).",
            solution: [
              {
                type: "liste",
                ordonnee: true,
                items: ["Lire le rayon.", "Calculer la surface : PI × rayon × rayon.", "Afficher la surface."],
              },
              {
                type: "code",
                titre: "Algorithme Surface_cercle",
                lignes: [
                  "constante PI = 3,14159",
                  "variables rayon, surface : réel",
                  "écrire(\"Entrez la valeur du rayon\")",
                  "lire(rayon)",
                  "surface ← PI * rayon * rayon",
                  "écrire(surface)",
                ],
              },
              { type: "texte", texte: "Vérification : pour un rayon de 2, la surface vaut 3,14 × 4 ≈ 12,56." },
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  {
    numero: 2,
    slug: "variables-et-types",
    titre: "Variables et types",
    resume: "Apprends à stocker et manipuler des données.",
    duree: 35,
    notions: ["variables"],
    objectifs: [
      "Déclarer des variables et des constantes",
      "Choisir le bon type",
      "Affecter, lire, écrire et dérouler un algorithme à la main",
    ],
    sections: [
      {
        id: "variables",
        titre: "Variables et constantes",
        blocs: [
          {
            type: "texte",
            texte:
              "Une **variable** est une case de la mémoire qui porte un nom et dont la valeur peut changer pendant l'algorithme. Elle a trois caractéristiques :",
          },
          {
            type: "liste",
            items: [
              "un **nom** (identificateur), aussi explicite que possible : `moyenne` plutôt que `m` ;",
              "un **type**, qui dit quelles valeurs elle peut contenir ;",
              "une **valeur**, son contenu à un moment donné.",
            ],
          },
          {
            type: "attention",
            texte:
              "Un nom commence par une lettre, ne contient que des lettres, des chiffres et le tiret bas `_`, et jamais d'espace.",
          },
          {
            type: "texte",
            texte: "Une **constante** est une variable dont la valeur ne change jamais pendant tout l'algorithme :",
          },
          {
            type: "code",
            titre: "Algorithme Calcul_surface",
            lignes: ["constante PI = 3,14", "variables rayon, surface : réel"],
          },
        ],
      },
      {
        id: "types",
        titre: "Les types simples",
        blocs: [
          {
            type: "tableau",
            entetes: ["Type", "Exemples", "Opérations"],
            lignes: [
              ["entier", "12, -55", "+  -  *  div (quotient)  mod (reste)  comparaisons"],
              ["réel", "12,5  -2,09", "+  -  *  /  comparaisons"],
              ["booléen", "vrai, faux", "et, ou, non"],
              ["caractère", "'a', '?', '3'", "comparaisons (ordre du code ASCII)"],
              ["chaîne", "\"bonjour\"", "concaténation, longueur, comparaisons"],
            ],
          },
          {
            type: "texte",
            texte: "Avec des entiers, `13 div 5` vaut 2 (le quotient) et `13 mod 5` vaut 3 (le reste). `13 / 5` donne le réel 2,6.",
          },
          {
            type: "tableau",
            legende: "Les connecteurs logiques",
            entetes: ["a", "b", "a et b", "a ou b", "non a"],
            lignes: [
              ["vrai", "vrai", "vrai", "vrai", "faux"],
              ["vrai", "faux", "faux", "vrai", "faux"],
              ["faux", "vrai", "faux", "vrai", "vrai"],
              ["faux", "faux", "faux", "faux", "vrai"],
            ],
          },
        ],
      },
      {
        id: "affectation",
        titre: "L'affectation",
        blocs: [
          {
            type: "texte",
            texte:
              "L'affectation `←` range une valeur dans une variable. C'est l'opération la plus importante de l'algorithmique.",
          },
          { type: "code", lignes: ["X ← 4", "Y ← X * 2", "Z ← Z - 6"] },
          {
            type: "texte",
            texte:
              "On lit : « X reçoit 4 », « Y reçoit la valeur de X multipliée par 2 », « Z reçoit la valeur actuelle de Z moins 6 ».",
          },
          {
            type: "retenir",
            texte:
              "À gauche de ←, une seule variable ; à droite, une valeur ou une expression. `Z ← Z - 6` n'est pas une équation (sans solution en maths) : c'est une mise à jour de la case Z.",
          },
          {
            type: "texte",
            texte:
              "Dans une expression, les priorités sont celles des maths : fonctions, puis multiplications et divisions, puis additions et soustractions. Les parenthèses changent l'ordre : `Y ← X * (2 + Z)` fait l'addition d'abord.",
          },
        ],
      },
      {
        id: "entrees-sorties",
        titre: "Lire et écrire",
        blocs: [
          {
            type: "liste",
            items: [
              "`lire(n)` récupère la valeur tapée au clavier et la range dans `n`.",
              "`écrire(n)` affiche la valeur de `n` ; `écrire(\"texte\")` affiche un message.",
            ],
          },
          {
            type: "attention",
            texte: "Fais toujours précéder un `lire` d'un `écrire` qui dit à l'utilisateur ce qu'il doit taper.",
          },
        ],
      },
      {
        id: "derouler",
        titre: "Dérouler un algorithme à la main",
        blocs: [
          {
            type: "texte",
            texte:
              "Dérouler (ou tracer) un algorithme, c'est noter l'état des variables après chaque opération dans un **tableau de situation**. C'est exactement ce que fait le laboratoire d'ALGO_DEX pas à pas.",
          },
          {
            type: "code",
            titre: "Algorithme Moyenne",
            lignes: [
              "variables a, b : entier",
              "variable moy : réel",
              "écrire(\"Introduisez a\")",
              "lire(a)",
              "écrire(\"Introduisez b\")",
              "lire(b)",
              "moy ← (a + b) / 2",
              "écrire(\"Moyenne = \", moy)",
            ],
          },
          {
            type: "tableau",
            legende: "Déroulé avec a = 7 et b = 19",
            entetes: ["Opération", "a", "b", "moy", "Affichage"],
            lignes: [
              ["écrire", "", "", "", "Introduisez a"],
              ["lire(a)", "7", "", "", ""],
              ["écrire", "7", "", "", "Introduisez b"],
              ["lire(b)", "7", "19", "", ""],
              ["moy ← (a + b) / 2", "7", "19", "13", ""],
              ["écrire", "7", "19", "13", "Moyenne = 13"],
            ],
          },
        ],
      },
      {
        id: "permuter",
        titre: "Un classique : échanger deux variables",
        blocs: [
          {
            type: "texte",
            texte:
              "Pour échanger les valeurs de `nb1` et `nb2`, on ne peut pas écrire `nb1 ← nb2` puis `nb2 ← nb1` : la première valeur serait perdue. On passe par une variable intermédiaire.",
          },
          { type: "code", titre: "Algorithme Permuter", lignes: ["lire(nb1, nb2)", "nb3 ← nb1", "nb1 ← nb2", "nb2 ← nb3", "écrire(nb1, nb2)"] },
          {
            type: "texte",
            texte: "Avec des nombres, on peut aussi s'en passer : `nb1 ← nb1 + nb2`, `nb2 ← nb1 - nb2`, `nb1 ← nb1 - nb2`.",
          },
        ],
      },
      {
        id: "exercices",
        titre: "À toi de jouer",
        blocs: [
          {
            type: "exercice",
            titre: "Évaluer des expressions",
            enonce: "Que valent `5 + 2 / (3 - 1 / 1) * 6 - 9` et `((0 < 1) ou faux) et (vrai ou (9 - 3 = 3))` ?",
            solution: [
              { type: "texte", texte: "La première vaut **2** : 3 - 1 = 2, puis 2 / 2 = 1, puis 1 × 6 = 6, et 5 + 6 - 9 = 2." },
              {
                type: "texte",
                texte: "La seconde vaut **vrai** : (0 < 1) ou faux = vrai ; 9 - 3 = 3 est faux, mais vrai ou faux = vrai ; vrai et vrai = vrai.",
              },
            ],
          },
          {
            type: "exercice",
            titre: "Des secondes en heures",
            enonce: "Écris un algorithme qui lit un nombre de secondes `nsec` et l'affiche en heures, minutes et secondes.",
            solution: [
              {
                type: "code",
                titre: "Algorithme Conversion",
                lignes: [
                  "variables nsec, h, m, s : entier",
                  "lire(nsec)",
                  "s ← nsec mod 60",
                  "m ← (nsec mod 3600) div 60",
                  "h ← nsec div 3600",
                  "écrire(h, \" h \", m, \" min \", s, \" s\")",
                ],
              },
              { type: "texte", texte: "Avec 3725 secondes : s = 5, m = 125 div 60 = 2, h = 1. Affichage : 1 h 2 min 5 s." },
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  {
    numero: 3,
    slug: "structures-de-controle",
    titre: "Structures de contrôle",
    resume: "Maîtrise les conditions et les boucles pour prendre des décisions.",
    duree: 40,
    notions: ["conditions", "boucles"],
    objectifs: [
      "Écrire des conditions simples, composées et multiples",
      "Choisir entre tant que, répéter et pour",
      "Dérouler une boucle et éviter les boucles infinies",
    ],
    sections: [
      {
        id: "condition-simple",
        titre: "Si… alors",
        blocs: [
          {
            type: "texte",
            texte:
              "Jusqu'ici, nos algorithmes s'exécutaient ligne après ligne. Les **structures de contrôle** permettent de sauter des lignes (conditions) ou de les répéter (boucles).",
          },
          { type: "code", lignes: ["si X > 10 alors", "    écrire(X)", "    Y ← X", "fin si"] },
          {
            type: "texte",
            texte:
              "La condition est une expression logique qui vaut vrai ou faux. Si elle est vraie, le bloc s'exécute ; sinon, on passe directement après `fin si`.",
          },
          {
            type: "texte",
            texte:
              "Une condition peut être composée avec `et`, `ou`, `non`. Pour écrire 10 < X < 15, on écrit `(X > 10) et (X < 15)`. Et `(X < 10) et (X > 15)` n'est jamais vraie : aucun nombre ne vérifie les deux.",
          },
        ],
      },
      {
        id: "condition-composee",
        titre: "Si… sinon",
        blocs: [
          { type: "code", lignes: ["si X > 10 alors", "    écrire(X)", "sinon", "    écrire(\"valeur non acceptée\")", "fin si"] },
          {
            type: "attention",
            texte: "Quand des si sont imbriqués, un sinon se rapporte toujours au si le plus proche.",
          },
          {
            type: "exercice",
            titre: "Le plus grand de trois nombres",
            enonce: "Écris un algorithme qui lit x, y et z et affiche le plus grand.",
            solution: [
              {
                type: "code",
                lignes: [
                  "lire(x, y, z)",
                  "si (x ≥ y) et (x ≥ z) alors",
                  "    pg ← x",
                  "sinon",
                  "    si y ≥ z alors",
                  "        pg ← y",
                  "    sinon",
                  "        pg ← z",
                  "    fin si",
                  "fin si",
                  "écrire(\"Le plus grand est \", pg)",
                ],
              },
            ],
          },
        ],
      },
      {
        id: "choix-multiple",
        titre: "Le choix multiple",
        blocs: [
          {
            type: "texte",
            texte:
              "Quand on compare une même expression à une série de valeurs, le choix multiple est plus lisible qu'une cascade de si… sinon. Une branche par défaut traite les autres cas.",
          },
          {
            type: "code",
            lignes: [
              "selon X",
              "    1 : écrire(\"Un\")",
              "    2 : écrire(\"Deux\")",
              "    sinon écrire(\"Valeur hors de 1..2\")",
              "fin selon",
            ],
          },
          {
            type: "exercice",
            titre: "Année bissextile",
            enonce:
              "Une année A est bissextile si elle est divisible par 4, sauf si elle est divisible par 100 sans l'être par 400. Écris le test et vérifie-le sur 1984, 1900 et 800.",
            solution: [
              {
                type: "code",
                lignes: [
                  "lire(A)",
                  "si non (A mod 4 = 0) alors",
                  "    écrire(A, \" n'est pas bissextile\")",
                  "sinon",
                  "    si (A mod 100 = 0) et non (A mod 400 = 0) alors",
                  "        écrire(A, \" n'est pas bissextile\")",
                  "    sinon",
                  "        écrire(A, \" est bissextile\")",
                  "    fin si",
                  "fin si",
                ],
              },
              { type: "texte", texte: "1984 est bissextile, 1900 ne l'est pas (divisible par 100, pas par 400), 800 l'est (divisible par 400)." },
            ],
          },
        ],
      },
      {
        id: "tant-que",
        titre: "La boucle tant que",
        blocs: [
          {
            type: "texte",
            texte:
              "Elle répète un bloc **tant que** la condition est vraie. La condition est testée **avant** chaque tour : si elle est fausse dès le départ, le bloc ne s'exécute jamais.",
          },
          { type: "code", titre: "Afficher les nombres de 1 à 10", lignes: ["i ← 1", "tant que i ≤ 10 faire", "    écrire(i)", "    i ← i + 1", "fin tant que"] },
          {
            type: "attention",
            texte:
              "Le corps de la boucle doit faire évoluer la condition. Sans `i ← i + 1`, i resterait à 1 et la boucle ne s'arrêterait jamais : c'est une **boucle infinie**, une erreur que personne ne signale à ta place.",
          },
        ],
      },
      {
        id: "repeter",
        titre: "La boucle répéter… jusqu'à",
        blocs: [
          {
            type: "texte",
            texte:
              "Ici, la condition est testée **après** le corps : la boucle s'exécute au moins une fois, et s'arrête quand la condition devient vraie. Elle exprime une raison d'**arrêter**, là où tant que exprime une raison de **continuer**.",
          },
          { type: "code", lignes: ["i ← 1", "répéter", "    écrire(i)", "    i ← i + 1", "jusqu'à i > 10"] },
          {
            type: "exercice",
            titre: "Une saisie contrôlée",
            enonce: "Demande un nombre entre 1 et 3 jusqu'à ce que la réponse convienne.",
            solution: [
              {
                type: "code",
                lignes: [
                  "répéter",
                  "    écrire(\"Entrez un nombre entre 1 et 3\")",
                  "    lire(n)",
                  "    si (n < 1) ou (n > 3) alors",
                  "        écrire(\"Saisie erronée, recommencez\")",
                  "    fin si",
                  "jusqu'à (n ≥ 1) et (n ≤ 3)",
                ],
              },
              { type: "texte", texte: "Répéter s'impose : il faut lire au moins une fois avant de pouvoir tester la réponse." },
            ],
          },
        ],
      },
      {
        id: "pour",
        titre: "La boucle pour",
        blocs: [
          {
            type: "texte",
            texte:
              "Quand le nombre de tours est connu à l'avance, la boucle pour fait varier un **compteur** d'une valeur initiale à une valeur finale. Elle fait (fin − début + 1) tours avec un pas de 1.",
          },
          { type: "code", lignes: ["pour i de 1 à 10 faire", "    écrire(i)", "fin pour"] },
          {
            type: "retenir",
            texte:
              "On peut lire le compteur dans la boucle, mais on ne le modifie jamais à l'intérieur. Si le début dépasse déjà la fin, la boucle ne fait aucun tour.",
          },
          {
            type: "tableau",
            legende: "Quelle boucle choisir ?",
            entetes: ["Boucle", "Test", "Tours minimum", "Quand l'utiliser"],
            lignes: [
              ["tant que", "avant le corps", "0", "nombre de tours inconnu"],
              ["répéter… jusqu'à", "après le corps", "1", "il faut agir avant de tester"],
              ["pour", "compteur", "0", "nombre de tours connu"],
            ],
          },
          {
            type: "texte",
            texte: "Les boucles peuvent s'imbriquer. Pour afficher toutes les tables de multiplication de 1 à 10 :",
          },
          {
            type: "code",
            lignes: ["pour i de 1 à 10 faire", "    pour j de 1 à 10 faire", "        écrire(i, \" x \", j, \" = \", i * j)", "    fin pour", "fin pour"],
          },
        ],
      },
      {
        id: "pgcd",
        titre: "Dérouler une boucle : le PGCD d'Euclide",
        blocs: [
          {
            type: "texte",
            texte:
              "Pour trouver le plus grand diviseur commun de m et n, on divise m par n, puis n par le reste, et ainsi de suite jusqu'à un reste nul. Le dernier diviseur est le PGCD.",
          },
          {
            type: "code",
            titre: "Algorithme PGCD",
            lignes: ["lire(m, n)", "a ← m", "b ← n", "r ← a mod b", "tant que non (r = 0) faire", "    a ← b", "    b ← r", "    r ← a mod b", "fin tant que", "écrire(\"PGCD = \", b)"],
          },
          {
            type: "tableau",
            legende: "Déroulé avec m = 24 et n = 18",
            entetes: ["Étape", "a", "b", "r", "non (r = 0)"],
            lignes: [
              ["départ", "24", "18", "6", "vrai"],
              ["tour 1", "18", "6", "0", "faux"],
              ["fin", "18", "6", "0", "on affiche 6"],
            ],
          },
        ],
      },
      {
        id: "exercices",
        titre: "À toi de jouer",
        blocs: [
          {
            type: "exercice",
            titre: "Somme de 1 à n",
            enonce: "Calcule 1 + 2 + … + n pour un entier n positif lu au clavier, avec une boucle pour.",
            solution: [
              { type: "code", lignes: ["lire(n)", "somme ← 0", "pour i de 1 à n faire", "    somme ← somme + i", "fin pour", "écrire(\"Somme = \", somme)"] },
              { type: "texte", texte: "Pour n = 4 : somme passe par 1, 3, 6, puis 10." },
            ],
          },
          {
            type: "exercice",
            titre: "La factorielle",
            enonce: "Calcule n! = 1 × 2 × … × n (avec 0! = 1), en refusant les nombres négatifs.",
            solution: [
              {
                type: "code",
                lignes: [
                  "lire(n)",
                  "si n < 0 alors",
                  "    écrire(\"La factorielle d'un nombre négatif n'existe pas\")",
                  "sinon",
                  "    f ← 1",
                  "    pour i de 1 à n faire",
                  "        f ← f * i",
                  "    fin pour",
                  "    écrire(n, \"! = \", f)",
                  "fin si",
                ],
              },
              { type: "texte", texte: "Le produit part de 1, l'élément neutre de la multiplication : avec n = 0, la boucle ne tourne pas et on obtient bien 1." },
            ],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------
  {
    numero: 4,
    slug: "tableaux-et-fonctions",
    titre: "Tableaux et fonctions",
    resume: "Manipule des collections et crée des fonctions réutilisables.",
    duree: 35,
    notions: ["tableaux"],
    objectifs: [
      "Parcourir, chercher et trier dans un tableau",
      "Découper un problème en procédures et fonctions",
      "Comprendre les paramètres et la récursivité",
    ],
    sections: [
      {
        id: "tableaux",
        titre: "Le tableau",
        blocs: [
          {
            type: "texte",
            texte:
              "Un tableau regroupe sous un seul nom plusieurs valeurs **du même type**. Chaque case est repérée par son **indice**. Au lieu de dix variables note1 … note10, on déclare :",
          },
          { type: "code", lignes: ["notes : tableau [1..10] de réels", "notes[1] ← 12,5"] },
          {
            type: "texte",
            texte:
              "Le nombre de cases vaut indice_max − indice_min + 1 et ne change pas pendant l'exécution : on prévoit une taille suffisante. L'indice peut être un nombre, une variable ou une expression : c'est ce qui rend les boucles si utiles avec les tableaux.",
          },
          {
            type: "code",
            titre: "Somme et moyenne d'un tableau",
            lignes: ["somme ← 0", "pour i de 1 à 10 faire", "    somme ← somme + notes[i]", "fin pour", "moyenne ← somme / 10"],
          },
        ],
      },
      {
        id: "chercher",
        titre: "Chercher dans un tableau",
        blocs: [
          {
            type: "texte",
            texte:
              "La technique du **drapeau** (flag) : une variable booléenne vaut faux au départ et passe à vrai dès que l'événement attendu se produit. Avec un tant que, on s'arrête dès qu'on a trouvé.",
          },
          {
            type: "code",
            titre: "Recherche séquentielle",
            lignes: ["trouve ← faux", "i ← 1", "tant que (i ≤ 10) et non trouve faire", "    si T[i] = x alors", "        trouve ← vrai", "    sinon", "        i ← i + 1", "    fin si", "fin tant que"],
          },
          {
            type: "texte",
            texte:
              "Si le tableau est **trié**, la **recherche dichotomique** va beaucoup plus vite : on compare x à la case du milieu et on élimine la moitié qui ne peut pas le contenir, puis on recommence.",
          },
          {
            type: "code",
            titre: "Recherche dichotomique",
            lignes: [
              "inf ← 1",
              "sup ← 10",
              "trouve ← faux",
              "tant que non trouve et (sup ≥ inf) faire",
              "    milieu ← (inf + sup) div 2",
              "    si x = T[milieu] alors",
              "        trouve ← vrai",
              "    sinon",
              "        si x < T[milieu] alors",
              "            sup ← milieu - 1",
              "        sinon",
              "            inf ← milieu + 1",
              "        fin si",
              "    fin si",
              "fin tant que",
            ],
          },
          {
            type: "retenir",
            texte: "Sur 40 000 valeurs triées, la dichotomie conclut en 16 comparaisons au plus, contre 40 000 pour la recherche séquentielle.",
          },
        ],
      },
      {
        id: "trier",
        titre: "Trier un tableau",
        blocs: [
          {
            type: "texte",
            texte:
              "Le **tri par sélection** place d'abord le plus petit élément en case 1, puis le plus petit du reste en case 2, et ainsi de suite. Deux boucles imbriquées suffisent :",
          },
          {
            type: "code",
            lignes: [
              "pour i de 1 à 9 faire",
              "    pour j de i + 1 à 10 faire",
              "        si T[i] > T[j] alors",
              "            x ← T[i]",
              "            T[i] ← T[j]",
              "            T[j] ← x",
              "        fin si",
              "    fin pour",
              "fin pour",
            ],
          },
          {
            type: "texte",
            texte:
              "Le **tri à bulles** compare chaque élément à son voisin et les échange s'ils sont mal rangés. Un drapeau note s'il y a eu un échange ; on recommence tant qu'il y en a. Les grands éléments « remontent » comme des bulles vers la fin.",
          },
          {
            type: "texte",
            texte:
              "Un tableau peut aussi avoir **deux dimensions** (lignes et colonnes) : `M : tableau [1..3, 1..10] d'entiers`, et `M[2, 3]` désigne une case. Une **chaîne de caractères** se manipule comme un tableau de caractères : `mot[1]` est sa première lettre.",
          },
        ],
      },
      {
        id: "sous-programmes",
        titre: "Procédures et fonctions",
        blocs: [
          {
            type: "texte",
            texte:
              "Un sous-programme regroupe des instructions sous un nom, qu'on appelle ensuite autant de fois que nécessaire. Il réduit la taille du programme (on n'écrit plus deux fois les mêmes blocs) et l'organise (un sous-problème, un sous-programme).",
          },
          {
            type: "liste",
            items: [
              "Une **procédure** réalise une action ; on l'appelle comme une instruction.",
              "Une **fonction** renvoie un et un seul résultat ; on l'appelle dans une expression.",
            ],
          },
          {
            type: "code",
            titre: "Une fonction et son appel",
            lignes: ["fonction maximum(x, y : réel) : réel", "    si x > y alors", "        retourner x", "    sinon", "        retourner y", "    fin si", "fin fonction", "", "m ← maximum(a, b)"],
          },
          {
            type: "texte",
            texte:
              "`x` et `y` sont les paramètres **formels** ; `a` et `b`, les paramètres **effectifs** de l'appel. Ils doivent être aussi nombreux, dans le même ordre et du même type.",
          },
        ],
      },
      {
        id: "parametres",
        titre: "Paramètres et portée",
        blocs: [
          {
            type: "tableau",
            entetes: ["Passage", "Ce qui est transmis", "Effet sur l'appelant"],
            lignes: [
              ["par valeur", "une copie de la valeur", "aucun : la variable de l'appelant ne change pas"],
              ["par variable (var)", "la case mémoire elle-même", "les modifications sont visibles après l'appel"],
            ],
          },
          {
            type: "code",
            lignes: [
              "procédure changer(var Y : entier)",
              "    Y ← 1",
              "fin procédure",
              "",
              "H ← 0",
              "changer(H)",
              "écrire(H)    // affiche 1 ; sans var, afficherait 0",
            ],
          },
          {
            type: "texte",
            texte:
              "Les variables déclarées dans un sous-programme sont **locales** : elles n'existent que pendant son exécution. Celles du programme principal sont **globales**. Préfère les paramètres aux variables globales : un sous-programme qui modifie des variables globales a des effets de bord difficiles à suivre.",
          },
        ],
      },
      {
        id: "recursivite",
        titre: "La récursivité",
        blocs: [
          {
            type: "texte",
            texte:
              "Une fonction est **récursive** quand elle s'appelle elle-même. La factorielle s'y prête : n! = n × (n − 1)! et 0! = 1.",
          },
          { type: "code", lignes: ["fonction fact(n : entier) : entier", "    si n = 0 alors", "        retourner 1", "    sinon", "        retourner n * fact(n - 1)", "    fin si", "fin fonction"] },
          {
            type: "retenir",
            texte:
              "Une fonction récursive a besoin d'une **condition d'arrêt** (ici n = 0), et chaque appel doit s'en rapprocher. Sinon, les appels s'empilent jusqu'au débordement de la pile.",
          },
          {
            type: "tableau",
            legende: "fact(3), appel par appel",
            entetes: ["Appel", "Calcul", "Résultat"],
            lignes: [
              ["fact(0)", "condition d'arrêt", "1"],
              ["fact(1)", "1 × fact(0)", "1"],
              ["fact(2)", "2 × fact(1)", "2"],
              ["fact(3)", "3 × fact(2)", "6"],
            ],
          },
        ],
      },
      {
        id: "exercices",
        titre: "À toi de jouer",
        blocs: [
          {
            type: "exercice",
            titre: "Minimum et maximum d'un tableau",
            enonce: "Trouve la plus grande valeur d'un tableau de 10 entiers et sa position.",
            solution: [
              {
                type: "code",
                lignes: ["max ← T[1]", "pos ← 1", "pour i de 2 à 10 faire", "    si max < T[i] alors", "        max ← T[i]", "        pos ← i", "    fin si", "fin pour", "écrire(max, \" en position \", pos)"],
              },
              { type: "texte", texte: "Pour le minimum, il suffit de remplacer le test par `min > T[i]`." },
            ],
          },
          {
            type: "exercice",
            titre: "Le maximum de quatre nombres",
            enonce: "Avec la fonction maximum(x, y) ci-dessus, trouve le plus grand de quatre nombres lus au clavier. Déroule-le avec 50, 9, 80, 5.",
            solution: [
              { type: "code", lignes: ["lire(m)", "pour i de 1 à 3 faire", "    lire(nombre)", "    m ← maximum(nombre, m)", "fin pour", "écrire(\"Le maximum = \", m)"] },
              { type: "texte", texte: "m vaut 50, reste 50 après 9, passe à 80, reste 80 après 5. Le maximum est 80." },
            ],
          },
        ],
      },
    ],
  },
];

export const DUREE_TOTALE = CHAPITRES.reduce((t, c) => t + c.duree, 0);

export function formaterDuree(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h${m ? ` ${String(m).padStart(2, "0")}` : ""}` : `${m} min`;
}

export const chapitreParSlug = (slug: string) => CHAPITRES.find((c) => c.slug === slug);

// --------------------------------------------------------------------------
// Recherche dans le cours : titres de chapitres et de sections, textes
// --------------------------------------------------------------------------

export interface ResultatRecherche {
  chapitre: Chapitre;
  section?: Section;
  extrait: string;
}

const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function textesDe(blocs: Bloc[]): string[] {
  return blocs.flatMap((b) => {
    switch (b.type) {
      case "texte":
      case "retenir":
      case "attention":
        return [b.texte];
      case "liste":
        return b.items;
      case "code":
        return b.titre ? [b.titre, ...b.lignes] : b.lignes;
      case "tableau":
        return [b.legende ?? "", ...b.entetes, ...b.lignes.flat()];
      case "exercice":
        return [b.titre, b.enonce, ...textesDe(b.solution)];
    }
  });
}

export function rechercherDansCours(requete: string, limite = 8): ResultatRecherche[] {
  const q = sansAccents(requete.trim());
  if (q.length < 2) return [];
  const resultats: ResultatRecherche[] = [];
  for (const chapitre of CHAPITRES) {
    if (sansAccents(chapitre.titre + " " + chapitre.resume).includes(q)) resultats.push({ chapitre, extrait: chapitre.resume });
    for (const section of chapitre.sections) {
      if (sansAccents(section.titre).includes(q)) {
        resultats.push({ chapitre, section, extrait: section.titre });
        continue;
      }
      const texte = textesDe(section.blocs).find((t) => sansAccents(t).includes(q));
      if (texte) resultats.push({ chapitre, section, extrait: texte.replace(/[*`]/g, "") });
    }
  }
  return resultats.slice(0, limite);
}
