"use client";

import { ArrowRight, Pause, Play, StepForward } from "lucide-react";
import { Fragment, useEffect, useImperativeHandle, useState, useSyncExternalStore, type Ref } from "react";
import { colorer } from "@/components/code/colorer";
import { useCible } from "./fleches";

type Valeur = number | string | number[];
type Variables = Record<string, Valeur>;
type Pas = { ligne: number; texte: string; vars: Variables; sortie: string | null };

type Algo = {
  niveau: string;
  couleur: string;
  titre: string;
  // Le pseudo-code tel que l'élève le compose en blocs dans les exercices.
  lignes: string[];
  pas: Pas[];
  // Variable dont on suit les valeurs successives dans la chaîne du bas…
  suivi?: string;
  // …ou tableau affiché case par case, avec les cases désignées à chaque pas.
  tableau?: { nom: string; cases: (vars: Variables) => number[] };
};

/** Un pas d'exécution : on fige une copie des variables à cet instant. */
function pas(ligne: number, texte: string, vars: Variables, sortie: string | null = null): Pas {
  const copie = Object.fromEntries(Object.entries(vars).map(([nom, v]) => [nom, Array.isArray(v) ? [...v] : v]));
  return { ligne, texte, vars: copie, sortie };
}

// Chaque algorithme est réellement déroulé : les valeurs affichées viennent de ces calculs.

function echange(): Pas[] {
  const l: Pas[] = [];
  let a = 3;
  l.push(pas(1, "a reçoit 3.", { a }));
  let b = 8;
  l.push(pas(2, "b reçoit 8.", { a, b }));
  const tmp = a;
  l.push(pas(3, `tmp garde l'ancienne valeur de a : ${tmp}.`, { a, b, tmp }));
  a = b;
  l.push(pas(4, `a reçoit la valeur de b : ${a}.`, { a, b, tmp }));
  b = tmp;
  l.push(pas(5, `b reçoit tmp : ${b}. Les deux valeurs sont échangées.`, { a, b, tmp }));
  l.push(pas(6, `écrire affiche ${a} ${b}.`, { a, b, tmp }, `${a} ${b}`));
  return l;
}

function somme(): Pas[] {
  const l: Pas[] = [];
  const n = 4;
  l.push(pas(1, "n reçoit 4.", { n }));
  let total = 0;
  l.push(pas(2, "total reçoit 0.", { n, total }));
  for (let i = 1; i <= n; i++) {
    l.push(pas(3, `Tour de boucle : i vaut ${i}.`, { n, total, i }));
    total += i;
    l.push(pas(4, `total devient ${total - i} + ${i} = ${total}.`, { n, total, i }));
  }
  l.push(pas(6, `La boucle est finie : écrire affiche ${total}.`, { n, total, i: n }, String(total)));
  return l;
}

function maximum(): Pas[] {
  const l: Pas[] = [];
  const t = [7, 2, 9, 4];
  l.push(pas(1, "t reçoit le tableau [7, 2, 9, 4].", { t }));
  let max = t[0];
  l.push(pas(2, `max part de la première case : ${max}.`, { t, max }));
  for (let i = 1; i <= 3; i++) {
    l.push(pas(3, `Tour de boucle : i vaut ${i}.`, { t, max, i }));
    const plusGrand = t[i] > max;
    l.push(pas(4, `t[${i}] vaut ${t[i]} : plus grand que ${max} ? ${plusGrand ? "oui" : "non"}.`, { t, max, i }));
    if (plusGrand) {
      max = t[i];
      l.push(pas(5, `max devient ${max}.`, { t, max, i }));
    }
  }
  l.push(pas(8, `écrire affiche ${max}, le plus grand du tableau.`, { t, max, i: 3 }, String(max)));
  return l;
}

function pgcd(): Pas[] {
  const l: Pas[] = [];
  let a = 48;
  l.push(pas(1, "a reçoit 48.", { a }));
  let b = 18;
  l.push(pas(2, "b reçoit 18.", { a, b }));
  let r: number | null = null;
  const vars = (): Variables => (r === null ? { a, b } : { a, b, r });
  while (b !== 0) {
    l.push(pas(3, `b vaut ${b}, différent de 0 : on entre dans la boucle.`, vars()));
    r = a % b;
    l.push(pas(4, `r reçoit ${a} mod ${b} = ${r}.`, vars()));
    a = b;
    l.push(pas(5, `a reçoit ${a}.`, vars()));
    b = r;
    l.push(pas(6, `b reçoit ${b}.`, vars()));
  }
  l.push(pas(3, "b vaut 0 : la boucle s'arrête.", vars()));
  l.push(pas(8, `écrire affiche ${a}, le PGCD de 48 et 18.`, vars(), String(a)));
  return l;
}

function bulles(): Pas[] {
  const l: Pas[] = [];
  const t = [4, 1, 5, 2];
  l.push(pas(1, "t reçoit le tableau [4, 1, 5, 2].", { t }));
  let tmp: number | null = null;
  const vars = (j: number): Variables => (tmp === null ? { t, j } : { t, j, tmp });
  for (let j = 0; j <= 2; j++) {
    l.push(pas(2, `Tour de boucle : j vaut ${j}.`, vars(j)));
    const echanger = t[j] > t[j + 1];
    l.push(pas(3, `t[${j}] = ${t[j]} est-il plus grand que t[${j + 1}] = ${t[j + 1]} ? ${echanger ? "oui" : "non"}.`, vars(j)));
    if (echanger) {
      tmp = t[j];
      l.push(pas(4, `tmp garde ${tmp}.`, vars(j)));
      t[j] = t[j + 1];
      l.push(pas(5, `t[${j}] reçoit ${t[j]}.`, vars(j)));
      t[j + 1] = tmp;
      l.push(pas(6, `t[${j + 1}] reçoit ${tmp} : les deux cases sont échangées.`, vars(j)));
    }
  }
  const resultat = `[${t.join(", ")}]`;
  l.push(pas(9, `écrire affiche ${resultat} : le plus grand est arrivé au bout.`, vars(2), resultat));
  return l;
}

/** Du plus facile au plus difficile. */
const ALGOS: Algo[] = [
  {
    niveau: "Facile",
    couleur: "#3ddbb0",
    titre: "Échanger deux valeurs",
    lignes: ["a ← 3", "b ← 8", "tmp ← a", "a ← b", "b ← tmp", "écrire(a, b)"],
    pas: echange(),
    suivi: "a",
  },
  {
    niveau: "Moyen",
    couleur: "#b4a3ff",
    titre: "La somme de 1 à n",
    lignes: ["n ← 4", "total ← 0", "pour i de 1 à n faire", "  total ← total + i", "fin pour", "écrire(total)"],
    pas: somme(),
    suivi: "total",
  },
  {
    niveau: "Avancé",
    couleur: "#f7c948",
    titre: "Le plus grand d'un tableau",
    lignes: [
      "t ← [7, 2, 9, 4]",
      "max ← t[0]",
      "pour i de 1 à 3 faire",
      "  si t[i] > max alors",
      "    max ← t[i]",
      "  fin si",
      "fin pour",
      "écrire(max)",
    ],
    pas: maximum(),
    tableau: { nom: "t", cases: (v) => (typeof v.i === "number" ? [v.i] : "max" in v ? [0] : []) },
  },
  {
    niveau: "Très avancé",
    couleur: "#f062b8",
    titre: "Le PGCD d'Euclide",
    lignes: ["a ← 48", "b ← 18", "tant que b ≠ 0 faire", "  r ← a mod b", "  a ← b", "  b ← r", "fin tant que", "écrire(a)"],
    pas: pgcd(),
    suivi: "b",
  },
  {
    niveau: "Expert",
    couleur: "#ff7a66",
    titre: "Un passage du tri à bulles",
    lignes: [
      "t ← [4, 1, 5, 2]",
      "pour j de 0 à 2 faire",
      "  si t[j] > t[j + 1] alors",
      "    tmp ← t[j]",
      "    t[j] ← t[j + 1]",
      "    t[j + 1] ← tmp",
      "  fin si",
      "fin pour",
      "écrire(t)",
    ],
    pas: bulles(),
    tableau: { nom: "t", cases: (v) => (typeof v.j === "number" ? [v.j, v.j + 1] : []) },
  },
];

const MAX_LIGNES = Math.max(...ALGOS.map((a) => a.lignes.length));

/** Les valeurs successives de la variable suivie, avec le pas où chacune apparaît. */
function historique(algo: Algo) {
  const h: { valeur: Valeur; pas: number }[] = [];
  if (!algo.suivi) return h;
  algo.pas.forEach((p, n) => {
    const v = p.vars[algo.suivi!];
    if (v !== undefined && (h.length === 0 || h[h.length - 1].valeur !== v)) h.push({ valeur: v, pas: n });
  });
  return h;
}

// À chaque visite, la démonstration ouvre sur le niveau suivant : Facile, puis Moyen, etc.
let indexVisite: number | null = null;
function indexDeVisite() {
  if (indexVisite === null) {
    let precedent = -1;
    try {
      precedent = Number(localStorage.getItem("algodex.demo") ?? -1);
    } catch {}
    indexVisite = Number.isInteger(precedent) && precedent >= -1 ? (precedent + 1) % ALGOS.length : 0;
    try {
      localStorage.setItem("algodex.demo", String(indexVisite));
    } catch {}
  }
  return indexVisite;
}
const sansAbonnement = () => () => {};

const mouvementReduit = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Rythme « moyen » : assez vif pour garder le suspense, assez lent pour suivre chaque ligne.
const DUREE_PAS = 550;
const PAUSE_FIN = 1800;

/** Ce que les flèches de l'accueil peuvent demander à la démonstration. */
export type CommandesDemo = { rejouer: () => void; niveauSuivant: () => void };

/**
 * La fenêtre centrale : cinq algorithmes, du plus facile au plus difficile, exécutés pas à pas.
 * Lecture automatique et en boucle : après l'Expert, on repart du Facile. Le survol met en pause ;
 * choisir un niveau le lance et la boucle continue ensuite ; seuls Pause et Pas suivant l'arrêtent.
 */
export function DemoExecution({ ref }: { ref?: Ref<CommandesDemo> }) {
  const depart = useSyncExternalStore(sansAbonnement, indexDeVisite, () => 0);
  const [choix, setChoix] = useState<number | null>(null);
  const index = choix ?? depart;
  const algo = ALGOS[index];
  const dernier = algo.pas.length - 1;

  const [kBrut, setK] = useState(0);
  const k = Math.min(kBrut, dernier);
  const [lecture, setLecture] = useState(true);
  // Tant que personne n'a agi, la lecture est « automatique » : elle ne démarre pas si les animations sont réduites.
  const [auto, setAuto] = useState(true);
  const [survol, setSurvol] = useState(false);
  const enLecture = lecture && k < dernier;

  const courant = algo.pas[k];
  const precedent = k > 0 ? algo.pas[k - 1] : null;
  const cibleFenetre = useCible("exercices");
  const cibleCode = useCible("code");
  const cibleVisualisation = useCible("visualisation");

  function lancer(n: number) {
    setChoix(n);
    setK(0);
    setLecture(true);
    setAuto(false);
  }

  useImperativeHandle(ref, () => ({
    rejouer: () => {
      setK(0);
      setLecture(true);
      setAuto(false);
    },
    niveauSuivant: () => lancer((index + 1) % ALGOS.length),
  }));

  // Pas suivant à intervalle régulier. En mode automatique, rien ne bouge si l'animation est réduite.
  useEffect(() => {
    if (!enLecture || survol || (auto && mouvementReduit())) return;
    const minuteur = setTimeout(() => setK((x) => Math.min(x + 1, dernier)), DUREE_PAS);
    return () => clearTimeout(minuteur);
  }, [enLecture, survol, auto, k, dernier]);

  // Fin d'une lecture : une pause pour savourer le résultat, puis le niveau suivant (après l'Expert, le Facile).
  useEffect(() => {
    if (!lecture || survol || k < dernier || (auto && mouvementReduit())) return;
    const minuteur = setTimeout(() => {
      setChoix((index + 1) % ALGOS.length);
      setK(0);
    }, PAUSE_FIN);
    return () => clearTimeout(minuteur);
  }, [lecture, survol, auto, k, dernier, index]);

  const scalaires = Object.entries(courant.vars).filter(([, v]) => !Array.isArray(v));
  const change = (nom: string) => JSON.stringify(precedent?.vars[nom]) !== JSON.stringify(courant.vars[nom]);
  const sortie = algo.pas.slice(0, k + 1).findLast((p) => p.sortie !== null)?.sortie ?? null;

  return (
    <div
      {...cibleFenetre}
      onPointerEnter={(e) => e.pointerType === "mouse" && setSurvol(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setSurvol(false)}
      className="cible relative rounded-3xl border border-[#4b43b8]/60 bg-[#111338] p-3 text-[#e4e6ff] shadow-[0_30px_80px_-30px_rgb(108_92_252/0.65)]"
    >
      <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 px-1">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </span>
        <span key={`titre-${index}`} className="revele rounded-lg bg-[#0b0d29] px-3 py-1 text-xs font-semibold">
          {algo.titre}
        </span>
        <span
          key={`niveau-${index}`}
          className="revele rounded-full border px-2 py-0.5 text-[11px] font-semibold [animation-delay:120ms]"
          style={{ color: algo.couleur, borderColor: `${algo.couleur}66`, backgroundColor: `${algo.couleur}1a` }}
        >
          {algo.niveau}
        </span>
        <div role="group" aria-label="Choisir le niveau de l'algorithme" className="ml-auto flex">
          {ALGOS.map((a, n) => (
            <button
              key={a.titre}
              type="button"
              onClick={() => lancer(n)}
              aria-pressed={n === index}
              aria-label={`${a.niveau} : ${a.titre}`}
              title={`${a.niveau} : ${a.titre}`}
              className="flex h-6 w-6 items-center justify-center rounded-full"
            >
              <span
                className={`rounded-full transition-all ${n === index ? "h-3 w-3 ring-2 ring-white/30" : "h-2 w-2 opacity-50 hover:opacity-90"}`}
                style={{ backgroundColor: a.couleur }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="@container">
        {/* Côte à côte seulement s'il y a la place pour les deux sans couper une ligne */}
        <div className="grid gap-3 @min-[22.5rem]:grid-cols-[minmax(0,1fr)_auto]">
          <div
            {...cibleCode}
            className="cible min-w-0 rounded-2xl border border-white/5 bg-[#0b0d29] py-2"
            style={{ minHeight: `${MAX_LIGNES * 22 + 16}px` }}
          >
            <pre className="overflow-x-auto font-mono text-[11.5px] leading-[22px]">
              {algo.lignes.map((texte, n) => {
                const active = n + 1 === courant.ligne;
                return (
                  <div
                    key={`${index}-${n}`}
                    aria-current={active ? "step" : undefined}
                    className={`ligne-apparait flex pr-2 transition-colors ${active ? "bg-[#6c5cfc]/30" : ""}`}
                    style={{ animationDelay: `${n * 60}ms` }}
                  >
                    <span className={`w-6 shrink-0 select-none pr-2 text-right ${active ? "text-[#b4a3ff]" : "text-white/30"}`}>{n + 1}</span>
                    <span className="whitespace-pre">{colorer(texte)}</span>
                  </div>
                );
              })}
            </pre>
          </div>

          <div {...cibleVisualisation} className="cible flex min-w-40 flex-col rounded-2xl border border-white/5 bg-[#0b0d29] p-2.5">
            <div className="mb-1.5 text-xs font-semibold text-[#c9cdf2]">Visualisation de l&apos;exécution</div>
            <ul className="flex flex-col gap-1 whitespace-nowrap font-mono text-[11.5px]">
              {scalaires.map(([nom, v]) => (
                <li
                  key={nom}
                  className={`flex items-center justify-between gap-4 rounded-lg px-2 py-0.5 transition-colors ${
                    change(nom) ? "bg-[#3ddbb0]/15 text-[#3ddbb0]" : "text-[#d9dcf7]"
                  }`}
                >
                  <span>{nom}</span>
                  <span className="font-semibold">{String(v)}</span>
                </li>
              ))}
            </ul>
            <div
              className={`mt-auto rounded-xl border px-3 py-1.5 transition-opacity ${
                sortie !== null ? "border-[#3ddbb0]/50 bg-[#3ddbb0]/10" : "border-white/10 opacity-40"
              }`}
            >
              <div className="text-[11px] text-[#9aa1cc]">Résultat</div>
              {sortie !== null ? (
                <div key={`sortie-${index}`} className="revele font-mono text-sm font-semibold text-[#3ddbb0]">
                  {sortie}
                </div>
              ) : (
                <div className="mystere font-mono text-sm font-semibold text-[#9aa1cc]">?</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex min-h-12 flex-wrap items-center gap-1.5 rounded-2xl border border-white/5 bg-[#0b0d29] p-2 sm:gap-2">
          {algo.tableau ? (
            <Cases algo={algo} k={k} />
          ) : (
            <Chaine algo={algo} k={k} fin={k === dernier} sortie={sortie} />
          )}
        </div>

        <div className="mt-2.5 flex items-center gap-2 px-1">
          <button
            type="button"
            onClick={() => {
              if (enLecture) {
                setLecture(false);
                setAuto(false);
                return;
              }
              if (k === dernier) setK(0);
              setLecture(true);
              setAuto(false);
            }}
            className="bouton-lumineux flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold text-white"
          >
            {enLecture ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}
            {enLecture ? "Pause" : "Exécuter"}
          </button>
          <button
            type="button"
            onClick={() => {
              setLecture(false);
              setAuto(false);
              setK((x) => (x >= dernier ? 0 : x + 1));
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1 text-xs font-medium text-[#d9dcf7] hover:border-[#8b7bff]"
          >
            <StepForward size={13} /> Pas suivant
          </button>
          <div
            role="progressbar"
            aria-label="Progression de l'exécution"
            aria-valuemin={1}
            aria-valuemax={algo.pas.length}
            aria-valuenow={k + 1}
            className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6c5cfc] to-[#3ddbb0] transition-[width] duration-500"
              style={{ width: `${((k + 1) / algo.pas.length) * 100}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-[11px] text-[#9aa1cc]">
            {k + 1}/{algo.pas.length}
          </span>
        </div>
        <p aria-live="polite" className="mt-1.5 min-h-4 px-1 text-[11px] text-[#c9cdf2]">
          {courant.texte}
        </p>
      </div>
    </div>
  );
}

/** Les valeurs successives de la variable suivie : chaque flèche s'allume quand l'exécution la franchit. */
function Chaine({ algo, k, fin, sortie }: { algo: Algo; k: number; fin: boolean; sortie: string | null }) {
  const h = historique(algo);
  const derniereAtteinte = h.findLastIndex((x) => x.pas <= k);
  return (
    <>
      <span className="mr-1 font-mono text-xs text-[#9aa1cc]">{algo.suivi} :</span>
      {h.map((x, n) => {
        const atteint = n <= derniereAtteinte;
        return (
          <Fragment key={n}>
            {n > 0 && <FlecheChaine allumee={atteint} vientDePasser={n === derniereAtteinte} />}
            <span
              className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-1.5 font-mono text-sm transition-colors ${
                n === derniereAtteinte && !fin
                  ? "border-[#3ddbb0] bg-[#3ddbb0]/15 text-[#3ddbb0]"
                  : atteint
                    ? "border-[#6c5cfc] bg-[#6c5cfc]/25 text-white"
                    : "border-white/15 text-white/40"
              }`}
            >
              {String(x.valeur)}
            </span>
          </Fragment>
        );
      })}
      <FlecheChaine allumee={fin} vientDePasser={fin} />
      <span
        key={fin ? "revele" : "mystere"}
        className={`flex h-8 min-w-11 items-center justify-center rounded-lg border-2 px-2 font-mono text-sm font-semibold transition-colors ${
          fin ? "revele border-[#3ddbb0] bg-[#3ddbb0]/15 text-[#3ddbb0]" : "mystere border-white/15 text-white/40"
        }`}
      >
        {fin ? sortie : "?"}
      </span>
    </>
  );
}

function FlecheChaine({ allumee, vientDePasser }: { allumee: boolean; vientDePasser: boolean }) {
  return (
    <ArrowRight
      // Nouvelle clé au passage : l'animation repart à chaque flèche franchie.
      key={vientDePasser ? "passe" : "attend"}
      size={15}
      aria-hidden
      className={`${allumee ? "text-[#8b7bff]" : "text-white/20"} ${vientDePasser ? "fleche-flux text-[#3ddbb0]" : ""}`}
    />
  );
}

/** Le tableau case par case : cases désignées par l'indice en violet, case modifiée en menthe. */
function Cases({ algo, k }: { algo: Algo; k: number }) {
  const { nom, cases } = algo.tableau!;
  const courant = algo.pas[k].vars[nom] as number[] | undefined;
  const avant = (k > 0 ? algo.pas[k - 1].vars[nom] : undefined) as number[] | undefined;
  const designees = cases(algo.pas[k].vars);
  if (!courant) return <span className="font-mono text-xs text-[#9aa1cc]">{nom} n&apos;existe pas encore.</span>;
  return (
    <>
      <span className="mr-1 font-mono text-xs text-[#9aa1cc]">{nom} :</span>
      {courant.map((v, n) => {
        const modifiee = avant !== undefined && avant[n] !== v;
        const designee = designees.includes(n);
        return (
          <span key={n} className="flex flex-col items-center gap-0.5">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg border font-mono text-sm transition-colors ${
                modifiee
                  ? "pulse-doux border-[#3ddbb0] bg-[#3ddbb0]/20 text-[#3ddbb0]"
                  : designee
                    ? "border-[#6c5cfc] bg-[#6c5cfc]/35 text-white"
                    : "border-white/15 text-[#d9dcf7]"
              }`}
            >
              {v}
            </span>
            <span className="font-mono text-[10px] text-white/35">{n}</span>
          </span>
        );
      })}
    </>
  );
}
