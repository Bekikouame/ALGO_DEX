// Guide en cage (F10) : un écran par notion, un exemple tracé, jamais la réponse de l'exercice.
// Les guides actés de la première version du projet. La trace reprend leur déroulé, ligne par ligne.

import type { Notion } from "./api";

export interface Guide {
  titre: string;
  texte: string[];
  code: string[];
  trace: { colonnes: string[]; lignes: string[][] };
}

export const GUIDES: Record<Notion, Guide> = {
  variables: {
    titre: "Une variable, c'est une boîte étiquetée",
    texte: [
      "Une variable est une boîte avec une étiquette (son nom) et un contenu (sa valeur).",
      "L'affectation « x ← 5 » met 5 dans la boîte x. Elle ÉCRASE l'ancien contenu, sans avertissement.",
      "Dans « x ← x + 1 », le côté droit est calculé AVANT avec l'ancienne valeur, puis le résultat remplace l'ancien.",
      "Le piège n°1 du débutant : lire une ligne comme une égalité mathématique. Ce n'est pas « x égale », c'est « x reçoit ».",
    ],
    code: ["x ← 3", "x ← x + 2", "y ← x * 10", "x ← y - x"],
    trace: { colonnes: ["ligne", "x", "y"], lignes: [["1", "3", "—"], ["2", "5", "—"], ["3", "5", "50"], ["4", "45", "50"]] },
  },
  conditions: {
    titre: "Un si, c'est un aiguillage ferroviaire",
    texte: [
      "Le bloc « si … alors / sinon » évalue la condition, puis choisit UNE SEULE voie : l'autre branche est totalement ignorée.",
      "Les comparaisons s'écrivent avec =, ≠, <, ≤, >, ≥ — et « et » / « ou » combinent plusieurs conditions.",
      "Les si peuvent s'imbriquer : un test dans une branche d'un autre test. On lit alors de l'extérieur vers l'intérieur.",
      "Le piège n°1 : croire que les deux branches s'exécutent. Jamais. Une seule, jamais les deux.",
    ],
    code: ["age ← 15", "si age ≥ 18 alors", '    statut ← "majeur"', "sinon", '    statut ← "mineur"', "fin si", "écrire(statut)"],
    trace: {
      colonnes: ["ligne", "age", "condition", "statut"],
      lignes: [["1", "15", "", "—"], ["2", "15", "faux", "—"], ["5", "15", "", "mineur"], ["7", "15", "", "mineur"]],
    },
  },
  boucles: {
    titre: "Une boucle, c'est un compteur qui répète",
    texte: [
      "« pour i de 1 à 5 » répète le corps en faisant glisser i de 1 à 5, un tour par valeur.",
      "« tant que … faire » teste AVANT chaque tour : si la condition devient fausse, on sort et on continue après la boucle.",
      "Un accumulateur (somme ← somme + i) est une variable que la boucle enrichit tour après tour.",
      "Le piège n°1 : une condition de « tant que » qui ne devient jamais fausse — la boucle tourne à l'infini.",
    ],
    code: ["somme ← 0", "pour i de 1 à 3 faire", "    somme ← somme + i", "fin pour", "écrire(somme)"],
    trace: { colonnes: ["tour", "i", "somme"], lignes: [["avant", "—", "0"], ["1", "1", "1"], ["2", "2", "3"], ["3", "3", "6"]] },
  },
  tableaux: {
    titre: "Un tableau, c'est une commode à tiroirs numérotés",
    texte: [
      "Un tableau range plusieurs valeurs sous UN nom : t = [5, 12, 3]. Chaque case a un numéro d'indice.",
      "Les indices commencent À 0 : t[0] = 5, t[1] = 12, t[2] = 3. Un tableau de 4 cases va donc de 0 à 3.",
      "On parcourt un tableau avec une boucle dont le compteur sert d'indice : t[i] désigne la case courante.",
      "Le piège n°1 : demander t[4] à un tableau de 4 cases — l'indice 4 est hors du tableau (0 à 3 seulement).",
    ],
    code: ["t ← [5, 12, 3]", "total ← 0", "pour i de 0 à 2 faire", "    total ← total + t[i]", "fin pour", "écrire(total)"],
    trace: { colonnes: ["ligne", "i", "total"], lignes: [["2", "—", "0"], ["4", "0", "5"], ["4", "1", "17"], ["4", "2", "20"]] },
  },
};
