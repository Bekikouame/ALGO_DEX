"use client";

import { ChevronRight, Lightbulb, PlayCircle } from "lucide-react";
import { useState } from "react";
import { api, type Indice } from "@/lib/api";
import { enPseudoCode, type Bloc } from "@/lib/blocs";

/** Échelle d'indices (F7) : une marche par clic, aucune pénalité. */
export function EchelleIndices({
  tentativeId,
  nbIndices,
  propose,
  onDeroulement,
}: {
  tentativeId: string;
  nbIndices: number;
  propose: boolean;
  onDeroulement: () => void;
}) {
  const [marches, setMarches] = useState<Indice[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const derniere = marches.at(-1);

  async function marcheSuivante() {
    setErreur(null);
    try {
      const r = await api.indice(tentativeId, marches.length + 1);
      if (r.resultat) setMarches((m) => [...m, r.resultat!]);
    } catch (e) {
      setErreur((e as Error).message);
    }
  }

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        propose && !ouvert ? "border-primary bg-primary-soft" : "border-border bg-surface"
      }`}
    >
      <button type="button" onClick={() => setOuvert((o) => !o)} className="flex w-full items-center gap-3 text-left" aria-expanded={ouvert}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Lightbulb size={20} />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-primary">Besoin d&apos;un coup de pouce ?</span>
          <span className="block text-xs text-muted">
            {propose ? "Deux essais sans succès : un indice ne coûte rien." : "Une marche à la fois, sans pénalité."}
          </span>
        </span>
        <ChevronRight size={18} className={`text-muted transition-transform ${ouvert ? "rotate-90" : ""}`} />
      </button>

      {ouvert && (
        <div className="mt-4 flex flex-col gap-3">
          {marches.map((m) => (
            <div key={m.marche} className="rounded-xl bg-surface-2 p-3 text-sm">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Marche {m.marche}</div>
              <p>{m.indice.texte}</p>
              {m.indice.blocs && (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-code-bg p-3 font-mono text-xs leading-5 text-code-text">
                  {enPseudoCode(m.indice.blocs as Bloc[]).join("\n")}
                </pre>
              )}
            </div>
          ))}
          {(!derniere || !derniere.derniere) && marches.length < nbIndices ? (
            <button
              type="button"
              onClick={marcheSuivante}
              className="self-start rounded-xl border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary-soft"
            >
              {marches.length === 0 ? "Voir la première marche" : `Marche ${marches.length + 1}`}
            </button>
          ) : (
            <button
              type="button"
              onClick={onDeroulement}
              className="flex items-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary"
            >
              <PlayCircle size={16} /> Déroulement guidé
            </button>
          )}
          {erreur && <p className="text-sm text-danger">{erreur}</p>}
        </div>
      )}
    </div>
  );
}
