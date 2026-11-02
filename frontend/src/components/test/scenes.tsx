"use client";

import { Check, Terminal, Trophy, X } from "lucide-react";
import { Fragment } from "react";
import { colorer } from "@/components/code/colorer";
import { LIBELLES_NOTION, type LignePseudo, type Notion, type PasTrace, type PlanCascade, type Valeur } from "@/lib/api";
import { afficherValeur } from "@/lib/format";
import { boucles, branches, indicesDeTableaux, tableauxEcrits, tours, variablesAffectees } from "./analyse";
import { EmblemeNotion, ICONES_PHASES } from "./icones";

type Vars = Record<string, Valeur>;

/**
 * La fenêtre de code de l'accueil : ligne courante, et chemin déjà parcouru quand on observe l'exécution.
 * En lecture guidée (`revelees`), le code attend sous un brouillard et la ligne à lire se dévoile au clic.
 */
export function FenetreCode({
  titre,
  lignes,
  courante,
  vues,
  revelees,
  onLire,
}: {
  titre: string;
  lignes: LignePseudo[];
  courante?: number | null;
  vues?: Set<number> | null;
  revelees?: Set<number> | null;
  onLire?: () => void;
}) {
  const aLire = revelees ? lignes.find((l) => !revelees.has(l.ligne))?.ligne : undefined;
  return (
    <div className="rounded-3xl border border-[#4b43b8]/60 bg-[#111338] p-3 text-[#e4e6ff] shadow-[0_30px_80px_-30px_rgb(108_92_252/0.65)]">
      <div className="mb-2.5 flex items-center gap-3 px-1">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </span>
        <span className="truncate rounded-lg bg-[#0b0d29] px-3 py-1 text-xs font-semibold">{titre}</span>
      </div>
      <pre className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0b0d29] py-2 font-mono text-[13px] leading-7">
        {lignes.map((l, n) => {
          const active = l.ligne === courante;
          const pasEncore = !!vues && !active && !vues.has(l.ligne);
          const cachee = !!revelees && !revelees.has(l.ligne);
          const appel = l.ligne === aLire;
          return (
            <div
              key={l.ligne}
              aria-current={active ? "step" : undefined}
              onClick={appel ? onLire : undefined}
              className={`ligne-apparait flex pr-4 transition-colors duration-300 ${active ? "bg-[#6c5cfc]/35" : ""} ${
                appel ? "ligne-a-lire cursor-pointer bg-[#f062b8]/10" : ""
              }`}
              style={{ animationDelay: `${n * 55}ms` }}
            >
              {/* L'atténuation est sur le contenu : l'animation d'apparition fixe l'opacité de la ligne. */}
              <span className={`w-10 shrink-0 select-none pr-3 text-right ${active ? "text-[#b4a3ff]" : "text-white/30"}`}>
                {active ? "▶" : l.ligne}
              </span>
              <span
                aria-hidden={cachee || undefined}
                className={`whitespace-pre transition-[opacity,filter] duration-500 ${pasEncore ? "opacity-35" : ""} ${cachee && !appel ? "brouillard select-none" : ""} ${
                  appel ? "brouillard-leger select-none" : ""
                }`}
              >
                {colorer(l.texte)}
              </span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

/**
 * La scène de la notion : embranchements, anneau de boucle, cases de tableau, puis les tiroirs de la mémoire.
 * Sans `vars`, l'algorithme n'a pas encore tourné : les valeurs restent des « ? ».
 */
export function Scene({
  notion,
  lignes,
  vars = null,
  precedent = null,
  vues = null,
  trace,
  k = 0,
}: {
  notion: Notion;
  lignes: LignePseudo[];
  vars?: Vars | null;
  precedent?: Vars | null;
  vues?: Set<number> | null;
  trace?: PasTrace[];
  k?: number;
}) {
  const ecrits = tableauxEcrits(lignes);
  const noms = variablesAffectees(lignes);
  const tableaux = noms.filter((n) => n in ecrits || Array.isArray(vars?.[n]));
  const scalaires = noms.filter((n) => !tableaux.includes(n));

  return (
    <div className="flex flex-col gap-6">
      {notion === "conditions" && <Fourches lignes={lignes} vues={vues} />}
      {notion === "boucles" && <Anneaux lignes={lignes} trace={trace} k={k} />}
      {tableaux.length > 0 && <Cases lignes={lignes} noms={tableaux} tailles={ecrits} vars={vars} precedent={precedent} />}
      {scalaires.length > 0 && <Memoire noms={scalaires} vars={vars} precedent={precedent} />}
    </div>
  );
}

function Etiquette({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 -rotate-2 font-hand text-xl leading-5 text-lavande">{children}</div>;
}

/** Les tiroirs de la mémoire : une variable ne garde que sa dernière valeur. */
function Memoire({ noms, vars, precedent }: { noms: string[]; vars: Vars | null; precedent: Vars | null }) {
  return (
    <div>
      <Etiquette>la mémoire</Etiquette>
      <div className="flex flex-wrap gap-3">
        {noms.map((nom) => {
          const connu = !!vars && nom in vars;
          const change = connu && !!precedent && JSON.stringify(precedent[nom]) !== JSON.stringify(vars![nom]);
          return (
            <div
              key={nom}
              className={`min-w-24 rounded-2xl border-2 px-4 py-2.5 text-center transition-colors duration-300 ${
                change ? "border-menthe bg-menthe/10 shadow-[0_0_24px_-8px_var(--menthe)]" : "border-border bg-surface/70"
              }`}
            >
              <div className="font-mono text-xs text-muted">{nom}</div>
              <div key={connu ? afficherValeur(vars![nom]) : "?"} className={`font-display text-3xl ${connu ? "revele" : "mystere text-muted"}`}>
                {connu ? afficherValeur(vars![nom]) : "?"}
              </div>
              {change && precedent && nom in precedent && (
                <div className="font-mono text-[11px] text-muted line-through">{afficherValeur(precedent[nom])}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Les embranchements : quel chemin l'exécution a-t-elle pris ? */
function Fourches({ lignes, vues }: { lignes: LignePseudo[]; vues: Set<number> | null }) {
  return (
    <div>
      <Etiquette>les embranchements</Etiquette>
      <ul className="flex flex-col gap-3">
        {branches(lignes).map((b) => {
          const vrai = !!vues && b.alors !== null && vues.has(b.alors);
          const faux = !!vues && b.sinon !== null && vues.has(b.sinon);
          const atteint = !!vues && vues.has(b.ligne);
          return (
            <li key={b.ligne} className="flex items-center gap-2">
              <span
                className={`rounded-xl border-2 px-3 py-1.5 font-mono text-sm transition-colors ${
                  atteint ? "border-lavande bg-lavande/10" : "border-border bg-surface/70"
                }`}
              >
                {b.condition} ?
              </span>
              <svg width="46" height="44" viewBox="0 0 46 44" aria-hidden className="shrink-0">
                <path d="M2 22 C 20 22, 22 8, 42 8" fill="none" strokeWidth="2.5" strokeLinecap="round" className={vrai ? "stroke-menthe" : "stroke-border"} />
                <path d="M2 22 C 20 22, 22 36, 42 36" fill="none" strokeWidth="2.5" strokeLinecap="round" className={faux ? "stroke-rose" : "stroke-border"} />
              </svg>
              <span className="flex flex-col gap-2 text-xs font-semibold">
                <span className={vrai ? "text-menthe" : "text-muted"}>vrai{vrai && " ✓"}</span>
                <span className={faux ? "text-rose" : "text-muted"}>faux{faux && " ✓"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** L'anneau de la boucle : combien de tours ont commencé. */
function Anneaux({ lignes, trace, k }: { lignes: LignePseudo[]; trace?: PasTrace[]; k: number }) {
  return (
    <div>
      <Etiquette>la boucle</Etiquette>
      <ul className="flex flex-wrap gap-5">
        {boucles(lignes).map((b) => {
          const n = trace ? tours(trace, k, b) : null;
          return (
            <li key={b.ligne} className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                <svg viewBox="0 0 80 80" className={`h-20 w-20 ${n ? "anneau-tourne" : ""}`} aria-hidden key={n ?? "?"}>
                  <circle cx="40" cy="40" r="32" fill="none" strokeWidth="3" className="stroke-border" />
                  <path d="M40 8 A 32 32 0 1 1 13 23" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-lavande" />
                  <path d="M8 18 L13 24 L20 19" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-lavande" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span key={n ?? "?"} className={`font-display text-2xl leading-none ${n ? "revele" : "mystere text-muted"}`}>{n ?? "?"}</span>
                  <span className="text-[10px] text-muted">{n && n > 1 ? "tours" : "tour"}</span>
                </div>
              </div>
              <code className="font-mono text-sm">{b.entete}</code>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Les cases du tableau, numérotées à partir de 0, avec la case désignée par l'indice. */
function Cases({
  lignes,
  noms,
  tailles,
  vars,
  precedent,
}: {
  lignes: LignePseudo[];
  noms: string[];
  tailles: Record<string, number>;
  vars: Vars | null;
  precedent: Vars | null;
}) {
  const indices = indicesDeTableaux(lignes);
  return (
    <div>
      <Etiquette>les cases du tableau</Etiquette>
      {noms.map((nom) => {
        const valeur = vars?.[nom];
        const cases = Array.isArray(valeur) ? valeur : Array.from({ length: tailles[nom] ?? 0 }, () => null);
        const avant = precedent?.[nom];
        const designee = (indices[nom] ?? []).map((v) => vars?.[v]).find((v): v is number => typeof v === "number");
        return (
          <div key={nom} className="flex flex-wrap items-end gap-2">
            <span className="mb-6 mr-1 font-mono text-sm text-muted">{nom}</span>
            {cases.map((c, n) => {
              const modifiee = Array.isArray(avant) && Array.isArray(valeur) && JSON.stringify(avant[n]) !== JSON.stringify(c);
              return (
                <div key={n} className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-14 min-w-14 items-center justify-center rounded-2xl border-2 px-2 font-display text-2xl transition-colors duration-300 ${
                      modifiee
                        ? "pulse-doux border-menthe bg-menthe/15 text-menthe"
                        : n === designee
                          ? "border-primary bg-primary/20"
                          : "border-border bg-surface/70"
                    }`}
                  >
                    {Array.isArray(valeur) ? afficherValeur(c) : <span className="mystere text-muted">?</span>}
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

/** La console : ce qu'affichent les « écrire », ligne par ligne. */
export function Console({ lignes }: { lignes: string[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#0b0d29] text-[#d9dcf7]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-xs font-medium">
        <Terminal size={14} className="opacity-70" /> Console
      </div>
      <pre className="min-h-12 px-4 py-2.5 font-mono text-sm leading-6">
        {lignes.length ? lignes.map((l, n) => <div key={n} className="revele">{l}</div>) : <span className="opacity-40">(rien d&apos;affiché)</span>}
      </pre>
    </div>
  );
}

/** La cascade du test : 4 notions, 2 questions chacune, reliées comme une constellation. */
export function Constellation({ plan, courant, grande = false }: { plan: PlanCascade; courant?: string; grande?: boolean }) {
  const arretIndex = plan.arret ? plan.notions.findIndex((n) => n.notion === plan.arret) : -1;
  const taille = grande ? "h-5 w-5" : "h-3 w-3";
  return (
    <ol className={`flex items-start ${grande ? "flex-wrap justify-center gap-x-3 gap-y-5 sm:gap-x-5" : "gap-2"}`} aria-label="Progression du test de niveau">
      {plan.notions.map((n, i) => {
        const horsJeu = arretIndex >= 0 && i > arretIndex;
        return (
          <li key={n.notion} className={`flex items-start ${grande ? "gap-3 sm:gap-5" : "gap-2"} ${horsJeu ? "opacity-35" : ""}`}>
            {i > 0 && <span aria-hidden className={`h-px border-t border-dashed border-lavande/50 ${grande ? "mt-2.5 w-4 sm:w-10" : "mt-1.5 w-3"}`} />}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1">
                {n.express.map((e, j) => (
                  <Fragment key={e.id}>
                    {j > 0 && <span aria-hidden className={`h-0.5 ${grande ? "w-4" : "w-2"} ${e.resultat ? "bg-lavande/60" : "bg-border"}`} />}
                    <span
                      title={`${LIBELLES_NOTION[n.notion]}, question ${j + 1}`}
                      className={`flex ${taille} items-center justify-center rounded-full transition-colors ${
                        e.resultat === "juste"
                          ? "bg-menthe text-bg"
                          : e.resultat === "faux"
                            ? "bg-rose text-bg"
                            : e.id === courant
                              ? "bg-primary shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_30%,transparent)] mystere"
                              : "border-2 border-muted/50"
                      }`}
                    >
                      {grande && e.resultat === "juste" && <Check size={12} strokeWidth={3} />}
                      {grande && e.resultat === "faux" && <X size={12} strokeWidth={3} />}
                      <span className="sr-only">
                        {LIBELLES_NOTION[n.notion]} question {j + 1} : {e.resultat ?? (e.id === courant ? "en cours" : "à venir")}
                      </span>
                    </span>
                  </Fragment>
                ))}
              </div>
              <span className={`flex items-center gap-1 whitespace-nowrap ${grande ? "flex-col text-xs font-medium" : "text-[10px] text-muted"}`}>
                {grande && <EmblemeNotion notion={n.notion} taille={34} />}
                <span className="flex items-center gap-1">
                  {n.statut === "demontree" && <Trophy size={grande ? 12 : 10} className="text-trophy" />}
                  {LIBELLES_NOTION[n.notion]}
                </span>
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const PHASES = ["Lire", "Prédire", "Observer", "Comparer"] as const;

/** Le fil des quatre temps d'une question, tracé à la main. */
export function FilDesPhases({ courante }: { courante: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" aria-label="Étapes de la question">
      {PHASES.map((p, n) => {
        const Icone = ICONES_PHASES[n];
        return (
        <li key={p} className="flex items-center gap-2" aria-current={n === courante ? "step" : undefined}>
          {n > 0 && (
            <svg width="26" height="10" viewBox="0 0 26 10" aria-hidden className={n <= courante ? "text-lavande" : "text-border"}>
              <path d="M1 6 C 8 2, 16 8, 24 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          <span
            className={`flex items-center gap-1.5 ${
              n === courante ? "font-semibold text-text" : n < courante ? "text-lavande" : "text-muted"
            }`}
          >
            <span
              className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                n === courante
                  ? "bg-primary/15 shadow-[0_0_0_2px_var(--primary),0_0_22px_-4px_var(--primary)]"
                  : n < courante
                    ? "bg-lavande/10"
                    : "opacity-45 grayscale"
              }`}
            >
              <Icone taille={24} key={n === courante ? "courante" : "repos"} />
              {n < courante && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-menthe text-bg">
                  <Check size={10} strokeWidth={3.5} />
                </span>
              )}
            </span>
            {p}
          </span>
        </li>
        );
      })}
    </ol>
  );
}
