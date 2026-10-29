"use client";

import { ArrowRight, LogOut, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { CarteMaitrise, LegendeCarte } from "@/components/carte";
import { Chargement, MessageErreur } from "@/components/coque";
import { Logo, Mascotte } from "@/components/marque";
import { Attente, CocheTracee, Coupe, Drapeau, IconeComparer, IconeLire, IconeObserver } from "@/components/test/icones";
import { QuestionTest } from "@/components/test/question";
import { Constellation } from "@/components/test/scenes";
import { BasculeTheme } from "@/components/theme";
import { api, LIBELLES_NOTION, type ExercicePublic, type LigneCarte, type Notion, type PlanCascade, type Progression } from "@/lib/api";
import { useProfilActif } from "@/lib/profils";

type Etat =
  | { phase: "chargement" }
  | { phase: "entree"; plan: PlanCascade; pseudo: string }
  | { phase: "question"; depart: Progression & { exercice: ExercicePublic }; plan: PlanCascade; pseudo: string }
  | { phase: "transition"; juste: boolean; plan: PlanCascade; pseudo: string }
  | {
      phase: "bilan";
      plan: PlanCascade;
      carte: LigneCarte[];
      debloquees: Notion[];
      prochaine: Notion | null;
      exerciceSuivant: string | null;
      pseudo: string;
    };

/**
 * Le test de niveau (calibrage, F1) : une cascade de questions express décidée par le moteur.
 * Le moteur choisit la question suivante, juge chaque prédiction et arrête la cascade ;
 * cette page met chaque question en scène et restitue le résultat.
 */
export default function TestDeNiveau() {
  const profilId = useProfilActif();
  // Une page neuve par profil : jamais le test (ou le résultat) d'un autre profil de l'appareil.
  return profilId ? <Test key={profilId} profilId={profilId} /> : <Chargement />;
}

function Test({ profilId }: { profilId: string }) {
  const [etat, setEtat] = useState<Etat>({ phase: "chargement" });
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(
    (demarrer = false) => {
      etapeSuivante(profilId, demarrer)
        .then(setEtat)
        .catch((e) => setErreur(e.message));
    },
    [profilId],
  );

  // Next garde la page en mémoire quand on la quitte (Cache Components) : à chaque retour, l'effet
  // se relance et l'on redemande au moteur où en est le test, plutôt que de réafficher l'ancien état.
  useEffect(() => charger(), [charger]);
  useLayoutEffect(
    () => () => {
      setEtat({ phase: "chargement" });
      setErreur(null);
    },
    [],
  );

  function relancer(demarrer = false) {
    setErreur(null);
    setEtat({ phase: "chargement" });
    charger(demarrer);
  }

  // Après une question : un instant pour le verdict, puis la suite que le moteur a décidée.
  function apresQuestion(juste: boolean, plan: PlanCascade, pseudo: string) {
    setEtat({ phase: "transition", juste, plan, pseudo });
    if (juste && plan.statut !== "terminee") setTimeout(() => relancer(true), 1600);
  }

  const plan = "plan" in etat ? etat.plan : null;
  const pseudo = "pseudo" in etat ? etat.pseudo : "";
  const courant = etat.phase === "question" ? etat.depart.exercice.id : undefined;

  return (
    <div className="fond-labo min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-8">
          <Link href="/" aria-label="ALGO_DEX, accueil" className="shrink-0">
            <Logo />
          </Link>
          <div className="min-w-0 leading-tight">
            <div className="font-hand text-2xl leading-6 text-lavande">Test de niveau</div>
            {pseudo && <div className="truncate text-xs text-muted">{pseudo}</div>}
          </div>
          {plan && etat.phase !== "entree" && etat.phase !== "bilan" && (
            <div className="mx-auto hidden md:block">
              <Constellation plan={plan} courant={courant} />
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <BasculeTheme />
            <Link
              href="/parcours"
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-text"
              title="Ta progression est gardée : tu reprendras à cette question."
            >
              <LogOut size={15} /> <span className="hidden sm:inline">Quitter</span>
            </Link>
          </div>
        </div>
        {plan && etat.phase === "question" && (
          <div className="flex justify-center border-t border-border/50 py-2 md:hidden">
            <Constellation plan={plan} courant={courant} />
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-8">
        {erreur ? (
          <div className="py-16">
            <MessageErreur message={erreur} />
            <button
              type="button"
              onClick={() => relancer()}
              className="bouton-lumineux mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
            >
              <RotateCcw size={16} /> Réessayer
            </button>
          </div>
        ) : etat.phase === "chargement" ? (
          <Chargement />
        ) : etat.phase === "entree" ? (
          <Entree plan={etat.plan} onCommencer={() => relancer(true)} />
        ) : etat.phase === "question" ? (
          <QuestionTest
            key={etat.depart.tentative.id}
            depart={etat.depart}
            {...rangDans(etat.plan, etat.depart.exercice)}
            onTerminee={(juste, p) => apresQuestion(juste, p, etat.pseudo)}
          />
        ) : etat.phase === "transition" ? (
          <Transition juste={etat.juste} plan={etat.plan} onSuite={() => relancer(true)} />
        ) : (
          <Bilan etat={etat} />
        )}
      </main>
    </div>
  );
}

function rangDans(plan: PlanCascade, exercice: ExercicePublic) {
  const express = plan.notions.find((n) => n.notion === exercice.notion)?.express ?? [];
  return { rang: express.findIndex((e) => e.id === exercice.id) + 1, total: express.length };
}

/** L'entrée dans le test : les règles, et la cascade qui attend. */
function Entree({ plan, onCommencer }: { plan: PlanCascade; onCommencer: () => void }) {
  const regles = [
    { icone: IconeLire, texte: "Tu dévoiles un court algorithme, ligne par ligne." },
    { icone: IconeObserver, texte: "Tu prédis ce qu'il va faire, puis tu le regardes s'exécuter." },
    { icone: IconeComparer, texte: "Deux prédictions justes : la notion est validée. À la première erreur, le test s'arrête là." },
  ];
  return (
    <div className="scene-entree grid items-center gap-12 py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:py-16">
      <div>
        <p className="-rotate-2 font-hand text-2xl text-rose">avant de commencer…</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.05] sm:text-6xl">
          Ton test <span className="texte-degrade">de niveau</span>
        </h1>
        <p className="mt-5 max-w-md text-muted">
          Quelques minutes pour trouver ton point de départ. Pas de note, pas de chrono : on cherche simplement où
          commencer.
        </p>
        <ol className="relative mt-8 flex flex-col gap-6">
          <svg className="absolute left-[23px] top-6 h-[calc(100%-3rem)] w-2 text-lavande/50" preserveAspectRatio="none" viewBox="0 0 8 100" aria-hidden>
            <path d="M4 0 C 0 30, 8 60, 4 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
          </svg>
          {regles.map((r, n) => (
            <li key={n} className="revele relative flex items-center gap-4" style={{ animationDelay: `${200 + n * 180}ms` }}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-lavande/40 bg-bg shadow-[0_0_24px_-10px_var(--primary)]">
                <r.icone taille={30} />
              </span>
              <span>{r.texte}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={onCommencer}
          className="bouton-lumineux mt-10 inline-flex items-center gap-2 rounded-xl px-7 py-4 font-semibold text-white"
        >
          Commencer le test <ArrowRight size={18} />
        </button>
      </div>

      <div className="relative flex flex-col items-center gap-8">
        <p className="self-start -rotate-3 font-hand text-2xl text-lavande">4 notions, 2 questions chacune</p>
        <Constellation plan={plan} grande />
        <div className="flex items-end gap-3 self-start">
          <Mascotte taille={86} className="shrink-0" />
          <p className="mb-3 max-w-xs rounded-2xl rounded-bl-sm border border-primary/45 bg-surface/85 px-4 py-3 text-sm shadow-card">
            Ici, se tromper est utile : c&apos;est ce qui me dit par où tu vas commencer.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Entre deux questions : le verdict du moteur, et la constellation qui se met à jour. */
function Transition({ juste, plan, onSuite }: { juste: boolean; plan: PlanCascade; onSuite: () => void }) {
  const fini = plan.statut === "terminee";
  return (
    <div className="scene-entree flex flex-col items-center gap-8 py-20 text-center" role="status">
      {juste ? <CocheTracee taille={96} /> : <Drapeau taille={96} />}
      <div>
        <h1 className="font-display text-4xl">{juste ? "Prédiction juste" : "Ton point de départ est trouvé"}</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          {juste
            ? fini
              ? "Le test est terminé."
              : "Question suivante…"
            : "Le test s'arrête ici : pas de question au-delà de ce qui reste à apprendre."}
        </p>
      </div>
      <Constellation plan={plan} grande />
      {fini && (
        <button type="button" onClick={onSuite} className="bouton-lumineux inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white">
          Découvrir mon résultat <ArrowRight size={18} />
        </button>
      )}
    </div>
  );
}

/** Le résultat rendu par le moteur, et le chemin vers le parcours recommandé. */
function Bilan({ etat }: { etat: Extract<Etat, { phase: "bilan" }> }) {
  const { plan, prochaine, exerciceSuivant } = etat;
  return (
    <div className="scene-entree py-10 lg:py-14">
      <p className="-rotate-2 font-hand text-2xl text-rose">résultat du test</p>
      <h1 className="mt-2 font-display text-5xl leading-tight">
        {prochaine ? (
          <>
            Tu commences par <span className="texte-degrade">{LIBELLES_NOTION[prochaine].toLowerCase()}</span>
          </>
        ) : (
          <>
            Les quatre notions sont <span className="texte-degrade">démontrées</span>
          </>
        )}
      </h1>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plan.notions.map((n, i) => (
          <li key={n.notion} className="revele" style={{ animationDelay: `${i * 150}ms` }}>
            <div className="flex items-center gap-2">
              {n.statut === "demontree" ? <Coupe taille={36} /> : n.statut === "echec" ? <Drapeau taille={36} /> : <Attente taille={36} />}
              <span className="font-semibold">{LIBELLES_NOTION[n.notion]}</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {n.statut === "demontree"
                ? "Démontrée : tu peux passer à la suite."
                : n.statut === "echec"
                  ? "C'est ici que ton parcours commence."
                  : "Pas encore testée : elle viendra ensuite."}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        {exerciceSuivant && prochaine ? (
          <Link href={`/exercice/${exerciceSuivant}`} className="bouton-lumineux inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white">
            Commencer : {LIBELLES_NOTION[prochaine]} <ArrowRight size={18} />
          </Link>
        ) : (
          <Link href="/langages" className="bouton-lumineux inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white">
            Voir les quatre langages <ArrowRight size={18} />
          </Link>
        )}
        <Link href="/parcours" className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3.5 font-semibold">
          Voir mon parcours
        </Link>
      </div>

      <section className="mt-14">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl">Ta carte de maîtrise</h2>
          <LegendeCarte />
        </div>
        <CarteMaitrise carte={etat.carte} debloquees={etat.debloquees} prochaine={prochaine} />
      </section>
    </div>
  );
}

/** L'entrée du test, la prochaine question de la cascade, ou le bilan quand elle est terminée. */
async function etapeSuivante(profilId: string, demarrer: boolean): Promise<Etat> {
  const cockpit = await api.cockpit(profilId);
  const plan = cockpit.calibrage;
  const pseudo = cockpit.profil.pseudo;
  if (plan.statut === "a_commencer" && !demarrer) return { phase: "entree", plan, pseudo };
  if (plan.statut === "terminee" || !plan.prochain_exercice_id) {
    const r = await api.appliquerCalibrage(profilId);
    return {
      phase: "bilan",
      plan: r.calibrage,
      carte: r.carte,
      debloquees: r.notions_debloquees,
      prochaine: r.prochaine_notion,
      exerciceSuivant: cockpit.exercices.find((e) => e.notion === r.prochaine_notion)?.id ?? null,
      pseudo,
    };
  }
  const depart = await api.ouvrirTentative(profilId, plan.prochain_exercice_id);
  return { phase: "question", depart: depart as Progression & { exercice: ExercicePublic }, plan, pseudo };
}
