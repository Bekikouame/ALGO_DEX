// Guide en cage (F10) : un écran par notion, un exemple tracé, jamais la réponse
// de l'exercice. Contenu provisoire, à remplacer par celui du porteur.

import type { Notion } from "./api";

export interface Guide {
  idee: string;
  code: string[];
  trace: { colonnes: string[]; lignes: string[][] };
  regarder: string;
}

export const GUIDES: Record<Notion, Guide> = {
  variables: {
    idee: "Une variable est une boîte qui garde une seule valeur. Chaque affectation ← remplace l'ancienne valeur.",
    code: ["a ← 2", "b ← a + 3", "a ← b * 2"],
    trace: { colonnes: ["ligne", "a", "b"], lignes: [["1", "2", "—"], ["2", "2", "5"], ["3", "10", "5"]] },
    regarder: "Ligne après ligne, note la valeur de chaque boîte. La droite du ← se calcule avec les valeurs actuelles.",
  },
  conditions: {
    idee: "Un si évalue sa condition en vrai ou faux, puis n'exécute qu'une seule des deux branches.",
    code: ["x ← 4", "si x > 5 alors", "    y ← 1", "sinon", "    y ← 0", "fin si"],
    trace: { colonnes: ["ligne", "x", "condition", "y"], lignes: [["1", "4", "", "—"], ["2", "4", "faux", "—"], ["5", "4", "", "0"]] },
    regarder: "Calcule la condition avec les valeurs du moment, puis saute directement dans la bonne branche.",
  },
  boucles: {
    idee: "Une boucle répète son corps. Un « tour » se termine quand on revient en haut de la boucle.",
    code: ["p ← 1", "pour k de 1 à 3 faire", "    p ← p * 2", "fin pour"],
    trace: { colonnes: ["tour", "k", "p"], lignes: [["avant", "—", "1"], ["1", "1", "2"], ["2", "2", "4"], ["3", "3", "8"]] },
    regarder: "Fais une ligne par tour : la valeur du compteur, puis celle des variables à la fin du tour.",
  },
  tableaux: {
    idee: "Un tableau range plusieurs valeurs dans des cases numérotées à partir de 0. t[i] désigne la case n° i.",
    code: ["t ← [6, 1, 4]", "t[0] ← t[1] + t[2]"],
    trace: { colonnes: ["ligne", "t[0]", "t[1]", "t[2]"], lignes: [["1", "6", "1", "4"], ["2", "5", "1", "4"]] },
    regarder: "Dessine les cases avec leur numéro dessous, et repère quelle case l'indice désigne à chaque pas.",
  },
};
