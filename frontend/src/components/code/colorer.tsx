const MOTS_CLES = new Set([
  "pour", "de", "à", "faire", "fin", "écrire", "si", "alors", "sinon", "tant", "que",
  "mod", "div", "et", "ou", "non", "vrai", "faux", "longueur",
]);
const OPERATEURS = new Set(["←", "+", "-", "*", ">", "<", "≥", "≤", "≠", "="]);

/** Coloration du pseudo-code sur fond sombre : mots-clés, opérateurs, nombres, textes, variables. */
export function colorer(texte: string) {
  return texte.split(/("[^"]*"|\s+|[()[\],←+\-*<>≥≤≠=])/).map((m, n) => {
    if (!m) return null;
    if (MOTS_CLES.has(m)) return <span key={n} className="text-[#c4a7ff]">{m}</span>;
    if (OPERATEURS.has(m)) return <span key={n} className="text-[#f062b8]">{m}</span>;
    if (/^\d+$/.test(m)) return <span key={n} className="text-[#f5b06b]">{m}</span>;
    if (m.startsWith('"')) return <span key={n} className="text-[#3ddbb0]">{m}</span>;
    if (/^[a-z_]\w*$/i.test(m)) return <span key={n} className="text-[#8fd8ff]">{m}</span>;
    return m;
  });
}
