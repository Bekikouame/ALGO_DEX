"use client";

import { Compass, Gauge, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Coque, MessageErreur } from "@/components/coque";
import { AtelierAlgo } from "@/components/espace/illustrations";
import {
  Annotation,
  AutresExplorations,
  CodeReprise,
  ExperienceEnCours,
  MaProgression,
  Motivation,
  ProchaineEtape,
  type Experience,
} from "@/components/espace/sections";
import { api, LIBELLES_NOTION, type Cockpit, type Etape } from "@/lib/api";
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

/** Mon espace : l'accueil personnalisé de l'apprenant, alimenté par le cockpit du moteur. */
export default function MonEspace() {
  const profilId = useProfilActif();
  const [donnees, setDonnees] = useState<{ cockpit: Cockpit; experience: Experience } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [essai, setEssai] = useState(0);

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
      {/* La page défile naturellement : la barre latérale reste fixe, la zone principale défile seule. */}
      <div className="grid gap-section xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="relative grid items-center gap-section xl:col-span-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
          <div className="scene-entree min-w-0">
            <Annotation fleche="bas" className="-ml-1 text-xl">
              ton espace de travail
            </Annotation>
            <h1 className="font-display text-[2.75rem] leading-[1.05] sm:text-[3.4rem]">Bonjour {pseudo},</h1>
            <p className="texte-degrade mt-1 font-display text-[1.9rem] leading-tight sm:text-[2.5rem]">Prêt à faire évoluer ton raisonnement&nbsp;?</p>
            <p className="mt-titre max-w-xl text-[17px] leading-relaxed text-text/70">
              Ici, tu n&apos;apprends pas seulement des algorithmes. Tu les observes, tu les manipules, tu les fais vivre.
            </p>
            <ul className="mt-bloc flex flex-wrap gap-2.5 text-[15px]">
              <li className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2">
                <Gauge size={17} className="text-primary" />
                Test de niveau&nbsp;: <strong className="font-semibold">{cockpit.calibrage.statut === "terminee" ? "terminé" : cockpit.calibrage.statut === "en_cours" ? "en cours" : "à faire"}</strong>
              </li>
              <li className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2">
                <Compass size={17} className="text-primary" />
                {cockpit.prochaine_notion ? (
                  <>
                    Notion du moment&nbsp;: <strong className="font-semibold">{LIBELLES_NOTION[cockpit.prochaine_notion]}</strong>
                  </>
                ) : (
                  <strong className="font-semibold">Toutes les notions sont au vert</strong>
                )}
              </li>
            </ul>
          </div>
          <div className="relative hidden md:block lg:mt-10">
            <AtelierAlgo className="w-full" />
            <Annotation fleche="droite" className="absolute -left-10 bottom-0 z-10 hidden max-w-[11rem] text-xl xl:inline-flex">
              chaque étape te rapproche de ta prochaine notion&nbsp;!
            </Annotation>
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-section">
          <ExperienceEnCours experience={experience} />
          <AutresExplorations exercices={cockpit.exercices} carte={cockpit.carte} courante={courante} prochaine={cockpit.prochaine_notion} />
          <p className="flex items-center gap-2 font-hand text-xl text-primary">
            <svg width="56" height="18" viewBox="0 0 56 18" aria-hidden>
              <path d="M2 12 C 10 2, 16 18, 24 8 S 40 4, 54 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Ton aventure algorithmique ne fait que commencer…
          </p>
        </div>

        <aside className="flex flex-col gap-bloc" aria-label="Ma progression et la suite">
          <MaProgression carte={cockpit.carte} debloquees={cockpit.notions_debloquees} recompenses={cockpit.recompenses.length} />
          <ProchaineEtape cockpit={cockpit} />
          <Motivation />
          <CodeReprise profilId={cockpit.profil.id} />
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
