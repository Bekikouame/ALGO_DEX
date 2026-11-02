"use client";

import { ArrowDown, ArrowRight, Check, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
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
    <span className="flex items-center gap-3 text-xs font-medium text-muted">
      {faites} / {total}
      <span className="flex items-center" aria-hidden>
        {Array.from({ length: total }, (_, n) => (
          <span key={n} className="flex items-center">
            {n > 0 && <span className={`h-0.5 w-3 ${n < faites ? "bg-primary" : "bg-border"}`} />}
            <span className={`h-2 w-2 rounded-full ${n < faites ? "bg-primary" : n === faites ? "border-2 border-primary bg-surface" : "border-2 border-border"}`} />
          </span>
        ))}
      </span>
    </span>
  );
}

/** L'exemple tracé du guide de la notion : son code, et la valeur qui évolue à côté. */
function EvolutionGuide({ guide }: { guide: Guide }) {
  const { colonnes, lignes } = guide.trace;
  const suites = colonnes
    .map((nom, i) => ({ nom, i }))
    .filter(({ nom, i }) => i > 0 && nom !== "condition")
    .map(({ nom, i }) => ({
      nom,
      valeurs: lignes.map((l) => l[i]).filter((v) => v && v !== "—").filter((v, k, t) => k === 0 || t[k - 1] !== v),
    }));
  const meilleure = suites.reduce((a, b) => (b.valeurs.length > a.valeurs.length ? b : a), suites[0]);
  // Sans valeur qui change (une condition), on montre l'état final de chaque colonne.
  const evolue = !!meilleure && meilleure.valeurs.length > 1;
  const cases = evolue
    ? meilleure.valeurs.slice(0, 4).map((v) => ({ nom: meilleure.nom, v }))
    : colonnes.slice(1).map((nom, i) => ({ nom, v: lignes[lignes.length - 1][i + 1] })).filter((c) => c.v && c.v !== "—");

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-3xl bg-[#111338] p-3 text-[#e4e6ff] shadow-[0_24px_60px_-24px_rgb(33_86_224/0.7)] sm:gap-4 sm:p-4">
      <div className="min-w-0">
        <div className="mb-2 flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <pre className="overflow-x-auto rounded-2xl bg-[#0b0d29] py-2 font-mono text-[13px] leading-[1.6rem]">
          {guide.code.map((l, n) => (
            <div key={n} className="flex pr-3">
              <span className="w-7 shrink-0 select-none pr-2 text-right text-white/30">{n + 1}</span>
              <span className="whitespace-pre">{colorer(l)}</span>
            </div>
          ))}
        </pre>
      </div>
      <div className="flex flex-col items-center justify-center gap-1.5">
        {cases.map((c, n) => (
          <div key={n} className="flex flex-col items-center gap-1">
            {n > 0 && evolue && <ArrowDown size={14} className="text-[#8b7bff]" aria-hidden />}
            <div
              className={`min-w-16 rounded-xl border px-3 py-1.5 ${
                n === cases.length - 1 ? "border-[#8b7bff] bg-[#6c5cfc]/30" : "border-white/10 bg-white/5"
              }`}
            >
              <div className="font-mono text-[10px] text-[#b4a3ff]">{c.nom}</div>
              <div className="text-right font-mono text-xl text-white">{c.v}</div>
            </div>
          </div>
        ))}
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
      <div className="flex min-w-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl bg-surface/70 px-4 py-6">
        <span className="font-hand text-lg text-primary">4 notions, 2 questions chacune</span>
        <div className="origin-center scale-125">
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
    action = exercice.tentative_en_cours ? "Continuer l'expérience" : "Commencer l'expérience";
    progression = <Points faites={faites} total={ETAPES_EXERCICE} />;
    visuel = <EvolutionGuide guide={GUIDES[exercice.notion]} />;
  } else {
    categorie = "Parcours terminé";
    titre = "Les quatre notions sont au vert";
    texte = "Chaque algorithme que tu as écrit t'attend désormais en Python, JavaScript, Java et C.";
    lien = "/langages";
    action = "Voir les quatre langages";
    visuel = (
      <div className="flex min-h-40 items-center justify-center rounded-3xl bg-surface/70">
        <Coupe taille={96} />
      </div>
    );
  }

  return (
    <section
      aria-labelledby="titre-experience"
      className="relative overflow-hidden rounded-[1.75rem] border border-primary/15 bg-[linear-gradient(120deg,color-mix(in_oklab,var(--primary)_9%,var(--surface)),color-mix(in_oklab,var(--lavande)_16%,var(--surface)))] px-6 py-[clamp(1rem,2.6vh,1.75rem)] shadow-[0_30px_70px_-40px_var(--primary)] sm:px-8"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-lavande/15 blur-3xl" aria-hidden />
      <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="rounded-full bg-primary/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">{etiquette}</span>
            {progression}
          </div>
          <p className="mt-[clamp(0.75rem,2vh,1.25rem)] text-xs font-bold uppercase tracking-[0.14em] text-primary">{categorie}</p>
          <h2 id="titre-experience" className="mt-1 font-display text-[2rem] leading-tight">
            {titre}
          </h2>
          {experience.sorte === "exercice" && <p className="mt-1 text-sm font-medium text-muted">Exercice : {experience.exercice.titre}</p>}
          <p className="mt-2 max-w-sm text-[15px] text-muted">{texte}</p>
          <Link
            href={lien}
            className="mt-[clamp(0.9rem,2.4vh,1.5rem)] inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-semibold text-on-primary shadow-[0_14px_30px_-12px_var(--primary)] transition-transform hover:-translate-y-0.5"
          >
            {action} <ArrowRight size={18} />
          </Link>
        </div>
        {/* Le visuel, et la note manuscrite à sa droite comme sur la maquette */}
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">{visuel}</div>
          {experience.sorte === "exercice" && (
            <Annotation fleche="gauche" className="hidden w-[5.5rem] shrink-0 flex-col items-center text-lg leading-5 2xl:inline-flex">
              observe les changements
            </Annotation>
          )}
        </div>
      </div>
    </section>
  );
}

const ETAT_LISIBLE: Record<Etat, string> = {
  demontree: "Validée au test",
  validee: "Terminé",
  en_cours: "En cours",
  a_faire: "À faire",
};

/** Ma progression : les quatre notions sur une ligne verticale, états réels de la carte de maîtrise. */
export function MaProgression({ carte, debloquees, recompenses }: { carte: LigneCarte[]; debloquees: Notion[]; recompenses: number }) {
  return (
    <section id="progression" aria-labelledby="titre-progression" className="relative rounded-[1.5rem] border border-border bg-surface px-5 py-4">
      <h2 id="titre-progression" className="flex items-center justify-between font-display text-xl">
        Ma progression
        <svg width="30" height="26" viewBox="0 0 30 26" fill="none" aria-hidden className="text-primary">
          <path d="M3 24h24M6 24v-6M12 24v-10M18 24v-7M24 24v-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 15l7-7 6 4 9-9M21 3h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </h2>
      <ol className="relative mt-3 flex flex-col gap-[clamp(0.5rem,1.4vh,1rem)]">
        <span className="absolute bottom-3 left-[11px] top-3 w-0.5 bg-border" aria-hidden />
        {carte.map((l) => {
          const verte = l.etat === "validee" || l.etat === "demontree";
          const verrouillee = !debloquees.includes(l.notion) && l.etat === "a_faire";
          return (
            <li key={l.notion} className="relative flex items-start gap-3">
              <span
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  verte
                    ? "bg-primary text-on-primary"
                    : l.etat === "en_cours"
                      ? "border-2 border-primary bg-surface shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
                      : "border-2 border-border bg-surface"
                }`}
              >
                {verte ? <Check size={13} strokeWidth={3} /> : l.etat === "en_cours" ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
              </span>
              <div className="leading-tight">
                <div className={`text-sm font-semibold ${l.etat === "en_cours" ? "text-primary" : ""}`}>{LIBELLES_NOTION[l.notion]}</div>
                <div className={`mt-0.5 text-xs ${verte ? "text-success" : l.etat === "en_cours" ? "text-primary" : "text-muted"}`}>
                  {verte || l.etat === "en_cours" ? "✓ " : ""}
                  {verrouillee ? "À venir" : ETAT_LISIBLE[l.etat]}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <Annotation fleche="bas" className="absolute right-2 top-[5.5rem] max-w-[8.5rem] text-base leading-5">
        ton chemin se construit pas à pas
      </Annotation>
      {recompenses > 0 && (
        <Link href="/langages" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          <Sparkles size={14} /> Tes algorithmes en 4 langages
        </Link>
      )}
    </section>
  );
}

/** Les autres notions, chacune avec sa scène, son état réel et son accès s'il est ouvert. */
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
  const autres = NOTIONS.filter((n) => n !== courante);
  return (
    <section id="explorations" aria-labelledby="titre-explorations" className="flex min-h-0 flex-col">
      <h2 id="titre-explorations" className="font-display text-[1.7rem] leading-tight">
        Mes autres explorations
      </h2>
      <ul className={`mt-[clamp(0.5rem,1.4vh,1rem)] grid gap-4 sm:grid-cols-2 ${autres.length > 3 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
        {autres.map((notion, n) => {
          const exo = exercices.find((e) => e.notion === notion);
          const ouvert = !!exo?.accessible;
          // L'état vient de la carte de maîtrise (une notion peut être validée dès le test de niveau).
          const etatCarte = carte.find((x) => x.notion === notion)?.etat;
          const verte = etatCarte === "validee" || etatCarte === "demontree";
          const presente = NOTIONS_PRESENTEES[notion];
          return (
            <li
              key={notion}
              className="revele group relative flex flex-col rounded-[1.25rem] border border-border bg-surface px-4 pb-4 pt-3 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_var(--primary)]"
              style={{ animationDelay: `${n * 90}ms` }}
            >
              <SceneNotion notion={notion} className="h-[clamp(4.5rem,10vh,6.5rem)] w-full transition-transform duration-500 group-hover:scale-105" />
              <span className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                {verte ? <Check size={12} className="text-success" /> : !ouvert && <Lock size={12} />}
                {LIBELLES_NOTION[notion]}
                {verte && <span className="text-success">· {etatCarte === "demontree" ? "validée au test" : "validée"}</span>}
              </span>
              <h3 className="mt-1 font-display text-lg leading-snug">{presente.titre}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-[13px] leading-snug text-muted">{presente.texte}</p>
              {ouvert && exo ? (
                <Link
                  href={`/exercice/${exo.id}`}
                  aria-label={`Ouvrir l'exercice ${exo.titre}`}
                  className="mt-3 flex h-8 w-11 items-center justify-center rounded-full bg-primary text-on-primary transition-transform group-hover:translate-x-1"
                >
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <span className="mt-3 flex h-8 items-center text-xs text-muted">
                  {prochaine ? `S'ouvre après ${LIBELLES_NOTION[prochaine].toLowerCase()}` : "Bientôt ouverte"}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** La prochaine activité recommandée par le moteur. */
export function ProchaineEtape({ cockpit }: { cockpit: Cockpit }) {
  const testAFaire = cockpit.calibrage.statut !== "terminee";
  const notion = cockpit.prochaine_notion;
  const exo = notion ? cockpit.exercices.find((e) => e.notion === notion) : undefined;
  const titre = testAFaire ? "Test de niveau" : notion ? LIBELLES_NOTION[notion] : "Les quatre langages";
  const texte = testAFaire
    ? "Commence par lui : il décide de ton point de départ."
    : notion
      ? NOTIONS_PRESENTEES[notion].texte
      : "Tout est au vert : revois tes algorithmes en quatre langages.";
  const lien = testAFaire ? "/calibrage" : exo ? `/exercice/${exo.id}` : "/langages";
  return (
    <section aria-labelledby="titre-prochaine" className="rounded-[1.5rem] border border-border bg-surface px-5 py-4">
      <h3 id="titre-prochaine" className="flex items-center justify-between font-display text-xl">
        Ma prochaine étape <Sparkles size={18} className="text-lavande" aria-hidden />
      </h3>
      <div className="mt-3 flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,color-mix(in_oklab,var(--lavande)_30%,var(--surface)),color-mix(in_oklab,var(--rose)_18%,var(--surface)))]">
          {notion && !testAFaire ? <SceneNotion notion={notion} className="h-20 w-28 max-w-none" /> : <RobotAlgo taille={56} />}
        </div>
        <div className="min-w-0">
          <div className="font-semibold">{titre}</div>
          <p className="mt-0.5 text-xs text-muted">{texte}</p>
          <Link href={lien} className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary">
            {testAFaire ? "Y aller" : "Voir le détail"} <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Motivation() {
  return (
    <>
      <div className="flex items-center gap-2 rounded-[1.5rem] border border-border bg-surface px-4 py-2">
        <RobotAlgo taille={64} className="flotte shrink-0" />
        <p className="-rotate-3 font-hand text-[1.35rem] leading-6 text-primary">Tu es capable de grandes choses&nbsp;!</p>
      </div>
      <blockquote className="rounded-[1.5rem] border border-border bg-[linear-gradient(135deg,var(--surface),color-mix(in_oklab,var(--lavande)_12%,var(--surface)))] px-5 py-3 text-center font-hand text-lg leading-6 text-primary">
        « Ce n&apos;est pas la réponse qui compte, mais le chemin pour y arriver. »
      </blockquote>
    </>
  );
}
