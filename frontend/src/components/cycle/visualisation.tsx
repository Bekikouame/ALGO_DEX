"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Terminal, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Execution, Valeur } from "@/lib/api";
import { afficherValeur } from "@/lib/format";
import { PseudoCode } from "./pseudo-code";

const VITESSES = [1, 2, 4] as const;

/** Visualisation pas à pas (F5) : variables, console et ligne courante à chaque pas. */
export function Visualisation({
  execution,
  initiales = {},
}: {
  execution: Pick<Execution, "lignes" | "trace" | "erreur">;
  initiales?: Record<string, Valeur>;
}) {
  const { trace, lignes, erreur } = execution;
  const dernier = Math.max(trace.length - 1, 0);
  const [i, setI] = useState(0);
  const [lecture, setLecture] = useState(false);
  const [vitesse, setVitesse] = useState<(typeof VITESSES)[number]>(1);
  const enLecture = lecture && i < dernier;

  useEffect(() => {
    if (!enLecture) return;
    const minuteur = setTimeout(() => setI((x) => Math.min(x + 1, dernier)), 900 / vitesse);
    return () => clearTimeout(minuteur);
  }, [enLecture, i, dernier, vitesse]);

  const pas = trace[i];
  // Avant le premier pas, seules les entrées de l'exercice existent.
  const precedent = i > 0 ? trace[i - 1] : { variables: initiales };
  const variables = pas?.variables ?? {};
  const changees = pas
    ? Object.keys(pas.variables).filter((k) => JSON.stringify(pas.variables[k]) !== JSON.stringify(precedent.variables[k]))
    : [];
  const indexDe = useMemo(() => indicesDeTableaux(lignes.map((l) => l.texte)), [lignes]);
  const console_ = trace.slice(0, i + 1).flatMap((p) => (p.ecrit !== null ? [p.ecrit] : []));
  const fin = i === dernier;
  const tableaux = Object.entries(variables).filter(([, v]) => Array.isArray(v)) as [string, Valeur[]][];
  const simples = Object.entries(variables).filter(([, v]) => !Array.isArray(v));

  if (trace.length === 0) {
    return erreur ? <BandeauErreur erreur={erreur} /> : <p className="text-muted">Rien à exécuter.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* La scène : cases du tableau (maquette 2) ou cartes de variables */}
      <div className="grille-papier relative overflow-hidden rounded-2xl border border-border bg-surface px-4 py-6 sm:px-8">
        {tableaux.map(([nom, cases]) => {
          const idx = indexDe[nom]
            ?.map((v) => variables[v])
            .find((v): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v < cases.length);
          const avant = precedent.variables[nom];
          return (
            <div key={nom} className="mb-6 last:mb-0">
              <div className="mb-3 font-mono text-sm text-muted">{nom}</div>
              <div className="flex flex-wrap gap-3">
                {cases.map((c, k) => {
                  const modifiee = Array.isArray(avant) && JSON.stringify(avant[k]) !== JSON.stringify(c);
                  const courante = k === idx;
                  return (
                    <div key={k} className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex h-16 min-w-16 items-center justify-center rounded-2xl border-2 px-3 font-display text-2xl font-semibold shadow-card transition-all sm:h-20 sm:min-w-20 sm:text-3xl ${
                          modifiee
                            ? "pulse-doux border-accent bg-accent text-white"
                            : courante
                              ? "border-primary bg-primary text-on-primary"
                              : "border-border bg-primary-soft text-text"
                        }`}
                      >
                        {afficherValeur(c)}
                      </div>
                      <span className="font-mono text-xs text-muted">{k}</span>
                      {courante && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-on-primary">
                          case courante
                        </span>
                      )}
                      {modifiee && !courante && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-white">modifiée</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className={`flex flex-wrap gap-3 ${tableaux.length ? "mt-2 border-t border-dashed border-border pt-4" : ""}`}>
          {simples.length === 0 && <p className="text-sm text-muted">Aucune variable pour l&apos;instant.</p>}
          {simples.map(([nom, v]) => {
            const change = changees.includes(nom);
            return (
              <div
                key={nom}
                className={`min-w-20 rounded-2xl border-2 px-4 py-3 text-center transition-colors ${
                  change ? "pulse-doux border-primary bg-primary-soft" : "border-border bg-surface"
                }`}
              >
                <div className="font-mono text-xs text-muted">{nom}</div>
                <div className="font-display text-2xl font-semibold">{afficherValeur(v)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commandes : précédent, lecture, suivant, vitesse */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setLecture(false);
            setI((x) => Math.max(x - 1, 0));
          }}
          disabled={i === 0}
          className="flex items-center gap-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium disabled:opacity-40"
        >
          <ChevronLeft size={16} /> Précédent
        </button>
        <button
          type="button"
          onClick={() => {
            if (fin) setI(0);
            setLecture(fin || !enLecture);
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-card"
          aria-label={enLecture ? "Pause" : fin ? "Rejouer" : "Lecture automatique"}
        >
          {enLecture ? <Pause size={20} /> : fin ? <RotateCcw size={18} /> : <Play size={20} className="ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={() => setI((x) => Math.min(x + 1, dernier))}
          disabled={fin}
          className="flex items-center gap-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium disabled:opacity-40"
        >
          Suivant <ChevronRight size={16} />
        </button>
        <div className="ml-auto flex items-center gap-2 rounded-xl border border-border bg-surface p-1 text-sm">
          <span className="px-2 text-muted">Vitesse</span>
          {VITESSES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVitesse(v)}
              aria-pressed={vitesse === v}
              className={`rounded-lg px-3 py-1 ${vitesse === v ? "bg-primary text-on-primary" : "text-muted"}`}
            >
              {v}x
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={dernier}
          value={i}
          onChange={(e) => {
            setLecture(false);
            setI(Number(e.target.value));
          }}
          aria-label="Pas d'exécution"
          className="flex-1 accent-[var(--primary)]"
        />
        <span className="w-24 text-right font-mono text-xs text-muted">
          pas {i + 1} / {trace.length}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <PseudoCode lignes={lignes} courante={pas.ligne} ligneErreur={fin ? erreur?.ligne : null} />
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <div className="mb-2 text-sm font-semibold text-primary">Cette étape</div>
            <p className="text-sm">{pas.description}</p>
            {changees.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {changees.map((nom) => (
                  <li key={nom} className="flex flex-wrap items-center gap-2 font-mono text-sm">
                    <span className="text-muted">{nom} :</span>
                    <span className="rounded-md bg-surface-2 px-2 py-0.5">{afficherValeur(precedent.variables[nom])}</span>
                    <ArrowRight size={14} className="text-success" />
                    <span className="rounded-md bg-success-soft px-2 py-0.5 font-semibold text-success">
                      {afficherValeur(pas.variables[nom])}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl bg-code-bg text-code-text">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-sm font-medium">
              <Terminal size={16} className="opacity-70" /> Console
            </div>
            <pre className="min-h-20 px-4 py-3 font-mono text-[13px] leading-6">
              {console_.length ? console_.join("\n") : <span className="opacity-40">(rien d&apos;affiché)</span>}
            </pre>
          </div>
        </div>
      </div>

      {fin && erreur && <BandeauErreur erreur={erreur} />}
    </div>
  );
}

function BandeauErreur({ erreur }: { erreur: NonNullable<Execution["erreur"]> }) {
  return (
    <div role="alert" className="flex gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
      <TriangleAlert size={18} className="mt-0.5 shrink-0" />
      <div>
        <div className="font-semibold">Arrêt{erreur.ligne ? ` à la ligne ${erreur.ligne}` : ""}</div>
        <div>{erreur.message}</div>
      </div>
    </div>
  );
}

/** Pour chaque tableau, les variables qui servent d'indice (t[i] → i). */
function indicesDeTableaux(lignes: string[]): Record<string, string[]> {
  const resultat: Record<string, string[]> = {};
  for (const texte of lignes) {
    for (const [, tableau, indice] of texte.matchAll(/([A-Za-z_]\w*)\[([A-Za-z_]\w*)\]/g)) {
      resultat[tableau] = [...new Set([...(resultat[tableau] ?? []), indice])];
    }
  }
  return resultat;
}
