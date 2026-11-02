"use client";

import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Terminal, TriangleAlert } from "lucide-react";
import type { Execution, PasTrace, Valeur } from "@/lib/api";
import { afficherValeur } from "@/lib/format";
import { branches, boucles, indicesDeTableaux } from "@/components/test/analyse";
import { RobotAlgo } from "@/components/espace/illustrations";

// Tout ce qui s'affiche ici vient de la trace renvoyée par le moteur (POST /api/executer) :
// ligne de chaque pas, description, variables, sorties, erreur. Rien n'est recalculé côté navigateur.

type Vars = Record<string, Valeur>;
export const VITESSES = [0.5, 1, 2, 4] as const;

export type Commandes = {
  k: number;
  dernier: number;
  enLecture: boolean;
  vitesse: number;
  aller: (k: number) => void;
  basculerLecture: () => void;
  changerVitesse: (v: number) => void;
};

/** Le verdict d'une condition, tel que le moteur l'écrit : « condition x > 5 → vrai ». */
const verdict = (p: PasTrace): boolean | null => (/→ vrai$/.test(p.description) ? true : /→ faux$/.test(p.description) ? false : null);

/** La barre de contrôle : tout se rejoue depuis la trace déjà reçue, sans relancer l'algorithme. */
export function BarreControle({ c, total }: { c: Commandes; total: number }) {
  const fin = c.k >= c.dernier;
  const bouton = "flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text transition-colors hover:border-primary hover:text-primary disabled:opacity-35";
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Contrôles d'exécution">
      <button type="button" className={bouton} onClick={() => c.aller(0)} disabled={c.k === 0} aria-label="Revenir au début" title="Revenir au début">
        <RotateCcw size={16} />
      </button>
      <button type="button" className={bouton} onClick={() => c.aller(c.k - 1)} disabled={c.k === 0} aria-label="Étape précédente" title="Étape précédente (←)">
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={c.basculerLecture}
        aria-label={c.enLecture ? "Pause" : fin ? "Rejouer" : "Lecture"}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_10px_24px_-10px_var(--primary)] transition-transform hover:scale-105"
      >
        {c.enLecture ? <Pause size={18} /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
      </button>
      <button type="button" className={bouton} onClick={() => c.aller(c.k + 1)} disabled={fin} aria-label="Étape suivante" title="Étape suivante (→)">
        <ChevronRight size={18} />
      </button>
      <input
        type="range"
        min={0}
        max={c.dernier}
        value={c.k}
        onChange={(e) => c.aller(Number(e.target.value))}
        aria-label="Pas d'exécution"
        className="mx-1 min-w-24 flex-1 accent-[var(--primary)]"
      />
      <span className="font-mono text-xs text-muted">
        pas {c.k + 1}/{total}
      </span>
      <label className="flex items-center gap-1.5 text-xs text-muted">
        vitesse
        <select
          value={c.vitesse}
          onChange={(e) => c.changerVitesse(Number(e.target.value))}
          className="rounded-lg border border-border bg-surface px-1.5 py-1 font-mono text-xs text-text"
        >
          {VITESSES.map((v) => (
            <option key={v} value={v}>
              {v}×
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** « Ce qui vient de se passer » : la description du pas par le moteur, et la ligne qui suit. */
export function CeQuiSePasse({
  pas,
  suivante,
  fin,
  erreur,
}: {
  pas: PasTrace | undefined;
  suivante: number | null;
  fin: boolean;
  erreur: Execution["erreur"];
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
      <RobotAlgo taille={46} className="shrink-0" />
      <div className="min-w-0" aria-live="polite">
        <div className="font-hand text-lg leading-5 text-primary">ce qui vient de se passer</div>
        <p key={pas?.pas} className="revele text-sm">
          {pas ? (
            <>
              <span className="mr-1.5 rounded-md bg-[#111338] px-1.5 py-0.5 font-mono text-[11px] text-[#b4a3ff]">ligne {pas.ligne}</span>
              {pas.description}
            </>
          ) : (
            "Rien à exécuter."
          )}
        </p>
        {fin && erreur ? (
          <p className="mt-0.5 text-xs font-semibold text-danger">
            Puis l&apos;exécution s&apos;arrête{erreur.ligne ? ` à la ligne ${erreur.ligne}` : ""} : {erreur.message}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted">{fin ? "Fin de l'exécution." : suivante ? `Ensuite : ligne ${suivante}.` : ""}</p>
        )}
      </div>
    </div>
  );
}

/** Le flux de contrôle réel : verdict de chaque condition, branche prise, tours et arrêt de chaque boucle. */
export function FluxControle({ execution, k }: { execution: Execution; k: number }) {
  const vus = execution.trace.slice(0, k + 1);
  const conditions = branches(execution.lignes);
  const repetitions = boucles(execution.lignes);
  if (!conditions.length && !repetitions.length) {
    return <p className="text-sm text-muted">Pas de condition ni de boucle : les instructions s&apos;exécutent dans l&apos;ordre, une seule fois.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {conditions.map((b) => {
        const evaluations = vus.filter((p) => p.ligne === b.ligne && verdict(p) !== null);
        const dernier = evaluations.at(-1);
        const v = dernier ? verdict(dernier) : null;
        return (
          <li key={`si${b.ligne}`} className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#111338] px-1.5 py-0.5 font-mono text-[11px] text-[#b4a3ff]">ligne {b.ligne}</span>
            <code className="font-mono text-sm">si {b.condition}</code>
            {v === null ? (
              <span className="text-xs text-muted">pas encore évaluée</span>
            ) : (
              <>
                <span key={evaluations.length} className={`revele rounded-full px-2.5 py-0.5 text-xs font-bold ${v ? "bg-success-soft text-success" : "bg-rose/12 text-rose"}`}>
                  {v ? "vrai" : "faux"}
                </span>
                <span className="text-xs text-muted">
                  → branche {v ? "alors" : b.sinon ? "sinon" : "ignorée (pas de sinon)"}
                  {evaluations.length > 1 && ` · évaluée ${evaluations.length} fois`}
                </span>
              </>
            )}
          </li>
        );
      })}
      {repetitions.map((b) => {
        const pour = b.entete.startsWith("pour ");
        const passages = vus.filter((p) => p.ligne === b.ligne);
        const tours = pour ? passages.filter((p) => /prend la valeur/.test(p.description)).length : passages.filter((p) => verdict(p) === true).length;
        const sortie = pour ? passages.find((p) => p.description.startsWith("fin de la boucle")) : passages.find((p) => verdict(p) === false);
        return (
          <li key={`b${b.ligne}`} className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#111338] px-1.5 py-0.5 font-mono text-[11px] text-[#b4a3ff]">ligne {b.ligne}</span>
            <code className="font-mono text-sm">{b.entete}</code>
            <span key={tours} className="revele flex items-center gap-1.5 rounded-full bg-lavande/15 px-2.5 py-0.5 text-xs font-bold text-lavande">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className={tours ? "anneau-tourne" : ""}>
                <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {tours} tour{tours > 1 ? "s" : ""}
            </span>
            <span className="text-xs text-muted">
              {sortie ? `arrêt : ${pour ? sortie.description.replace(/^fin de la boucle pour : /, "") : "la condition est devenue fausse"}` : passages.length ? "en cours" : "pas encore atteinte"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Les tableaux, case par case : indice courant, cases modifiées par le dernier pas. */
export function StructuresDonnees({ execution, k, initiales }: { execution: Execution; k: number; initiales: Vars }) {
  const pas = execution.trace[k];
  const avant: Vars = k > 0 ? execution.trace[k - 1].variables : initiales;
  const indices = indicesDeTableaux(execution.lignes);
  const tableaux = Object.entries(pas?.variables ?? {}).filter(([, v]) => Array.isArray(v)) as [string, Valeur[]][];
  if (!tableaux.length) return null;
  return (
    <div className="flex flex-col gap-4">
      {tableaux.map(([nom, cases]) => {
        const precedent = avant[nom];
        const designee = (indices[nom] ?? []).map((v) => pas.variables[v]).find((v): v is number => typeof v === "number" && v >= 0 && v < cases.length);
        return (
          <div key={nom} className="flex flex-wrap items-end gap-2">
            <span className="mb-6 mr-1 font-mono text-sm text-muted">{nom}</span>
            {cases.map((c, n) => {
              const modifiee = Array.isArray(precedent) && JSON.stringify(precedent[n]) !== JSON.stringify(c);
              return (
                <div key={n} className="flex flex-col items-center gap-1">
                  <div
                    key={modifiee ? `m${pas.pas}` : "r"}
                    className={`flex h-12 min-w-12 items-center justify-center rounded-xl border-2 px-2 font-mono text-lg transition-colors duration-300 ${
                      modifiee ? "pulse-doux border-menthe bg-menthe/15 text-menthe" : n === designee ? "border-primary bg-primary/15" : "border-border bg-surface"
                    }`}
                  >
                    {afficherValeur(c)}
                  </div>
                  <span className={`font-mono text-[11px] ${n === designee ? "font-bold text-primary" : "text-muted"}`}>{n}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/** L'explorateur de variables : valeur actuelle, valeur d'avant, création ou modification au dernier pas. */
export function ExplorateurVariables({ execution, k, initiales }: { execution: Execution; k: number; initiales: Vars }) {
  const pas = execution.trace[k];
  const avant: Vars = k > 0 ? execution.trace[k - 1].variables : initiales;
  const vars = Object.entries(pas?.variables ?? {});
  if (!vars.length) return <p className="text-sm text-muted">Aucune variable pour l&apos;instant.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
          <th className="pb-1.5 font-semibold">variable</th>
          <th className="pb-1.5 font-semibold">valeur</th>
          <th className="pb-1.5 text-right font-semibold" />
        </tr>
      </thead>
      <tbody className="font-mono">
        {vars.map(([nom, v]) => {
          const cree = !(nom in avant);
          const modifiee = !cree && JSON.stringify(avant[nom]) !== JSON.stringify(v);
          return (
            <tr key={nom} className={`border-t border-border/60 transition-colors duration-300 ${cree || modifiee ? "bg-menthe/8" : ""}`}>
              <td className="py-1.5 pr-3 font-semibold">{nom}</td>
              <td className="py-1.5">
                <span key={JSON.stringify(v)} className={cree || modifiee ? "revele inline-block font-bold text-menthe" : ""}>
                  {afficherValeur(v)}
                </span>
                {modifiee && <span className="ml-2 text-xs text-muted line-through">{afficherValeur(avant[nom])}</span>}
              </td>
              <td className="py-1.5 text-right font-sans">
                {cree && <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold text-primary">créée</span>}
                {modifiee && <span className="rounded-full bg-menthe/15 px-2 py-0.5 text-[10px] font-bold text-menthe">modifiée</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** La console : sorties jusqu'au pas courant ; l'erreur du moteur quand l'exécution s'y arrête. */
export function Console({ execution, k }: { execution: Execution; k: number }) {
  const sorties = execution.trace.slice(0, k + 1).flatMap((p) => (p.ecrit !== null ? [p.ecrit] : []));
  const fin = k >= execution.trace.length - 1;
  return (
    <div className="overflow-hidden rounded-2xl bg-[#0b0d29] text-[#d9dcf7]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-xs font-medium">
        <Terminal size={14} className="opacity-70" /> Console
      </div>
      <pre className="min-h-16 overflow-x-auto px-4 py-2.5 font-mono text-sm leading-6">
        {sorties.length ? sorties.map((l, n) => <div key={n} className={n === sorties.length - 1 ? "revele" : ""}>{l}</div>) : <span className="opacity-40">(rien d&apos;affiché)</span>}
        {fin && execution.erreur && (
          <div className="mt-1 flex gap-2 whitespace-pre-wrap text-[#ff8a7a]">
            <TriangleAlert size={15} className="mt-1 shrink-0" />
            <span>
              Erreur{execution.erreur.ligne ? ` ligne ${execution.erreur.ligne}` : ""} : {execution.erreur.message}
            </span>
          </div>
        )}
      </pre>
    </div>
  );
}
