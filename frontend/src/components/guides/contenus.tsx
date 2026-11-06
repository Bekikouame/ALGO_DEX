"use client";

import { ChevronLeft, ChevronRight, Pause, RotateCcw } from "lucide-react";
import { useState } from "react";
import { colorer } from "@/components/code/colorer";
import type { EtapeGuide } from "./visite-guidee";

/** Petite fenêtre de code, aux couleurs de l'éditeur. L'algorithme d'exemple n'appartient pas au test. */
function CodeExemple({ lignes, courante }: { lignes: string[]; courante?: number }) {
  return (
    <div className="rounded-xl bg-[#0b0d29] px-1 py-2 font-mono text-[13px] text-[#e4e6ff]">
      {lignes.map((l, i) => (
        <div key={l} className={`flex gap-2 rounded px-2 py-0.5 ${i === courante ? "bg-[#6c5cfc]/30" : ""}`}>
          <span className="w-4 shrink-0 text-right text-[#9aa1cc]" aria-hidden>
            {i + 1}
          </span>
          <span>{colorer(l)}</span>
        </div>
      ))}
    </div>
  );
}

function Pastilles({ valeurs }: { valeurs: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {valeurs.map((v, i) => (
        <span key={v} className={`rounded-full border px-2.5 py-1 font-medium ${i === 0 ? "border-primary bg-primary text-on-primary" : "border-border text-muted"}`}>
          {v}
        </span>
      ))}
    </div>
  );
}

const EXEMPLE_TEST = ["a ← 3", "b ← a + 1", 'écrire("b vaut", b)'];

export const ETAPES_TEST: EtapeGuide[] = [
  {
    titre: "Commencer le test",
    cible: "commencer",
    texte: (
      <>
        Clique sur <strong className="text-text">Commencer</strong>, choisis un pseudo, puis lance le test. Il n&apos;y a ni note ni chrono : il cherche seulement ton point de départ.
      </>
    ),
    transcription: "Clique sur Commencer, choisis un pseudo, puis lance le test. Il n'y a ni note ni chrono.",
  },
  {
    titre: "Lire, puis prédire",
    texte: (
      <>
        Tu dévoiles l&apos;algorithme ligne par ligne, puis tu cliques sur <strong className="text-text">Je prédis</strong>. Tu saisis la valeur des variables demandées et ce que la console affichera : il n&apos;y a pas de réponse à cocher.
      </>
    ),
    visuel: (
      <div className="flex flex-col gap-2">
        <CodeExemple lignes={EXEMPLE_TEST} />
        <p className="rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs">console : b vaut 4</p>
        <p className="text-xs text-muted">Exemple d&apos;illustration : il ne fait pas partie du test.</p>
      </div>
    ),
    transcription: "Dévoile l'algorithme ligne par ligne, clique sur Je prédis, puis saisis la valeur des variables et ce que la console affichera.",
  },
  {
    titre: "Suivre ta progression",
    texte: "La frise du haut montre où tu en es : quatre notions, deux questions chacune, soit huit questions au plus. Le bouton Quitter te laisse partir : « Continuer le test » te ramène à la question en cours.",
    visuel: <Pastilles valeurs={["Variables", "Conditions", "Boucles", "Tableaux"]} />,
    transcription: "La frise du haut montre quatre notions de deux questions chacune. Tu peux quitter, puis reprendre avec Continuer le test.",
  },
  {
    titre: "Valider tes réponses",
    texte: (
      <>
        <strong className="text-text">Engager ma prédiction</strong> la fige. Tu observes l&apos;exécution, tu compares avec ta prédiction, puis tu cliques sur <strong className="text-text">Valider et continuer</strong>. Deux réponses justes valident la notion ; à la première erreur, le test s&apos;arrête là.
      </>
    ),
    transcription: "Engage ta prédiction, observe l'exécution, compare, puis valide. Deux réponses justes valident une notion ; à la première erreur, le test s'arrête.",
  },
  {
    titre: "Découvrir ton niveau",
    texte: (
      <>
        <strong className="text-text">Découvrir mon résultat</strong> montre les notions démontrées, celle où ton parcours commence et celles qui restent à voir. Tu peux ensuite lancer ton premier exercice.
      </>
    ),
    transcription: "Découvrir mon résultat montre les notions démontrées, la notion de départ et celles qui restent à voir.",
  },
];

const EXEMPLE_PAS = [
  { ligne: 0, variables: "x = 2", console: "", phrase: "x reçoit 2" },
  { ligne: 1, variables: "x = 5", console: "", phrase: "x reçoit 5 : on calcule x + 3 avec l'ancienne valeur" },
  { ligne: 2, variables: "x = 5", console: "x vaut 5", phrase: "la console affiche une ligne" },
];

/** Une exécution d'illustration, à dérouler à la main comme dans le laboratoire. */
function ExempleExecution() {
  const [k, setK] = useState(0);
  const pas = EXEMPLE_PAS[k];
  return (
    <div className="flex flex-col gap-2">
      <CodeExemple lignes={["x ← 2", "x ← x + 3", 'écrire("x vaut", x)']} courante={pas.ligne} />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <p className="rounded-lg bg-surface-2 px-3 py-2">
          <span className="block text-muted">Variables</span>
          <strong className="font-mono">{pas.variables}</strong>
        </p>
        <p className="rounded-lg bg-surface-2 px-3 py-2">
          <span className="block text-muted">Console</span>
          <strong className="font-mono">{pas.console || "(rien)"}</strong>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setK((x) => x - 1)} disabled={k === 0} className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium disabled:opacity-40">
          Pas précédent
        </button>
        <button type="button" onClick={() => setK((x) => x + 1)} disabled={k === EXEMPLE_PAS.length - 1} className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium disabled:opacity-40">
          Pas suivant
        </button>
        <span className="ml-auto font-mono text-xs text-muted">
          pas {k + 1}/{EXEMPLE_PAS.length}
        </span>
      </div>
      <p className="text-xs text-muted" aria-live="polite">
        Ligne {pas.ligne + 1} : {pas.phrase}.
      </p>
    </div>
  );
}

function ApercuCommandes() {
  const bouton = "flex h-8 w-8 items-center justify-center rounded-lg border border-border";
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      <span className={bouton}>
        <RotateCcw size={14} />
      </span>
      <span className={bouton}>
        <ChevronLeft size={15} />
      </span>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
        <Pause size={15} />
      </span>
      <span className={bouton}>
        <ChevronRight size={15} />
      </span>
      <span className="ml-1 font-mono text-xs text-muted">vitesse 1×</span>
    </div>
  );
}

export const ETAPES_ESPACE: EtapeGuide[] = [
  {
    titre: "L'énoncé",
    cible: "enonce",
    texte: "Tout commence ici : ce que ton algorithme doit produire et les données de départ.",
    transcription: "L'énoncé indique ce que ton algorithme doit produire et les données de départ.",
  },
  {
    titre: "L'éditeur d'algorithme",
    cible: "editeur",
    texte: (
      <ul className="flex list-disc flex-col gap-1 pl-4">
        <li>Clique sur <strong className="text-text">+ ta première instruction</strong> et choisis un bloc : tu ne tapes jamais la syntaxe.</li>
        <li>Clique sur chaque partie à compléter pour la remplir.</li>
        <li>Les numéros indiquent les lignes. Le + entre deux lignes en insère une.</li>
        <li>Survole ou touche une ligne pour la monter, la descendre ou la supprimer.</li>
      </ul>
    ),
    transcription: "Compose ton algorithme par blocs, complète chaque partie, insère une ligne avec le plus, puis monte, descends ou supprime les lignes.",
  },
  {
    titre: "Exécuter",
    cible: "executer",
    texte: "La première fois, le laboratoire te demande de prédire le résultat. Si un bloc est incomplet, ou si l'exécution échoue, un message l'explique et la ligne en cause est signalée. Ton algorithme reste figé jusqu'à la comparaison.",
    transcription: "La première exécution demande une prédiction. Un message explique les erreurs et l'algorithme reste figé jusqu'à la comparaison.",
  },
  {
    titre: "La zone de visualisation",
    cible: "laboratoire",
    texte: (
      <ul className="flex list-disc flex-col gap-1 pl-4">
        <li><strong className="text-text">Ce qui vient de se passer</strong> : l&apos;instruction expliquée.</li>
        <li><strong className="text-text">Flux de contrôle</strong> : les conditions et les tours de boucle.</li>
        <li><strong className="text-text">Variables</strong> : leurs valeurs, pas à pas.</li>
        <li><strong className="text-text">Tableaux</strong> : leurs cases, quand ton algorithme en utilise.</li>
        <li><strong className="text-text">Console</strong> : ce qui est affiché.</li>
      </ul>
    ),
    transcription: "Le laboratoire montre l'instruction expliquée, le flux de contrôle, les variables, les tableaux et la console.",
  },
  {
    titre: "Les commandes",
    cible: "commandes",
    secours: "laboratoire",
    texte: "Reviens au début, recule, lance ou mets en pause, avance, ou déplace le curseur. Tu choisis aussi la vitesse, de 0,5× à 4×. Les flèches ← et → du clavier parcourent aussi l'exécution.",
    siAbsente: "Ces commandes apparaissent ici après ta première exécution :",
    visuel: <ApercuCommandes />,
    transcription: "Les commandes reviennent au début, reculent, lancent ou mettent en pause, avancent et règlent la vitesse.",
  },
  {
    titre: "Comprendre une exécution",
    texte: "Essaie : avance pas à pas et regarde la ligne en cours, la valeur de x et la console changer.",
    visuel: <ExempleExecution />,
    transcription: "Dans cet exemple, x reçoit 2, puis 5, puis la console affiche x vaut 5.",
  },
  {
    titre: "L'aide et la suite",
    cible: "aide",
    texte: "Bloqué ? L'Aide propose des indices, marche par marche. Après l'exécution, compare avec ta prédiction, corrige si besoin, puis valide ta solution.",
    transcription: "L'Aide propose des indices. Compare ensuite avec ta prédiction, corrige si besoin, puis valide ta solution.",
  },
];
