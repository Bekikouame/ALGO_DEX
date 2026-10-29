// Modèle des blocs : exactement le JSON attendu par l'interpréteur du moteur.
// Les expressions sont des chaînes, composées jeton par jeton dans l'éditeur.

export type Bloc =
  | { type: "affectation"; variable: string; index?: string; valeur: string }
  | { type: "si"; condition: string; alors: Bloc[]; sinon: Bloc[] }
  | { type: "tant_que"; condition: string; corps: Bloc[] }
  | { type: "pour"; variable: string; debut: string; fin: string; pas?: string; corps: Bloc[] }
  | { type: "ecrire"; valeurs: string[] };

export type TypeBloc = Bloc["type"];

export const LIBELLES_BLOC: Record<TypeBloc, string> = {
  affectation: "Affectation",
  si: "Si / sinon",
  tant_que: "Tant que",
  pour: "Pour",
  ecrire: "Écrire",
};

export function blocVide(type: TypeBloc): Bloc {
  switch (type) {
    case "affectation":
      return { type, variable: "", valeur: "" };
    case "si":
      return { type, condition: "", alors: [], sinon: [] };
    case "tant_que":
      return { type, condition: "", corps: [] };
    case "pour":
      return { type, variable: "", debut: "", fin: "", corps: [] };
    case "ecrire":
      return { type, valeurs: [""] };
  }
}

/** Le chemin d'un emplacement de blocs, ex. [2, "corps", 0, "alors"]. */
export type Chemin = (number | "alors" | "sinon" | "corps")[];

export function lireSequence(blocs: Bloc[], chemin: Chemin): Bloc[] {
  let courant: Bloc[] = blocs;
  for (let i = 0; i < chemin.length; i += 2) {
    const bloc = courant[chemin[i] as number] as Record<string, unknown>;
    courant = bloc[chemin[i + 1] as string] as Bloc[];
  }
  return courant;
}

/** Copie profonde puis modification de la séquence désignée. */
export function modifierSequence(blocs: Bloc[], chemin: Chemin, f: (seq: Bloc[]) => Bloc[]): Bloc[] {
  if (chemin.length === 0) return f(blocs);
  const [i, cle, ...reste] = chemin;
  return blocs.map((b, k) => {
    if (k !== i) return b;
    const parent = b as Record<string, unknown>;
    return { ...parent, [cle as string]: modifierSequence(parent[cle as string] as Bloc[], reste, f) } as Bloc;
  });
}

/** Les noms de variables connus : entrées + variables affectées ou parcourues. */
export function variablesConnues(blocs: Bloc[], entrees: Record<string, unknown> = {}): string[] {
  const noms = new Set(Object.keys(entrees));
  const visiter = (seq: Bloc[]) => {
    for (const b of seq) {
      if ((b.type === "affectation" || b.type === "pour") && b.variable) noms.add(b.variable);
      if (b.type === "si") {
        visiter(b.alors);
        visiter(b.sinon);
      }
      if (b.type === "tant_que" || b.type === "pour") visiter(b.corps);
    }
  };
  visiter(blocs);
  return [...noms];
}

export function compterBlocs(blocs: Bloc[]): number {
  return blocs.reduce((n, b) => {
    if (b.type === "si") return n + 1 + compterBlocs(b.alors) + compterBlocs(b.sinon);
    if (b.type === "tant_que" || b.type === "pour") return n + 1 + compterBlocs(b.corps);
    return n + 1;
  }, 0);
}

// --------------------------------------------------------------------------
// Jetons d'expression
// --------------------------------------------------------------------------

const MOTIF_JETON = /"[^"]*"|'[^']*'|\d+(?:[.,]\d+)?|[A-Za-z_][A-Za-z0-9_]*\s*\(?|<=|>=|!=|==|<>|[≤≥≠=<>+\-*/()[\],]/g;

const NORMALISATION: Record<string, string> = { "<=": "≤", ">=": "≥", "!=": "≠", "<>": "≠", "==": "=" };

export function enJetons(expression: string): string[] {
  return (expression.match(MOTIF_JETON) ?? []).map((j) => {
    const net = j.replace(/\s+/g, "");
    return NORMALISATION[net] ?? net;
  });
}

export function depuisJetons(jetons: string[]): string {
  return jetons.join(" ").replace(/\( /g, "(").replace(/ \)/g, ")").replace(/ \[ /g, "[").replace(/ \]/g, "]");
}

// --------------------------------------------------------------------------
// Pseudo-code (même rendu que le moteur, pour les blocs d'indice)
// --------------------------------------------------------------------------

export function enPseudoCode(blocs: Bloc[], niveau = 0): string[] {
  const p = "    ".repeat(niveau);
  return blocs.flatMap((b): string[] => {
    switch (b.type) {
      case "affectation":
        return [`${p}${b.variable}${b.index ? `[${b.index}]` : ""} ← ${b.valeur}`];
      case "ecrire":
        return [`${p}écrire(${b.valeurs.join(", ")})`];
      case "si":
        return [
          `${p}si ${b.condition} alors`,
          ...enPseudoCode(b.alors, niveau + 1),
          ...(b.sinon.length ? [`${p}sinon`, ...enPseudoCode(b.sinon, niveau + 1)] : []),
          `${p}fin si`,
        ];
      case "tant_que":
        return [`${p}tant que ${b.condition} faire`, ...enPseudoCode(b.corps, niveau + 1), `${p}fin tant que`];
      case "pour":
        return [`${p}pour ${b.variable} de ${b.debut} à ${b.fin} faire`, ...enPseudoCode(b.corps, niveau + 1), `${p}fin pour`];
    }
  });
}
