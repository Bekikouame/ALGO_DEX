"use client";

import { ArrowRight, Check, Pause, Play, RotateCcw, StepForward, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageErreur } from "@/components/coque";
import { AideConsole } from "@/components/cycle/prediction";
import { Mascotte } from "@/components/marque";
import { ecrireSaisie, lireSaisie } from "@/lib/profils";
import {
  api,
  LIBELLES_NOTION,
  type Comparaison,
  type Etape,
  type Execution,
  type ExercicePublic,
  type LignePseudo,
  type PlanCascade,
  type PointControle,
  type Prediction,
  type Progression,
  type Tentative,
} from "@/lib/api";
import { afficherValeur, decrireMoment } from "@/lib/format";
import { tableauxEcrits } from "./analyse";
import { CocheTracee, Ecart, IconeObserver, IconePredire } from "./icones";
import { Console, FenetreCode, FilDesPhases, Scene } from "./scenes";

type Phase = "lire" | "predire" | "observer" | "comparer";
const ORDRE: Phase[] = ["lire", "predire", "observer", "comparer"];

const RANG: Etape[] = ["ecrit", "predite", "visualisee", "comparee", "corrigee", "reussie"];
const avant = (t: Tentative, e: Etape) => RANG.indexOf(t.etape_atteinte) < RANG.indexOf(e);

// Une question reprise reprend là où le moteur l'a laissée.
function phaseDeReprise(t: Tentative): Phase {
  if (!t.prediction) return "lire";
  return avant(t, "comparee") ? "observer" : "comparer";
}

// Ce que la question invite à regarder : jamais la réponse.
const REGARDER: Record<string, string> = {
  variables: "Une variable ne garde que sa dernière valeur.",
  conditions: "Un seul chemin est pris à chaque embranchement.",
  boucles: "Compte les tours un par un.",
  tableaux: "Les cases sont numérotées à partir de 0.",
};

const DUREE_PAS = 750;
const mouvementReduit = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Une question du test de niveau, en quatre scènes : lire, prédire, observer, comparer.
 * Le moteur impose cet ordre (CDC-2) et rend le verdict ; ici, on met en scène et on transmet.
 */
export function QuestionTest({
  depart,
  rang,
  total,
  onTerminee,
}: {
  depart: Progression & { exercice: ExercicePublic };
  rang: number;
  total: number;
  onTerminee: (juste: boolean, plan: PlanCascade) => void;
}) {
  const exercice = depart.exercice;
  const lignes = exercice.lignes ?? [];
  const [tentative, setTentative] = useState(depart.tentative);
  const [phase, setPhase] = useState<Phase>(() => phaseDeReprise(depart.tentative));
  const [execution, setExecution] = useState<Execution | null>(null);
  const [comparaison, setComparaison] = useState<Comparaison | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  async function action(f: () => Promise<void>) {
    setErreur(null);
    setOccupe(true);
    try {
      await f();
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setOccupe(false);
    }
  }

  // Prédire, puis lancer l'exécution réelle (la visualisation n'est permise qu'après la prédiction).
  const engager = (p: Prediction) =>
    action(async () => {
      const r = await api.predire(tentative.id, p);
      setTentative(r.tentative);
      const ex = await api.executer(tentative.id);
      setExecution(ex);
      setTentative(ex.tentative);
      setPhase("observer");
    });

  const comparer = () =>
    action(async () => {
      const r = await api.comparer(tentative.id);
      setComparaison(r.resultat ?? null);
      setTentative(r.tentative);
      setPhase("comparer");
    });

  const valider = () =>
    action(async () => {
      const r = await api.soumettre(tentative.id);
      setTentative(r.tentative);
      const resultat = r.resultat;
      if (resultat && "prediction_juste" in resultat && r.calibrage) onTerminee(resultat.prediction_juste, r.calibrage);
    });

  // Reprise : on redemande au moteur l'exécution ou la comparaison déjà atteinte (une seule fois).
  const repris = useRef(false);
  useEffect(() => {
    if (repris.current) return;
    repris.current = true;
    const id = depart.tentative.id;
    if (phase === "observer") {
      api
        .executer(id)
        .then((r) => {
          setExecution(r);
          setTentative(r.tentative);
        })
        .catch((e) => setErreur(e.message));
    } else if (phase === "comparer") {
      api
        .comparer(id)
        .then((r) => {
          setComparaison(r.resultat ?? null);
          setTentative(r.tentative);
        })
        .catch((e) => setErreur(e.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pb-12 pt-6 sm:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="-rotate-2 font-hand text-2xl leading-6 text-rose">
            {LIBELLES_NOTION[exercice.notion]} · question {rang} sur {total}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">{exercice.titre}</h1>
          <p className="mt-2 max-w-xl whitespace-pre-line text-muted">{exercice.enonce}</p>
        </div>
        <FilDesPhases courante={ORDRE.indexOf(phase)} />
      </div>

      {erreur && (
        <div className="mt-6">
          <MessageErreur message={erreur} />
        </div>
      )}

      <div key={phase} className="scene-entree mt-8">
        {phase === "lire" && <LectureGuidee exercice={exercice} lignes={lignes} onFin={() => setPhase("predire")} />}

        {phase === "predire" && (
          <ScenePrincipale exercice={exercice} lignes={lignes}>
            <SaisiePrediction cle={exercice.id} points={exercice.points_controle} lignes={lignes} enCours={occupe} onEngager={engager} />
          </ScenePrincipale>
        )}

        {phase === "observer" &&
          (execution ? (
            <Lecteur key={execution.trace.length} execution={execution} exercice={exercice} prediction={tentative.prediction}>
              <Action onClick={comparer} enCours={occupe} icone={<ArrowRight size={18} />}>
                Comparer avec ma prédiction
              </Action>
            </Lecteur>
          ) : (
            !erreur && <Attente>Le moteur exécute l&apos;algorithme…</Attente>
          ))}

        {phase === "comparer" &&
          (comparaison ? (
            <ScenePrincipale exercice={exercice} lignes={lignes}>
              <Revelation comparaison={comparaison} />
              <Action onClick={valider} enCours={occupe} icone={<ArrowRight size={18} />}>
                Valider et continuer
              </Action>
            </ScenePrincipale>
          ) : (
            !erreur && <Attente>Le moteur compare ta prédiction à la réalité…</Attente>
          ))}
      </div>
    </div>
  );
}

/** Code à gauche, scène de la notion à droite ; sur téléphone, l'un sous l'autre. */
function ScenePrincipale({ exercice, lignes, children }: { exercice: ExercicePublic; lignes: LignePseudo[]; children: React.ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <FenetreCode titre={exercice.titre} lignes={lignes} />
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
}

function Action({
  onClick,
  enCours = false,
  desactive = false,
  pret = false,
  icone,
  children,
}: {
  onClick?: () => void;
  enCours?: boolean;
  desactive?: boolean;
  pret?: boolean;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={enCours || desactive}
      className={`bouton-lumineux flex items-center justify-center gap-2 self-start rounded-xl px-6 py-3.5 font-semibold text-white transition-opacity disabled:opacity-50 ${
        pret && !enCours ? "bouton-pret" : ""
      }`}
    >
      {enCours ? "Un instant…" : children} {!enCours && icone}
    </button>
  );
}

function Attente({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-16" role="status">
      <Mascotte taille={72} className="mystere" />
      <p className="font-hand text-2xl text-lavande">{children}</p>
    </div>
  );
}

/**
 * Prédire : un tiroir par point de contrôle (des cases pour un tableau), puis la console.
 * Les réponses partent telles quelles au moteur, qui sait lire « 13.5 », « vrai » ou « [4, 10, 15] ».
 */
function SaisiePrediction({
  cle,
  points,
  lignes,
  enCours,
  onEngager,
}: {
  cle: string;
  points: PointControle[];
  lignes: LignePseudo[];
  enCours: boolean;
  onEngager: (p: Prediction) => void;
}) {
  const tableaux = tableauxEcrits(lignes);
  // La saisie survit à une actualisation de la page, jusqu'à ce que la prédiction soit engagée.
  const [depart] = useState(() => lireSaisie<{ valeurs: Record<string, string>; cases: Record<string, string[]>; sortie: string }>(cle));
  const [valeurs, setValeurs] = useState<Record<string, string>>(depart?.valeurs ?? {});
  const [cases, setCases] = useState<Record<string, string[]>>(depart?.cases ?? {});
  const [sortie, setSortie] = useState(depart?.sortie ?? "");
  useEffect(() => {
    ecrireSaisie(cle, { valeurs, cases, sortie });
  }, [cle, valeurs, cases, sortie]);
  const enTableau = (p: PointControle) => (tableaux[p.variable] ?? 0) > 0;
  const valeurDe = (p: PointControle) =>
    enTableau(p) ? `[${(cases[p.id] ?? []).map((c) => c.trim()).join(", ")}]` : (valeurs[p.id] ?? "").trim();
  const remplie = (p: PointControle) =>
    enTableau(p)
      ? Array.from({ length: tableaux[p.variable] }, (_, n) => (cases[p.id]?.[n] ?? "").trim()).every(Boolean)
      : valeurDe(p) !== "";
  const complet = points.every(remplie) && sortie.trim() !== "";

  function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!complet) return;
    ecrireSaisie(cle, null);
    onEngager({ points: Object.fromEntries(points.map((p) => [p.id, valeurDe(p)])), sortie: sortie.split("\n") });
  }

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-6">
      <div>
        <h2 className="flex items-center gap-3 font-display text-3xl">
          <IconePredire taille={40} /> Prédis avant de voir
        </h2>
        <p className="mt-1 text-sm text-muted">
          Déroule l&apos;algorithme dans ta tête. Une prédiction fausse n&apos;est pas un échec : c&apos;est ce qui place
          ton point de départ.
        </p>
      </div>

      {points.map((p, n) => (
        <fieldset
          key={p.id}
          className="revele rounded-2xl border-2 border-dashed border-lavande/50 bg-surface/60 p-4"
          style={{ animationDelay: `${n * 120}ms` }}
        >
          <legend className="px-2 font-mono text-lg font-semibold text-lavande">{p.variable}</legend>
          <p className="font-medium">{p.question}</p>
          <p className="mb-3 text-xs text-muted">{decrireMoment(p.moment, p.variable)}</p>
          {enTableau(p) ? (
            <div className="flex flex-wrap items-end gap-2">
              {Array.from({ length: tableaux[p.variable] }, (_, c) => (
                <label key={c} className="flex flex-col items-center gap-1">
                  <input
                    value={cases[p.id]?.[c] ?? ""}
                    onChange={(e) =>
                      setCases((tout) => {
                        const ligne = [...(tout[p.id] ?? Array(tableaux[p.variable]).fill(""))];
                        ligne[c] = e.target.value;
                        return { ...tout, [p.id]: ligne };
                      })
                    }
                    aria-label={`${p.variable}[${c}]`}
                    inputMode="decimal"
                    autoComplete="off"
                    className="h-14 w-14 rounded-2xl border-2 border-border bg-bg/70 text-center font-display text-2xl outline-none focus:border-primary"
                  />
                  <span className="font-mono text-[11px] text-muted">{c}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              value={valeurs[p.id] ?? ""}
              onChange={(e) => setValeurs((v) => ({ ...v, [p.id]: e.target.value }))}
              aria-label={p.question}
              autoComplete="off"
              placeholder="?"
              className="w-full max-w-xs rounded-2xl border-2 border-border bg-bg/70 px-4 py-3 text-center font-display text-3xl outline-none placeholder:text-muted/60 focus:border-primary"
            />
          )}
        </fieldset>
      ))}

      <label className="block">
        <span className="mb-2 block -rotate-1 font-hand text-xl text-lavande">et la console affichera…</span>
        <AideConsole />
        <textarea
          value={sortie}
          onChange={(e) => setSortie(e.target.value)}
          rows={3}
          placeholder={"1re ligne affichée\n2e ligne affichée"}
          className="w-full rounded-2xl border-2 border-[#4b43b8]/60 bg-[#0b0d29] px-4 py-3 font-mono text-[#e4e6ff] outline-none placeholder:text-white/30 focus:border-[#8b7bff]"
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <Action enCours={enCours} desactive={!complet} pret={complet} icone={<ArrowRight size={18} />}>
          Engager ma prédiction
        </Action>
        <span className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
          <span className="flex gap-1" aria-hidden>
            {[...points.map(remplie), sortie.trim() !== ""].map((ok, n) => (
              <span key={n} className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${ok ? "bg-menthe" : "bg-border"}`} />
            ))}
          </span>
          {complet ? "Tout est prêt : engage ta prédiction." : `${points.filter(remplie).length + (sortie.trim() ? 1 : 0)} / ${points.length + 1} prêts`}
        </span>
      </div>
    </form>
  );
}

/** Observer : la trace réelle du moteur, rejouée pas à pas sur la scène de la notion. */
function Lecteur({
  execution,
  exercice,
  prediction,
  children,
}: {
  execution: Execution;
  exercice: ExercicePublic;
  prediction: Prediction | null;
  children: React.ReactNode;
}) {
  const { trace, erreur } = execution;
  const dernier = Math.max(trace.length - 1, 0);
  const [k, setK] = useState(0);
  const [lecture, setLecture] = useState(true);
  const [manuel, setManuel] = useState(false);
  const enLecture = lecture && k < dernier;

  useEffect(() => {
    if (!enLecture || (!manuel && mouvementReduit())) return;
    const minuteur = setTimeout(() => setK((x) => Math.min(x + 1, dernier)), DUREE_PAS);
    return () => clearTimeout(minuteur);
  }, [enLecture, manuel, k, dernier]);

  const pas = trace[k];
  const precedent = k > 0 ? trace[k - 1].variables : exercice.entrees;
  const vues = new Set(trace.slice(0, k + 1).map((p) => p.ligne));
  const console_ = trace.slice(0, k + 1).flatMap((p) => (p.ecrit !== null ? [p.ecrit] : []));
  const fin = k === dernier;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
      <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <FenetreCode titre={exercice.titre} lignes={execution.lignes} courante={pas?.ligne} vues={vues} />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setManuel(true);
              if (enLecture) return setLecture(false);
              if (fin) setK(0);
              setLecture(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface/70 px-3 py-1.5 text-sm font-medium"
          >
            {enLecture ? <Pause size={15} /> : fin ? <RotateCcw size={15} /> : <Play size={15} />}
            {enLecture ? "Pause" : fin ? "Revoir" : "Lecture"}
          </button>
          <button
            type="button"
            onClick={() => {
              setManuel(true);
              setLecture(false);
              setK((x) => Math.min(x + 1, dernier));
            }}
            disabled={fin}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface/70 px-3 py-1.5 text-sm font-medium disabled:opacity-40"
          >
            <StepForward size={15} /> Pas suivant
          </button>
          <div
            role="progressbar"
            aria-label="Progression de l'exécution"
            aria-valuemin={1}
            aria-valuemax={trace.length}
            aria-valuenow={k + 1}
            className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-border"
          >
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-menthe transition-[width] duration-500" style={{ width: `${((k + 1) / Math.max(trace.length, 1)) * 100}%` }} />
          </div>
          <span className="font-mono text-xs text-muted">
            {k + 1}/{trace.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-3">
          <IconeObserver taille={40} className="shrink-0" />
          <p aria-live="polite" key={k} className="revele -rotate-1 font-hand text-2xl leading-7 text-lavande">
            {pas?.description ?? "Rien à exécuter."}
          </p>
        </div>
        <Scene notion={exercice.notion} lignes={execution.lignes} vars={pas?.variables ?? {}} precedent={precedent} vues={vues} trace={trace} k={k} />
        <Console lignes={console_} />
        {fin && erreur && (
          <div role="alert" className="flex gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">Arrêt{erreur.ligne ? ` à la ligne ${erreur.ligne}` : ""}</div>
              <div>{erreur.message}</div>
            </div>
          </div>
        )}
        {prediction && (
          <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm">
            <div className="mb-1 font-hand text-lg text-rose">ta prédiction</div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono">
              {exercice.points_controle.map((p) => (
                <span key={p.id}>
                  {p.variable} = <strong>{afficherValeur(prediction.points[p.id])}</strong>
                </span>
              ))}
              <span>console : <strong>{prediction.sortie.join(" / ") || "—"}</strong></span>
            </div>
          </div>
        )}
        <div className={fin ? "revele" : ""}>{children}</div>
      </div>
    </div>
  );
}

/** Comparer : chaque tiroir se retourne, prédiction contre réalité, verdict du moteur. */
function Revelation({ comparaison }: { comparaison: Comparaison }) {
  const juste = comparaison.tout_juste;
  return (
    <div className="flex flex-col gap-5">
      <div className="revele flex items-center gap-3">
        <span className="relative shrink-0">
          {juste ? <CocheTracee taille={60} /> : <Ecart taille={60} />}
          {juste && <Etincelles />}
        </span>
        <div>
          <h2 className="font-display text-3xl">{juste ? "Prédiction juste" : "Il y a un écart"}</h2>
          <p className="text-sm text-muted">
            {juste ? "Ta trace mentale suit exactement l'exécution." : "Repère où ta trace s'est écartée de l'exécution."}
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {comparaison.points.map((p, n) => (
          <li
            key={p.id}
            className={`revele rounded-2xl border-2 px-4 py-3 ${p.juste ? "border-menthe/50 bg-menthe/5" : "border-rose/50 bg-rose/5"}`}
            style={{ animationDelay: `${200 + n * 250}ms` }}
          >
            <div className="text-sm">{p.question}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
              <span className="text-muted">
                prédit <strong className="text-text">{afficherValeur(p.predit)}</strong>
              </span>
              <ArrowRight size={14} className="text-muted" aria-hidden />
              <span className="text-muted">
                réel <strong className={p.juste ? "text-menthe" : "text-rose"}>{p.atteint ? afficherValeur(p.reel) : "non atteint"}</strong>
              </span>
              {p.juste ? <Check size={18} className="text-menthe" aria-label="juste" /> : <X size={18} className="text-rose" aria-label="écart" />}
            </div>
          </li>
        ))}
        {comparaison.sortie_valeurs_seules && (
          <li className="revele rounded-2xl border border-menthe/50 bg-menthe/5 px-4 py-3 text-sm">
            Tes valeurs sont justes. Regarde la colonne « réel » : la console affiche aussi le texte prévu par l&apos;algorithme.
          </li>
        )}
        {comparaison.console.map((c, n) => (
          <li
            key={`c${c.numero}`}
            className={`revele rounded-2xl border-2 px-4 py-3 ${c.juste ? "border-menthe/50 bg-menthe/5" : "border-rose/50 bg-rose/5"}`}
            style={{ animationDelay: `${200 + (comparaison.points.length + n) * 250}ms` }}
          >
            <div className="text-sm">Console, ligne {c.numero}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
              <span className="text-muted">
                prédit <strong className="text-text">{c.predite ?? "—"}</strong>
              </span>
              <ArrowRight size={14} className="text-muted" aria-hidden />
              <span className="text-muted">
                réel <strong className={c.juste ? "text-menthe" : "text-rose"}>{c.reelle ?? "—"}</strong>
              </span>
              {c.juste ? <Check size={18} className="text-menthe" aria-label="juste" /> : <X size={18} className="text-rose" aria-label="écart" />}
            </div>
          </li>
        ))}
      </ul>
      {comparaison.erreur && <MessageErreur message={comparaison.erreur.message} />}
    </div>
  );
}

/** Une gerbe d'étincelles autour du verdict juste. */
function Etincelles() {
  const eclats = [
    [-34, -26], [34, -28], [-40, 6], [42, 4], [-26, 34], [28, 32], [0, -40], [4, 42],
  ];
  return (
    <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
      {eclats.map(([dx, dy], n) => (
        <span
          key={n}
          className={`eclat absolute h-2 w-2 rounded-full ${n % 2 ? "bg-rose" : "bg-menthe"}`}
          style={{ "--dx": `${dx}px`, "--dy": `${dy}px`, animationDelay: `${300 + n * 40}ms` } as React.CSSProperties}
        />
      ))}
    </span>
  );
}

/** Ce que fait une ligne, pour savoir où regarder : jamais la valeur qu'elle produira. */
function expliquer(texte: string): string {
  const t = texte.trim();
  let m: RegExpMatchArray | null;
  if ((m = t.match(/^([A-Za-z_]\w*)\s*←\s*\[(.*)\]$/)))
    return `Un tableau ${m[1]} : ${m[2].split(",").length} cases, numérotées à partir de 0.`;
  if ((m = t.match(/^([A-Za-z_]\w*)\[(.+?)\]\s*←/))) return `Une seule case de ${m[1]} change : celle d'indice ${m[2]}.`;
  if ((m = t.match(/^([A-Za-z_]\w*)\s*←/))) return `Affectation : la valeur de droite est calculée, puis rangée dans le tiroir ${m[1]}.`;
  if (t.startsWith("si ")) return "Un embranchement : selon la condition, un seul des deux chemins sera pris.";
  if (t === "sinon") return "Le chemin « sinon » : pris seulement si la condition est fausse.";
  if ((m = t.match(/^pour (\w+) de (.+) à (.+) faire$/))) return `Une boucle : le corps se répète pour ${m[1]} allant de ${m[2]} à ${m[3]}.`;
  if (t.startsWith("tant que ")) return "Une boucle : le corps se répète tant que la condition reste vraie.";
  if (t.startsWith("fin")) return "Fin du bloc : on revient au niveau du dessus.";
  if (t.startsWith("écrire")) return "écrire affiche une ligne dans la console : le texte entre guillemets tel quel, et la valeur des variables.";
  return "Lis cette ligne attentivement.";
}

/**
 * Lire, sans pouvoir sauter : le code se dévoile ligne par ligne (clic sur la ligne qui brille, ou Entrée),
 * la scène se construit au fil de la lecture, et « Je prédis » ne s'ouvre qu'une fois tout lu.
 */
function LectureGuidee({ exercice, lignes, onFin }: { exercice: ExercicePublic; lignes: LignePseudo[]; onFin: () => void }) {
  const [lues, setLues] = useState(0);
  const fini = lues >= lignes.length;
  const revelees = new Set(lignes.slice(0, lues).map((l) => l.ligne));
  const derniere = lues > 0 ? lignes[lues - 1] : null;
  const lire = () => setLues((n) => Math.min(n + 1, lignes.length));

  // Entrée ou ↓ dévoile la ligne suivante (sauf quand le focus est sur un bouton, qui a son propre Entrée).
  useEffect(() => {
    if (fini) return;
    const touche = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== "ArrowDown") return;
      if (e.target instanceof HTMLElement && e.target.closest("button, a, input, textarea")) return;
      e.preventDefault();
      setLues((n) => Math.min(n + 1, lignes.length));
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [fini, lignes.length]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
      <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <FenetreCode titre={exercice.titre} lignes={lignes} revelees={revelees} onLire={lire} />
        <div className="flex flex-wrap items-center gap-3">
          {!fini && (
            <button
              type="button"
              onClick={lire}
              className="flex items-center gap-2 rounded-lg border border-rose/50 bg-rose/10 px-3 py-1.5 text-sm font-medium transition-colors hover:border-rose"
            >
              Lire la ligne suivante <kbd className="rounded border border-border px-1.5 font-mono text-[11px] text-muted">Entrée</kbd>
            </button>
          )}
          <div className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-border" aria-hidden>
            <div className="h-full rounded-full bg-gradient-to-r from-rose to-primary transition-[width] duration-500" style={{ width: `${(lues / Math.max(lignes.length, 1)) * 100}%` }} />
          </div>
          <span className="font-mono text-xs text-muted" aria-live="polite">
            {lues}/{lignes.length} lignes lues
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {derniere ? (
          <div key={derniere.ligne} className="revele flex items-start gap-3" aria-live="polite">
            <span className="mt-1 shrink-0 rounded-lg bg-[#0b0d29] px-2 py-1 font-mono text-xs text-[#e4e6ff]">ligne {derniere.ligne}</span>
            <p className="-rotate-1 font-hand text-2xl leading-7 text-lavande">{expliquer(derniere.texte)}</p>
          </div>
        ) : (
          <p className="-rotate-1 font-hand text-2xl leading-7 text-lavande">
            Le code est caché. Dévoile-le ligne par ligne : la scène va se construire sous tes yeux.
          </p>
        )}

        {lues > 0 && <Scene notion={exercice.notion} lignes={lignes.slice(0, lues)} />}

        {fini && (
          <div className="revele flex flex-col gap-4">
            <p className="flex items-center gap-2 text-sm text-muted">
              <Check size={16} className="text-menthe" /> Tout est lu. {REGARDER[exercice.notion]}
            </p>
            <div className="flex items-end gap-3">
              <Mascotte taille={64} className="shrink-0" />
              <p className="mb-2 rounded-2xl rounded-bl-sm border border-primary/45 bg-surface/85 px-4 py-2.5 text-sm shadow-card">
                À toi : que va faire cet algorithme&nbsp;?
              </p>
            </div>
            <Action onClick={onFin} pret icone={<ArrowRight size={18} />}>
              Je prédis
            </Action>
          </div>
        )}
      </div>
    </div>
  );
}
