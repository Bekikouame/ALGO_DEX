"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Coque, MessageErreur } from "@/components/coque";
import { AtelierAlgo } from "@/components/espace/illustrations";
import {
  Annotation,
  AutresExplorations,
  ExperienceEnCours,
  MaProgression,
  Motivation,
  ProchaineEtape,
  type Experience,
} from "@/components/espace/sections";
import { api, type Cockpit, type Etape } from "@/lib/api";
import { lireBrouillon, useProfilActif } from "@/lib/profils";

// Étapes franchies dans un exercice, d'après l'étape que le moteur a enregistrée.
const ETAPES_FAITES: Record<Etape, number> = { ecrit: 0, predite: 2, visualisee: 3, comparee: 4, corrigee: 4, reussie: 5 };

/** La dernière activité réelle : le test s'il n'est pas fini, sinon l'exercice commencé, sinon le recommandé. */
async function experienceDe(cockpit: Cockpit): Promise<Experience> {
  if (cockpit.calibrage.statut !== "terminee") return { sorte: "test", plan: cockpit.calibrage };
  const exercice =
    cockpit.exercices.find((e) => e.tentative_en_cours) ??
    cockpit.exercices.find((e) => e.notion === cockpit.prochaine_notion && e.accessible);
  if (!exercice) return { sorte: "fini" };
  if (!exercice.tentative_en_cours) return { sorte: "exercice", exercice, faites: 0 };
  const { tentative } = await api.tentative(exercice.tentative_en_cours);
  const faites = ETAPES_FAITES[tentative.etape_atteinte];
  // Avant la prédiction, le moteur ne connaît pas encore les blocs : le brouillon de l'appareil dit si l'écriture a commencé.
  const ecrit = (lireBrouillon<unknown[]>(exercice.tentative_en_cours) ?? []).length > 0;
  return { sorte: "exercice", exercice, faites: faites === 0 && ecrit ? 1 : faites };
}

/**
 * Sur ordinateur, l'espace tient dans un écran, comme la maquette : s'il est plus haut que la fenêtre,
 * il est réduit proportionnellement (zoom CSS, texte net), sans descendre sous 70 % pour rester lisible.
 */
function useTenirDansLEcran(pret: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!pret || !el) return;
    let essais = 0;
    let image = 0;
    // On mesure, on corrige, et on recommence tant que ça bouge : polices et illustrations arrivent après coup.
    const ajuster = () => {
      if (window.innerWidth < 1280) return setZoom(1);
      const actuel = Number(getComputedStyle(el).zoom) || 1;
      const boite = el.getBoundingClientRect(); // dimensions déjà zoomées
      const voulu = Math.max(0.7, Math.min(1, actuel * ((window.innerHeight - boite.top - 20) / boite.height)));
      if (Math.abs(actuel - voulu) > 0.004) {
        setZoom(voulu);
        if (essais++ < 8) image = requestAnimationFrame(ajuster);
      }
    };
    const relancer = () => {
      essais = 0;
      cancelAnimationFrame(image);
      ajuster();
    };
    relancer();
    const observateur = new ResizeObserver(relancer);
    observateur.observe(el);
    window.addEventListener("resize", relancer);
    document.fonts?.ready.then(relancer);
    return () => {
      cancelAnimationFrame(image);
      observateur.disconnect();
      window.removeEventListener("resize", relancer);
    };
  }, [pret]);
  return { ref, zoom };
}

/** Mon espace : l'accueil personnalisé de l'apprenant, alimenté par le cockpit du moteur. */
export default function MonEspace() {
  const profilId = useProfilActif();
  const [donnees, setDonnees] = useState<{ cockpit: Cockpit; experience: Experience } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [essai, setEssai] = useState(0);
  const { ref, zoom } = useTenirDansLEcran(!!donnees);

  // Relancé à chaque retour sur la page (Next la garde en mémoire) : on montre toujours l'état du moteur.
  useEffect(() => {
    if (!profilId) return;
    api
      .cockpit(profilId)
      .then(async (cockpit) => ({ cockpit, experience: await experienceDe(cockpit) }))
      .then(setDonnees)
      .catch((e) => setErreur(e.message));
  }, [profilId, essai]);

  if (erreur) {
    return (
      <Coque>
        <div className="py-16">
          <MessageErreur message={erreur} />
          <button
            type="button"
            onClick={() => {
              setErreur(null);
              setEssai((n) => n + 1);
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary"
          >
            <RotateCcw size={16} /> Réessayer
          </button>
        </div>
      </Coque>
    );
  }

  if (!donnees) return <Squelette />;

  const { cockpit, experience } = donnees;
  const pseudo = cockpit.profil.pseudo;
  const courante = experience.sorte === "exercice" ? experience.exercice.notion : null;

  return (
    <Coque pseudo={pseudo} enTeteFlottant>
      {/* Comme la maquette, tout l'espace tient dans un écran : les hauteurs suivent celle de la fenêtre. */}
      <div ref={ref} style={{ zoom }} className="grid gap-x-7 gap-y-[clamp(0.75rem,2vh,1.4rem)] xl:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="relative flex items-center justify-between gap-6 xl:col-span-2">
          <div className="scene-entree min-w-0">
            <Annotation fleche="bas" className="-ml-1 text-lg">
              ton espace de travail
            </Annotation>
            <h1 className="font-display text-4xl leading-tight xl:text-[clamp(2.2rem,4.4vh,2.75rem)]">Bonjour {pseudo},</h1>
            <p className="texte-degrade font-display text-2xl leading-tight xl:text-[clamp(1.7rem,3.5vh,2.15rem)]">
              Prêt à faire évoluer ton raisonnement&nbsp;?
            </p>
            <p className="mt-[clamp(0.4rem,1.2vh,0.9rem)] max-w-lg text-[15px] text-muted">
              Ici, tu n&apos;apprends pas seulement des algorithmes.
              <br />
              Tu les observes, tu les manipules, tu les fais vivre.
            </p>
          </div>
          <div className="relative hidden shrink-0 md:block">
            <Annotation fleche="droite" className="absolute -left-36 top-2 z-10 hidden max-w-[10rem] text-lg xl:inline-flex">
              chaque étape te rapproche de ta prochaine notion&nbsp;!
            </Annotation>
            <AtelierAlgo className="aspect-[8/5] h-[clamp(9rem,24vh,15rem)] w-auto" />
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-[clamp(0.9rem,2.4vh,1.75rem)]">
          <ExperienceEnCours experience={experience} />
          <AutresExplorations exercices={cockpit.exercices} carte={cockpit.carte} courante={courante} prochaine={cockpit.prochaine_notion} />
          <p className="flex items-center gap-2 font-hand text-lg text-primary">
            <svg width="56" height="18" viewBox="0 0 56 18" aria-hidden>
              <path d="M2 12 C 10 2, 16 18, 24 8 S 40 4, 54 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Ton aventure algorithmique ne fait que commencer…
          </p>
        </div>

        <aside className="flex flex-col gap-[clamp(0.6rem,1.6vh,1rem)]" aria-label="Ma progression et la suite">
          <MaProgression carte={cockpit.carte} debloquees={cockpit.notions_debloquees} recompenses={cockpit.recompenses.length} />
          <ProchaineEtape cockpit={cockpit} />
          <Motivation />
        </aside>
      </div>
    </Coque>
  );
}

/** Pendant le chargement : la silhouette de la page, sans fausses données. */
function Squelette() {
  const bloc = "animate-pulse rounded-[1.75rem] bg-border/50";
  return (
    <Coque enTeteFlottant>
      <div className="flex flex-col gap-12" role="status" aria-label="Chargement de ton espace">
        <div className="flex flex-col gap-3">
          <div className={`${bloc} h-12 w-80 max-w-full`} />
          <div className={`${bloc} h-9 w-[30rem] max-w-full`} />
        </div>
        <div className={`${bloc} h-72`} />
        <div className={`${bloc} h-80`} />
      </div>
    </Coque>
  );
}
