"use client";

import { ArrowRight, Check, ChevronLeft, ChevronRight, Copy, KeyRound, Lock, MapPin, Pause, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { colorer } from "@/components/code/colorer";
import { Coupe } from "@/components/test/icones";
import { Constellation } from "@/components/test/scenes";
import { LIBELLES_NOTION, NOTIONS, type Cockpit, type Etat, type LigneCarte, type Notion, type PlanCascade } from "@/lib/api";
import { GUIDES, type Guide } from "@/lib/guides";
import { RobotAlgo, SceneNotion } from "./illustrations";

// Ce que chaque notion fait faire : une phrase de présentation, pas une donnée de progression.
export const NOTIONS_PRESENTEES: Record<Notion, { titre: string; texte: string }> = {
  variables: { titre: "Comprendre les variables", texte: "Observe comment une valeur évolue pendant l'exécution d'un algorithme." },
  conditions: { titre: "Prendre une décision", texte: "Apprends à utiliser les conditions pour guider ton algorithme." },
  boucles: { titre: "Répéter intelligemment", texte: "Exécute plusieurs fois une même action sans la réécrire." },
  tableaux: { titre: "Gérer une collection", texte: "Travaille avec plusieurs valeurs rangées dans des cases." },
};

type Exercice = Cockpit["exercices"][number];

/** La dernière activité réelle : le test de niveau, un exercice commencé, ou le prochain recommandé. */
export type Experience =
  | { sorte: "test"; plan: PlanCascade }
  | { sorte: "exercice"; exercice: Exercice; faites: number }
  | { sorte: "fini" };

export const ETAPES_EXERCICE = 5; // écrire, prédire, visualiser, comparer, valider
const NOMS_ETAPES = ["Écrire", "Prédire", "Observer", "Comparer", "Valider"];

/** Annotation manuscrite avec sa flèche dessinée. */
export function Annotation({ children, className = "", fleche = "bas" }: { children: ReactNode; className?: string; fleche?: "bas" | "gauche" | "droite" }) {
  const traces = {
    bas: { d: "M10 4 C 4 16, 8 26, 18 32", pointe: "M10 30 L18 33 L18 25" },
    gauche: { d: "M36 6 C 26 4, 10 10, 6 24", pointe: "M2 16 L6 25 L13 20" },
    droite: { d: "M4 6 C 16 2, 30 10, 34 24", pointe: "M27 21 L34 25 L36 16" },
  }[fleche];
  return (
    <span className={`pointer-events-none inline-flex items-start gap-1 font-hand text-xl leading-6 text-primary ${className}`}>
      <span className="-rotate-6">{children}</span>
      <svg width="40" height="36" viewBox="0 0 40 36" className="shrink-0" aria-hidden>
        <path d={traces.d} className="fleche-trait" style={{ stroke: "currentColor" }} />
        <path d={traces.pointe} className="fleche-pointe" style={{ stroke: "currentColor" }} />
      </svg>
    </span>
  );
}

function Points({ faites, total }: { faites: number; total: number }) {
  return (
    <span className="flex items-center gap-3 text-sm font-semibold text-muted">
      {faites} / {total}
      <span className="flex items-center" aria-hidden>
        {Array.from({ length: total }, (_, n) => (
          <span key={n} className="flex items-center">
            {n > 0 && <span className={`h-0.5 w-3 ${n < faites ? "bg-primary" : "bg-border"}`} />}
            <span className={`h-2.5 w-2.5 rounded-full ${n < faites ? "bg-primary" : n === faites ? "border-2 border-primary bg-surface" : "border-2 border-border"}`} />
          </span>
        ))}
      </span>
    </span>
  );
}

/** Les cinq étapes du laboratoire, nommées : celles que le moteur a enregistrées sont faites. */
function EtapesLabo({ faites }: { faites: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2" aria-label={`${faites} étapes sur ${ETAPES_EXERCICE} faites`}>
      {NOMS_ETAPES.map((nom, n) => {
        const faite = n < faites;
        const actuelle = n === faites;
        return (
          <li key={nom} className="flex items-center gap-1">
            {n > 0 && <span className={`h-0.5 w-3 rounded-full ${faite ? "bg-primary" : "bg-border"}`} aria-hidden />}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold ${
                faite ? "bg-primary text-on-primary" : actuelle ? "bg-surface text-primary ring-2 ring-primary" : "bg-surface/70 text-muted"
              }`}
              aria-current={actuelle ? "step" : undefined}
            >
              {faite && <Check size={12} strokeWidth={3} />}
              {nom}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// --------------------------------------------------------------------------
// L'exécution de l'exemple tracé du guide, pas à pas
// --------------------------------------------------------------------------

interface Pas {
  ligne: number; // index dans guide.code
  tour: string | null;
  variables: { nom: string; valeur: string; avant: string | null; change: boolean }[];
  condition: string | null;
}

/** Les pas de la trace du guide : ligne exécutée, valeurs après la ligne, ce qui a changé. */
function pasDuGuide(guide: Guide): Pas[] {
  const { colonnes, lignes } = guide.trace;
  const parTour = colonnes[0] === "tour";
  const corps = guide.code.findIndex((l) => l.startsWith("    "));
  const iCondition = colonnes.indexOf("condition");
  return lignes.map((l, n) => {
    const precedente = n > 0 ? lignes[n - 1] : null;
    return {
      ligne: parTour ? (l[0] === "avant" ? 0 : Math.max(corps, 0)) : Math.max(Number(l[0]) - 1, 0),
      tour: parTour && l[0] !== "avant" ? l[0] : null,
      condition: iCondition > 0 && l[iCondition] ? l[iCondition] : null,
      variables: colonnes
        .map((nom, i) => ({ nom, i }))
        .filter(({ nom, i }) => i > 0 && nom !== "condition")
        .map(({ nom, i }) => {
          const avant = precedente ? precedente[i] : null;
          const valeur = l[i] || "—";
          return { nom, valeur, avant: avant && avant !== valeur ? avant : null, change: valeur !== "—" && (avant ?? "—") !== valeur };
        }),
    };
  });
}

function useMouvementReduit() {
  const [reduit, setReduit] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const maj = () => setReduit(m.matches);
    maj();
    m.addEventListener("change", maj);
    return () => m.removeEventListener("change", maj);
  }, []);
  return reduit;
}

/**
 * L'exemple de la notion exécuté ligne par ligne : la ligne en cours s'allume, les variables qui changent
 * montrent leur ancienne et leur nouvelle valeur, l'instruction et son résultat sont séparés.
 */
function ExecutionGuide({ guide }: { guide: Guide }) {
  const pas = pasDuGuide(guide);
  const reduit = useMouvementReduit();
  const [n, setN] = useState(0);
  const [lecture, setLecture] = useState(true);
  const actif = lecture && !reduit;

  useEffect(() => {
    if (!actif) return;
    const minuteur = window.setTimeout(() => setN((x) => (x + 1) % pas.length), n === pas.length - 1 ? 3200 : 2200);
    return () => window.clearTimeout(minuteur);
  }, [actif, n, pas.length]);

  const courant = pas[n];
  const instruction = guide.code[courant.ligne].trim();
  const changees = courant.variables.filter((v) => v.change);
  const aller = (x: number) => {
    setLecture(false);
    setN((x + pas.length) % pas.length);
  };

  return (
    <div className="flex flex-col rounded-[1.6rem] bg-[#111338] p-4 text-[#e4e6ff] shadow-[0_30px_70px_-28px_rgb(33_86_224/0.75)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b4a3ff]">Exemple exécuté pas à pas</span>
        </div>
        <span className="font-mono text-xs text-white/60" aria-live="polite">
          pas {n + 1} / {pas.length}
        </span>
      </div>

      <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* le code, ligne en cours allumée */}
        <pre className="overflow-x-auto rounded-2xl bg-[#0b0d29] py-2.5 font-mono text-[15px] leading-8" aria-label="Algorithme">
          {guide.code.map((l, k) => {
            const active = k === courant.ligne;
            return (
              <div
                key={k}
                className={`flex pr-3 transition-colors duration-300 ${active ? "bg-[#6c5cfc]/25 shadow-[inset_3px_0_0_#8b7bff]" : ""}`}
                aria-current={active ? "step" : undefined}
              >
                <span className={`w-8 shrink-0 select-none pr-2.5 text-right ${active ? "text-[#c4b8ff]" : "text-white/30"}`}>{k + 1}</span>
                <span className="whitespace-pre">{colorer(l)}</span>
              </div>
            );
          })}
        </pre>

        <div className="flex min-w-0 flex-col gap-2.5">
          {/* les variables : la valeur qui vient de changer garde la trace de l'ancienne */}
          <div className="rounded-2xl bg-white/[0.04] p-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">Variables</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {courant.variables.map((v) => (
                <div
                  key={v.nom}
                  className={`rounded-xl border px-3 py-2 transition-colors duration-300 ${
                    v.change ? "border-[#8b7bff] bg-[#6c5cfc]/30" : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="font-mono text-xs text-[#b4a3ff]">{v.nom}</div>
                  <div className="flex items-baseline justify-end gap-2 font-mono">
                    {v.avant && v.avant !== "—" && <span className="text-sm text-white/40 line-through">{v.avant}</span>}
                    <span key={`${n}-${v.valeur}`} className={`text-2xl ${v.change ? "revele text-white" : "text-white/80"}`}>
                      {v.valeur}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* instruction, puis son résultat */}
          <div className="rounded-xl bg-[#0b0d29] px-3.5 py-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
              Instruction{courant.tour ? ` · tour ${courant.tour}` : ""}
            </div>
            <div className="mt-0.5 font-mono text-[15px]">{colorer(instruction)}</div>
          </div>
          <div className="rounded-xl border border-[#3ddbb0]/30 bg-[#3ddbb0]/10 px-3.5 py-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3ddbb0]">Résultat</div>
            <div key={n} className="revele mt-0.5 text-[15px] leading-snug text-white">
              {courant.condition
                ? `La condition vaut ${courant.condition} : on part dans ${courant.condition === "vrai" ? "le alors" : "le sinon"}.`
                : changees.length
                  ? changees.map((v) => `${v.nom} vaut ${v.valeur}`).join(", ")
                  : "Aucune variable ne change."}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => aller(n - 1)} aria-label="Pas précédent" className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20">
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => (reduit ? aller(n + 1) : setLecture((x) => !x))}
            aria-label={actif ? "Mettre en pause" : "Lire"}
            className="rounded-lg bg-[#6c5cfc] p-1.5 hover:bg-[#7d6dff]"
          >
            {actif ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button type="button" onClick={() => aller(n + 1)} aria-label="Pas suivant" className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex flex-1 gap-1" aria-hidden>
          {pas.map((_, k) => (
            <span key={k} className={`h-1 flex-1 rounded-full ${k <= n ? "bg-[#8b7bff]" : "bg-white/15"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** L'élément central : reprendre réellement la dernière activité. */
export function ExperienceEnCours({ experience }: { experience: Experience }) {
  let etiquette = "Expérience en cours";
  let categorie: string;
  let titre: string;
  let texte: string;
  let lien: string;
  let action: string;
  let progression: ReactNode = null;
  let visuel: ReactNode;

  if (experience.sorte === "test") {
    const { plan } = experience;
    const total = plan.notions.reduce((n, x) => n + x.express.length, 0);
    const faites = plan.notions.reduce((n, x) => n + x.express.filter((e) => e.resultat).length, 0);
    const commence = plan.statut !== "a_commencer";
    etiquette = commence ? "Expérience en cours" : "Pour commencer";
    categorie = "Test de niveau";
    titre = commence ? "Trouver ton point de départ" : "Passe ton test de niveau";
    texte = "Quelques algorithmes à lire et à prédire : le test s'arrête dès qu'il a trouvé où tu commences.";
    lien = "/calibrage";
    action = commence ? "Continuer le test" : "Commencer le test";
    progression = <Points faites={faites} total={total} />;
    visuel = (
      <div className="flex min-w-0 flex-col items-center justify-center gap-8 overflow-hidden rounded-[1.6rem] bg-surface/75 px-4 py-10">
        <span className="font-hand text-2xl text-primary">4 notions, 2 questions chacune</span>
        <div className="origin-center scale-[1.5] py-3">
          <Constellation plan={plan} />
        </div>
      </div>
    );
  } else if (experience.sorte === "exercice") {
    const { exercice, faites } = experience;
    const presente = NOTIONS_PRESENTEES[exercice.notion];
    etiquette = exercice.tentative_en_cours ? "Expérience en cours" : "Ta prochaine expérience";
    categorie = LIBELLES_NOTION[exercice.notion];
    titre = presente.titre;
    texte = presente.texte;
    lien = `/exercice/${exercice.id}`;
    action = exercice.tentative_en_cours ? "Reprendre l'expérience" : "Commencer l'expérience";
    progression = <EtapesLabo faites={faites} />;
    visuel = <ExecutionGuide key={exercice.notion} guide={GUIDES[exercice.notion]} />;
  } else {
    categorie = "Parcours terminé";
    titre = "Les quatre notions sont au vert";
    texte = "Chaque algorithme que tu as écrit t'attend désormais en Python, JavaScript, Java et C.";
    lien = "/langages";
    action = "Voir les quatre langages";
    visuel = (
      <div className="flex h-full min-h-56 items-center justify-center rounded-[1.6rem] bg-surface/75">
        <Coupe taille={120} />
      </div>
    );
  }

  return (
    <section
      aria-labelledby="titre-experience"
      className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-[linear-gradient(120deg,color-mix(in_oklab,var(--primary)_9%,var(--surface)),color-mix(in_oklab,var(--lavande)_16%,var(--surface)))] p-carte shadow-[0_30px_70px_-40px_var(--primary)] lg:p-section"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-lavande/15 blur-3xl" aria-hidden />
      <div className="relative grid items-stretch gap-bloc lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:grid-cols-1 2xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col">
          <span className="self-start rounded-full bg-primary/12 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">{etiquette}</span>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.14em] text-primary">{categorie}</p>
          <h2 id="titre-experience" className="mt-1.5 font-display text-[2.4rem] leading-[1.08]">
            {titre}
          </h2>
          {experience.sorte === "exercice" && (
            <p className="mt-2 text-[15px] font-semibold text-text/80">Exercice : {experience.exercice.titre}</p>
          )}
          <p className="mt-2 max-w-md text-base leading-relaxed text-text/70">{texte}</p>
          {progression && <div className="mt-bloc">{progression}</div>}
          <div className="mt-auto pt-bloc">
            <Link
              href={lien}
              className="bouton-lumineux inline-flex items-center gap-2.5 rounded-2xl px-7 py-4 text-[17px] font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              {action} <ArrowRight size={20} />
            </Link>
          </div>
          {experience.sorte === "exercice" && (
            <Annotation fleche="droite" className="mt-4 hidden self-end text-lg lg:inline-flex xl:hidden 2xl:inline-flex">
              observe les changements
            </Annotation>
          )}
        </div>
        <div className="flex min-w-0 flex-col justify-center">{visuel}</div>
      </div>
    </section>
  );
}

const ETAT_LISIBLE: Record<Etat, string> = {
  demontree: "Validée au test",
  validee: "Terminée",
  en_cours: "En cours",
  a_faire: "À faire",
};

const estVerte = (e: Etat | undefined) => e === "validee" || e === "demontree";

/** Ma progression : un résumé lisible d'un coup d'œil, puis les quatre notions et leur état réel. */
export function MaProgression({ carte, debloquees, recompenses }: { carte: LigneCarte[]; debloquees: Notion[]; recompenses: number }) {
  const vertes = carte.filter((l) => estVerte(l.etat)).length;
  return (
    <section id="progression" aria-labelledby="titre-progression" className="relative rounded-[1.75rem] border border-border bg-surface p-carte">
      <h2 id="titre-progression" className="font-display text-2xl">
        Ma progression
      </h2>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-extrabold text-primary">{vertes}</span>
        <span className="text-base font-semibold text-text/70">/ {carte.length} notions au vert</span>
      </p>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {carte.map((l) => (
          <span
            key={l.notion}
            className={`h-2.5 flex-1 rounded-full ${estVerte(l.etat) ? "bg-primary" : l.etat === "en_cours" ? "bg-[linear-gradient(90deg,var(--primary)_50%,var(--primary-soft)_50%)]" : "bg-primary-soft"}`}
          />
        ))}
      </div>
      <ol className="relative mt-bloc flex flex-col gap-4">
        <span className="absolute bottom-3 left-[13px] top-3 w-0.5 bg-border" aria-hidden />
        {carte.map((l) => {
          const verte = estVerte(l.etat);
          const verrouillee = !debloquees.includes(l.notion) && l.etat === "a_faire";
          return (
            <li key={l.notion} className="relative flex items-center gap-3">
              <span
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  verte
                    ? "bg-primary text-on-primary"
                    : l.etat === "en_cours"
                      ? "border-2 border-primary bg-surface shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
                      : "border-2 border-border bg-surface text-muted"
                }`}
              >
                {verte ? (
                  <Check size={14} strokeWidth={3} />
                ) : l.etat === "en_cours" ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                ) : verrouillee ? (
                  <Lock size={12} />
                ) : null}
              </span>
              <span className={`flex-1 text-[15px] font-semibold ${l.etat === "en_cours" ? "text-primary" : ""}`}>{LIBELLES_NOTION[l.notion]}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[13px] font-medium ${
                  verte ? "bg-success-soft text-success" : l.etat === "en_cours" ? "bg-primary-soft text-primary" : "text-muted"
                }`}
              >
                {verrouillee ? "À venir" : ETAT_LISIBLE[l.etat]}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex items-end justify-between gap-2">
        {recompenses > 0 ? (
          <Link href="/langages" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <Sparkles size={15} /> Tes algorithmes en 4 langages
          </Link>
        ) : (
          <span />
        )}
        <span className="-rotate-3 font-hand text-lg leading-5 text-primary">ton chemin se construit pas à pas</span>
      </div>
    </section>
  );
}

/** Le chemin d'exploration : les quatre notions comme des étapes illustrées, reliées par un sentier. */
export function AutresExplorations({
  exercices,
  carte,
  courante,
  prochaine,
}: {
  exercices: Exercice[];
  carte: LigneCarte[];
  courante: Notion | null;
  prochaine: Notion | null;
}) {
  return (
    <section id="explorations" aria-labelledby="titre-explorations">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="titre-explorations" className="font-display text-[1.75rem] leading-tight">
          Mon chemin d&apos;exploration
        </h2>
        <span className="font-hand text-xl text-primary">une notion après l&apos;autre</span>
      </div>
      <ol className="relative mt-bloc grid gap-bloc sm:grid-cols-2 xl:grid-cols-4">
        {/* le sentier qui relie les étapes (ordinateur) */}
        <svg className="pointer-events-none absolute inset-x-[10%] top-[3.25rem] hidden h-8 w-[80%] xl:block" viewBox="0 0 800 32" preserveAspectRatio="none" aria-hidden>
          <path d="M0 16 C 130 -6, 270 38, 400 16 S 670 -6, 800 16" fill="none" stroke="var(--primary)" strokeOpacity=".35" strokeWidth="2.5" strokeDasharray="2 9" strokeLinecap="round" />
        </svg>
        {NOTIONS.map((notion, n) => {
          const exo = exercices.find((e) => e.notion === notion);
          const ouvert = !!exo?.accessible;
          // L'état vient de la carte de maîtrise (une notion peut être validée dès le test de niveau).
          const etatCarte = carte.find((x) => x.notion === notion)?.etat;
          const verte = estVerte(etatCarte);
          const ici = notion === courante;
          const presente = NOTIONS_PRESENTEES[notion];
          const pastille = verte
            ? { texte: etatCarte === "demontree" ? "Validée au test" : "Validée", classe: "bg-success-soft text-success", icone: <Check size={13} strokeWidth={3} /> }
            : ici
              ? { texte: "Tu es ici", classe: "bg-primary text-on-primary", icone: <MapPin size={13} /> }
              : ouvert
                ? { texte: "Ouverte", classe: "bg-primary-soft text-primary", icone: null }
                : { texte: "Verrouillée", classe: "bg-surface-2 text-muted", icone: <Lock size={13} /> };

          const contenu = (
            <>
              <div
                className={`relative flex h-28 items-center justify-center rounded-[1.5rem] border transition-transform duration-500 group-hover:-translate-y-1 ${
                  ici
                    ? "border-primary/40 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_14%,var(--surface)),color-mix(in_oklab,var(--lavande)_22%,var(--surface)))] shadow-[0_18px_40px_-22px_var(--primary)]"
                    : "border-border bg-surface"
                }`}
              >
                <SceneNotion notion={notion} className={`h-full w-full ${!ouvert && !verte ? "opacity-45 grayscale" : ""}`} />
                <span className="absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg bg-text font-mono text-sm font-bold text-bg">
                  {n + 1}
                </span>
                {!ouvert && !verte && (
                  <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 text-muted shadow-md">
                      <Lock size={19} />
                    </span>
                  </span>
                )}
              </div>
              <span className={`mt-3 inline-flex items-center gap-1 self-start rounded-full px-2.5 py-1 text-[13px] font-semibold ${pastille.classe}`}>
                {pastille.icone}
                {pastille.texte}
              </span>
              <h3 className="mt-2 font-display text-[1.35rem] leading-snug">{presente.titre}</h3>
              <p className="mt-1 text-[15px] leading-relaxed text-text/70">{presente.texte}</p>
              <span className={`mt-auto pt-3 text-sm font-semibold ${ouvert ? "text-primary" : "text-muted"}`}>
                {ouvert ? (
                  <span className="inline-flex items-center gap-1.5">
                    {verte ? "Revoir" : ici ? "Continuer" : "Explorer"} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                ) : prochaine ? (
                  `S'ouvre après ${LIBELLES_NOTION[prochaine].toLowerCase()}`
                ) : (
                  "Bientôt ouverte"
                )}
              </span>
            </>
          );

          return (
            <li key={notion} className="revele relative" style={{ animationDelay: `${n * 90}ms` }}>
              {ouvert && exo ? (
                <Link href={`/exercice/${exo.id}`} aria-label={`${presente.titre} : ouvrir l'exercice ${exo.titre}`} className="group flex h-full flex-col">
                  {contenu}
                </Link>
              ) : (
                <div className="flex h-full flex-col" aria-label={`${presente.titre} : verrouillée`}>
                  {contenu}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** La prochaine activité recommandée par le moteur. */
export function ProchaineEtape({ cockpit }: { cockpit: Cockpit }) {
  const testAFaire = cockpit.calibrage.statut !== "terminee";
  const notion = cockpit.prochaine_notion;
  const exo = notion ? cockpit.exercices.find((e) => e.notion === notion) : undefined;
  const titre = testAFaire ? "Test de niveau" : notion ? NOTIONS_PRESENTEES[notion].titre : "Les quatre langages";
  const texte = testAFaire
    ? "Commence par lui : il décide de ton point de départ."
    : notion
      ? NOTIONS_PRESENTEES[notion].texte
      : "Tout est au vert : revois tes algorithmes en quatre langages.";
  const lien = testAFaire ? "/calibrage" : exo ? `/exercice/${exo.id}` : "/langages";
  return (
    <section aria-labelledby="titre-prochaine" className="overflow-hidden rounded-[1.75rem] border border-border bg-surface">
      <div className="relative flex h-32 items-center justify-center bg-[linear-gradient(135deg,color-mix(in_oklab,var(--lavande)_26%,var(--surface)),color-mix(in_oklab,var(--primary)_14%,var(--surface)))]">
        {notion && !testAFaire ? <SceneNotion notion={notion} className="h-full w-auto" /> : <RobotAlgo taille={88} tablette className="flotte" />}
        <Sparkles size={18} className="absolute right-4 top-4 text-lavande" aria-hidden />
      </div>
      <div className="p-carte">
        <h2 id="titre-prochaine" className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Ma prochaine étape
        </h2>
        <p className="mt-1.5 font-display text-[1.45rem] leading-snug">{titre}</p>
        {notion && !testAFaire && <p className="text-sm font-semibold text-muted">{LIBELLES_NOTION[notion]}</p>}
        <p className="mt-1.5 text-[15px] leading-relaxed text-text/70">{texte}</p>
        <Link
          href={lien}
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-[15px] font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
        >
          {testAFaire ? "Passer le test" : exo ? "Y aller" : "Voir les langages"} <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}

/** Le robot, dans un seul espace : un encouragement et la phrase qui résume la démarche. */
export function Motivation() {
  return (
    <section
      aria-label="Encouragement"
      className="flex items-center gap-icone rounded-[1.75rem] border border-border bg-[linear-gradient(135deg,var(--surface),color-mix(in_oklab,var(--lavande)_12%,var(--surface)))] p-carte"
    >
      <RobotAlgo taille={84} className="flotte shrink-0" />
      <div>
        <p className="-rotate-2 font-hand text-[1.6rem] leading-7 text-primary">Tu es capable de grandes choses&nbsp;!</p>
        <p className="mt-2 text-sm leading-relaxed text-text/65">
          «&nbsp;Ce n&apos;est pas la réponse qui compte, mais le chemin pour y arriver.&nbsp;»
        </p>
      </div>
    </section>
  );
}

/** Le code qui permet de retrouver ce profil sur un autre appareil, avec le pseudo. */
export function CodeReprise({ code }: { code: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <section aria-labelledby="titre-code" className="rounded-[1.75rem] border border-border bg-surface p-carte">
      <h2 id="titre-code" className="flex items-center gap-icone text-xs font-bold uppercase tracking-[0.14em] text-primary">
        <KeyRound size={16} aria-hidden /> Mon code de reprise
      </h2>
      <div className="mt-titre flex items-center justify-between gap-3">
        <span className="font-mono text-2xl font-semibold tracking-[0.12em]">{code}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(code).then(
              () => {
                setCopie(true);
                window.setTimeout(() => setCopie(false), 2000);
              },
              () => {},
            );
          }}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-text/80 transition-colors hover:border-primary hover:text-primary"
        >
          {copie ? <Check size={15} /> : <Copy size={15} />} {copie ? "Copié" : "Copier"}
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-text/65">
        Note-le : avec ton pseudo, il te permet de retrouver ton profil sur un autre appareil. Garde-le pour toi.
      </p>
    </section>
  );
}
