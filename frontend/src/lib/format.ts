import type { Moment, Valeur } from "./api";

export function afficherValeur(v: Valeur | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "vrai" : "faux";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e10) / 1e10);
  if (Array.isArray(v)) return `[${v.map(afficherValeur).join(", ")}]`;
  return String(v);
}

const ORDINAUX = ["", "1er", "2e", "3e", "4e", "5e", "6e", "7e", "8e", "9e", "10e"];
const ordinal = (n: number) => ORDINAUX[n] ?? `${n}e`;
const ordinalFeminin = (n: number) => (n === 1 ? "1re" : ordinal(n));

export function decrireMoment(m: Moment, variable: string): string {
  if (m.type === "fin") return "à la fin de l'exécution";
  if (m.type === "affectation") return `juste après la ${ordinalFeminin(m.numero ?? 1)} affectation de ${variable}`;
  const boucle = m.boucle && m.boucle > 1 ? ` de la ${ordinalFeminin(m.boucle)} boucle` : "";
  return `à la fin du ${ordinal(m.numero ?? 1)} tour${boucle}`;
}
