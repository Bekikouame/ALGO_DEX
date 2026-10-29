// Lecture de la *forme* du pseudo-code reçu du moteur, pour choisir la mise en scène.
// Rien ici ne calcule une valeur : les valeurs viennent toujours de la trace renvoyée par le serveur.
import type { LignePseudo, PasTrace } from "@/lib/api";

const indentation = (t: string) => t.length - t.trimStart().length;

export type Branche = { ligne: number; condition: string; alors: number | null; sinon: number | null };
export type Boucle = { ligne: number; entete: string; corps: number | null };

/** Chaque « si », avec la première ligne de sa branche alors et de sa branche sinon. */
export function branches(lignes: LignePseudo[]): Branche[] {
  const res: Branche[] = [];
  lignes.forEach((l, i) => {
    const t = l.texte.trim();
    if (!t.startsWith("si ")) return;
    const niveau = indentation(l.texte);
    let sinon: number | null = null;
    for (let j = i + 1; j < lignes.length; j++) {
      if (indentation(lignes[j].texte) !== niveau) continue;
      const tj = lignes[j].texte.trim();
      if (tj === "sinon") sinon = lignes[j + 1]?.ligne ?? null;
      if (tj === "fin si") break;
    }
    res.push({ ligne: l.ligne, condition: t.replace(/^si\s+/, "").replace(/\s+alors$/, ""), alors: lignes[i + 1]?.ligne ?? null, sinon });
  });
  return res;
}

/** Chaque boucle, avec la première ligne de son corps (un passage dans le corps = un tour). */
export function boucles(lignes: LignePseudo[]): Boucle[] {
  return lignes.flatMap((l, i) => {
    const t = l.texte.trim();
    if (!t.startsWith("pour ") && !t.startsWith("tant que ")) return [];
    return [{ ligne: l.ligne, entete: t.replace(/\s+faire$/, ""), corps: lignes[i + 1]?.ligne ?? null }];
  });
}

/** Les tableaux écrits en toutes lettres (t ← [4, 8, 15]) : leur nom et leur nombre de cases. */
export function tableauxEcrits(lignes: LignePseudo[]): Record<string, number> {
  const res: Record<string, number> = {};
  for (const l of lignes) {
    const m = l.texte.trim().match(/^([A-Za-z_]\w*)\s*←\s*\[(.*)\]$/);
    if (m) res[m[1]] = m[2].trim() ? m[2].split(",").length : 0;
  }
  return res;
}

/** Les variables affectées, dans l'ordre où elles apparaissent. */
export function variablesAffectees(lignes: LignePseudo[]): string[] {
  const noms: string[] = [];
  for (const l of lignes) {
    const m = l.texte.trim().match(/^([A-Za-z_]\w*)(\[[^\]]*\])?\s*←/);
    if (m && !noms.includes(m[1])) noms.push(m[1]);
  }
  return noms;
}

/** Pour chaque tableau, les variables qui lui servent d'indice (t[i] → i). */
export function indicesDeTableaux(lignes: LignePseudo[]): Record<string, string[]> {
  const res: Record<string, string[]> = {};
  for (const l of lignes) {
    for (const [, tableau, indice] of l.texte.matchAll(/([A-Za-z_]\w*)\[([A-Za-z_]\w*)\]/g)) {
      res[tableau] = [...new Set([...(res[tableau] ?? []), indice])];
    }
  }
  return res;
}

/** Nombre de tours déjà commencés dans une boucle, d'après la trace jusqu'au pas k. */
export function tours(trace: PasTrace[], k: number, boucle: Boucle): number {
  return trace.slice(0, k + 1).filter((p) => p.ligne === boucle.corps).length;
}
