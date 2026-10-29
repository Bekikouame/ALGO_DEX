import { Code2 } from "lucide-react";
import type { ReactNode } from "react";
import type { LignePseudo } from "@/lib/api";

/** Le panneau de pseudo-code sombre (maquette 2), ligne courante surlignée. */
export function PseudoCode({
  lignes,
  courante,
  ligneErreur,
  titre = "Pseudo-code",
  className = "",
}: {
  lignes: LignePseudo[];
  courante?: number | null;
  ligneErreur?: number | null;
  titre?: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-code-bg text-code-text ${className}`}>
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-sm font-medium">
        <Code2 size={16} className="opacity-70" /> {titre}
      </div>
      <div className="overflow-x-auto py-2">
        <pre className="min-w-max font-mono text-[13px] leading-7">
          {lignes.map((l) => {
            const active = l.ligne === courante;
            const erreur = l.ligne === ligneErreur;
            return (
              <div
                key={l.ligne}
                aria-current={active ? "step" : undefined}
                className={`flex pr-4 ${erreur ? "bg-red-500/25" : active ? "bg-[#2156e0]/45" : ""}`}
              >
                <span className="w-10 shrink-0 select-none pr-3 text-right opacity-45">
                  {active ? "▶" : ""}
                  {l.ligne}
                </span>
                <span className="whitespace-pre">{colorer(l.texte)}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

const MOTS_CLES = /\b(si|alors|sinon|fin si|tant que|fin tant que|faire|pour|fin pour|de|à|pas|écrire|et|ou|non|div|mod|vrai|faux|longueur)\b/g;

function colorer(texte: string) {
  const morceaux: ReactNode[] = [];
  let dernier = 0;
  for (const m of texte.matchAll(MOTS_CLES)) {
    morceaux.push(texte.slice(dernier, m.index));
    morceaux.push(
      <span key={m.index} className="text-[#8fb4ff]">
        {m[0]}
      </span>,
    );
    dernier = (m.index ?? 0) + m[0].length;
  }
  morceaux.push(texte.slice(dernier));
  return morceaux;
}
