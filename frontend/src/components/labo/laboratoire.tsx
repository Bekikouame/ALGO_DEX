"use client";

import { ArrowLeft, ArrowRight, Check, CircleHelp, Eraser, Lock, Play, Scale, Wrench, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EditeurBlocs, type SuiviExecution } from "@/components/blocs/editeur";
import { MessageErreur } from "@/components/coque";
import { EcranComparaison } from "@/components/cycle/comparaison";
import { EchelleIndices } from "@/components/cycle/indices";
import { FormulairePrediction } from "@/components/cycle/prediction";
import { RobotAlgo } from "@/components/espace/illustrations";
import { Avatar } from "@/components/marque";
import { BasculeTheme } from "@/components/theme";
import {
  api,
  LIBELLES_NOTION,
  type Comparaison,
  type Etape,
  type Execution,
  type ExercicePublic,
  type Prediction,
  type Progression,
  type Soumission,
  type Tentative,
} from "@/lib/api";
import { compterBlocs, variablesConnues, type Bloc } from "@/lib/blocs";
import { afficherValeur } from "@/lib/format";
import { ecrireBrouillon, lireBrouillon } from "@/lib/profils";
import { BarreControle, CeQuiSePasse, Console, ExplorateurVariables, FluxControle, StructuresDonnees, type Commandes } from "./execution";

type VueDroite = "prediction" | "execution" | "comparaison";

const RANG: Etape[] = ["ecrit", "predite", "visualisee", "comparee", "corrigee", "reussie"];
const atteint = (t: Tentative, e: Etape) => RANG.indexOf(t.etape_atteinte) >= RANG.indexOf(e);
const ETAPES = ["Écrire", "Prédire", "Observer", "Comparer", "Valider"];
const mouvementReduit = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const CLE_PARTAGE = "algodex.labo.partage";
const lirePartage = () => {
  try {
    const v = Number(localStorage.getItem(CLE_PARTAGE));
    return v >= 30 && v <= 70 ? v : 46;
  } catch {
    return 46;
  }
};

/**
 * Le laboratoire de l'exercice cœur : l'éditeur à gauche, l'exécution réelle à droite.
 * Le moteur impose l'ordre (CDC-2) : prédire avant la première exécution, comparer avant de valider ;
 * après la comparaison, on corrige et on ré-exécute librement.
 */
export function Laboratoire({
  depart,
  pseudo,
  aide,
  onSoumis,
}: {
  depart: Progression & { exercice: ExercicePublic };
  pseudo?: string;
  aide?: ReactNode;
  onSoumis: (resultat: Soumission, progression: Progression) => void;
}) {
  const exercice = depart.exercice;
  const [tentative, setTentative] = useState(depart.tentative);
  const [blocs, setBlocsBrut] = useState<Bloc[]>(() => lireBrouillon<Bloc[]>(depart.tentative.id) ?? []);
  const [vue, setVue] = useState<VueDroite>(() => (depart.tentative.prediction ? "execution" : "prediction"));
  const [execution, setExecution] = useState<Execution | null>(null);
  const [perimee, setPerimee] = useState(false);
  const [comparaison, setComparaison] = useState<Comparaison | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [echecs, setEchecs] = useState(0);
  const [refus, setRefus] = useState<{ message: string; console: string[] } | null>(null);
  const [rappel, setRappel] = useState<string | null>(null);
  const [aideOuverte, setAideOuverte] = useState(false);
  const [confirmerEffacement, setConfirmerEffacement] = useState(false);

  // Lecteur de la trace : avancer, reculer, rejouer, sans relancer l'algorithme.
  const [k, setK] = useState(0);
  const [lecture, setLecture] = useState(false);
  const [vitesse, setVitesse] = useState(1);
  const dernier = execution ? Math.max(execution.trace.length - 1, 0) : 0;
  const enLecture = lecture && k < dernier;

  const prediction = tentative.prediction;
  const verrouille = !!prediction && !tentative.comparaison_vue;
  const variables = [...new Set([...variablesConnues(blocs, exercice.entrees), ...exercice.points_controle.map((p) => p.variable)])];

  useEffect(() => {
    if (!enLecture) return;
    const minuteur = setTimeout(() => setK((x) => Math.min(x + 1, dernier)), 900 / vitesse);
    return () => clearTimeout(minuteur);
  }, [enLecture, k, dernier, vitesse]);

  // ← et → parcourent l'exécution, sauf pendant une saisie.
  useEffect(() => {
    if (!execution || vue !== "execution") return;
    const touche = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [data-editeur-bulle]")) return;
      if (e.key === "ArrowRight") setK((x) => Math.min(x + 1, dernier));
      else if (e.key === "ArrowLeft") setK((x) => Math.max(x - 1, 0));
      else return;
      setLecture(false);
      e.preventDefault();
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [execution, vue, dernier]);

  function setBlocs(b: Bloc[]) {
    setBlocsBrut(b);
    ecrireBrouillon(tentative.id, b);
    if (execution) setPerimee(true);
  }

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

  function montrer(r: Execution) {
    setExecution(r);
    setTentative(r.tentative);
    setPerimee(false);
    setK(0);
    setLecture(!mouvementReduit());
    setVue("execution");
    if (r.erreur) setEchecs((n) => n + 1);
  }

  // Exécuter : la première fois, le moteur exige la prédiction ; ensuite on exécute directement.
  const executer = () => {
    setRefus(null);
    if (!prediction) {
      setVue("prediction");
      setRappel("Avant la première exécution, prédis ce que ton algorithme va faire.");
      return;
    }
    void action(async () => montrer(await api.executer(tentative.id, blocs)));
  };

  const engager = (p: Prediction) =>
    action(async () => {
      const r = await api.predire(tentative.id, p, blocs);
      setTentative(r.tentative);
      setRappel(null);
      montrer(await api.executer(tentative.id, blocs));
    });

  const comparer = () =>
    action(async () => {
      const r = await api.comparer(tentative.id, blocs);
      setComparaison(r.resultat ?? null);
      setTentative(r.tentative);
      setVue("comparaison");
    });

  const valider = () =>
    action(async () => {
      const r = await api.soumettre(tentative.id, blocs);
      setTentative(r.tentative);
      const resultat = r.resultat!;
      if ("valide" in resultat && !resultat.valide) {
        setEchecs((n) => n + 1);
        setRefus({ message: resultat.message, console: resultat.console });
        return;
      }
      setRefus(null);
      onSoumis(resultat, r);
    });

  // Reprise : une tentative déjà exécutée retrouve sa trace (le moteur la recalcule).
  const repris = useRef(false);
  useEffect(() => {
    if (repris.current || !depart.tentative.prediction || !atteint(depart.tentative, "visualisee")) return;
    repris.current = true;
    api
      .executer(depart.tentative.id, lireBrouillon<Bloc[]>(depart.tentative.id) ?? [])
      .then((r) => {
        setExecution(r);
        setTentative(r.tentative);
      })
      .catch((e) => setErreur(e.message));
  }, [depart.tentative]);

  // Partage éditeur / laboratoire, réglable à la souris ou au clavier.
  const [partage, setPartage] = useState(lirePartage);
  const zone = useRef<HTMLDivElement>(null);
  function regler(v: number) {
    const borne = Math.min(70, Math.max(30, v));
    setPartage(borne);
    try {
      localStorage.setItem(CLE_PARTAGE, String(Math.round(borne)));
    } catch {}
  }

  const commandes: Commandes = {
    k,
    dernier,
    enLecture,
    vitesse,
    aller: (n) => {
      setLecture(false);
      setK(Math.min(dernier, Math.max(0, n)));
    },
    basculerLecture: () => {
      if (enLecture) return setLecture(false);
      if (k >= dernier) setK(0);
      setLecture(true);
    },
    changerVitesse: setVitesse,
  };

  const visible = !!execution && vue === "execution" && !perimee;
  const suivi: SuiviExecution | null = visible
    ? {
        courante: execution.trace[k]?.ligne ?? null,
        executees: new Set(execution.trace.slice(0, k + 1).map((p) => p.ligne)),
        suivante: execution.trace[k + 1]?.ligne ?? null,
        erreur: k >= dernier ? (execution.erreur?.ligne ?? null) : null,
      }
    : null;

  const etape = !prediction ? (compterBlocs(blocs) ? 1 : 0) : tentative.comparaison_vue ? 4 : atteint(tentative, "visualisee") ? 3 : 2;

  return (
    <div className="flex min-h-screen flex-col lg:h-screen">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/70 bg-bg/90 px-4 py-3 backdrop-blur sm:px-6">
        <Link href="/parcours" className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-text" aria-label="Retour à Mon espace">
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{LIBELLES_NOTION[exercice.notion]}</div>
          <h1 className="truncate font-display text-2xl leading-tight">{exercice.titre}</h1>
        </div>
        <ol className="mx-auto hidden items-center gap-1 text-xs xl:flex" aria-label="Progression de l'exercice">
          {ETAPES.map((nom, n) => (
            <li key={nom} className="flex items-center gap-1" aria-current={n === etape ? "step" : undefined}>
              {n > 0 && <span className={`h-px w-5 ${n <= etape ? "bg-primary" : "bg-border"}`} aria-hidden />}
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                  n < etape ? "text-primary" : n === etape ? "bg-primary text-on-primary" : "text-muted"
                }`}
              >
                {n < etape && <Check size={12} strokeWidth={3} />}
                {nom}
              </span>
            </li>
          ))}
        </ol>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAideOuverte(true)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-sm font-medium hover:border-primary hover:text-primary"
          >
            <CircleHelp size={16} /> Aide
          </button>
          <BasculeTheme />
          {pseudo && <Avatar pseudo={pseudo} taille={36} />}
        </div>
      </header>

      <div
        ref={zone}
        className="flex min-h-0 flex-1 flex-col lg:flex-row"
        style={{ "--part": `${partage}%` } as React.CSSProperties}
      >
        {/* ALGORITHM EDITOR */}
        <section aria-label="Éditeur d'algorithme" className="flex min-w-0 flex-col gap-4 p-4 sm:p-6 lg:w-[var(--part)] lg:overflow-y-auto">
          <div className="rounded-2xl border border-border bg-surface px-4 py-3">
            <p className="text-sm">{exercice.enonce}</p>
            {Object.keys(exercice.entrees).length > 0 && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                Données :
                {Object.entries(exercice.entrees).map(([nom, v]) => (
                  <code key={nom} className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-primary">
                    {nom} = {afficherValeur(v)}
                  </code>
                ))}
              </p>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-3xl border border-[#4b43b8]/60 bg-[#111338] p-3 shadow-[0_30px_80px_-30px_rgb(108_92_252/0.55)]">
            <div className="mb-2.5 flex flex-wrap items-center gap-2 px-1 text-[#e4e6ff]">
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </span>
              <span className="rounded-lg bg-[#0b0d29] px-3 py-1 text-xs font-semibold">mon algorithme</span>
              {verrouille && (
                <span className="flex items-center gap-1 text-xs text-[#b4a3ff]" title="Tu pourras le modifier après avoir comparé ta prédiction à la réalité.">
                  <Lock size={12} /> figé jusqu&apos;à la comparaison
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                {!verrouille && (
                  <button
                    type="button"
                    disabled={!compterBlocs(blocs)}
                    onClick={() => {
                      if (!confirmerEffacement) {
                        setConfirmerEffacement(true);
                        setTimeout(() => setConfirmerEffacement(false), 3000);
                        return;
                      }
                      setConfirmerEffacement(false);
                      setBlocs([]);
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-30 ${
                      confirmerEffacement ? "bg-[#ff5f57]/20 text-[#ff8a7a]" : "text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Eraser size={14} /> {confirmerEffacement ? "Sûr ? tout effacer" : "Réinitialiser"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={executer}
                  disabled={occupe || !compterBlocs(blocs)}
                  className="bouton-lumineux flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  <Play size={14} fill="currentColor" /> {occupe ? "…" : "Exécuter"}
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 rounded-2xl border border-white/5 bg-[#0b0d29] lg:overflow-y-auto">
              <EditeurBlocs blocs={blocs} onChange={setBlocs} variables={variables} verrouille={verrouille} suivi={suivi} sansCadre />
            </div>
          </div>

          {refus && (
            <div className="rounded-2xl border border-accent/40 bg-surface p-4" role="alert">
              <div className="flex items-center gap-2 font-semibold text-accent">
                <Wrench size={17} /> Pas encore
              </div>
              <p className="mt-1 text-sm">{refus.message}</p>
              {refus.console.length > 0 && <pre className="mt-2 rounded-lg bg-code-bg p-3 font-mono text-sm text-code-text">{refus.console.join("\n")}</pre>}
            </div>
          )}
        </section>

        {/* La séparation, à faire glisser pour donner la place à l'éditeur ou au laboratoire */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Partager l'espace entre l'éditeur et le laboratoire"
          aria-valuenow={Math.round(partage)}
          aria-valuemin={30}
          aria-valuemax={70}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") regler(partage - 3);
            if (e.key === "ArrowRight") regler(partage + 3);
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const boite = zone.current!.getBoundingClientRect();
            const bouger = (ev: PointerEvent) => regler(((ev.clientX - boite.left) / boite.width) * 100);
            const lacher = () => {
              window.removeEventListener("pointermove", bouger);
              window.removeEventListener("pointerup", lacher);
            };
            window.addEventListener("pointermove", bouger);
            window.addEventListener("pointerup", lacher);
          }}
          className="group relative hidden w-2 shrink-0 cursor-col-resize items-center justify-center outline-none lg:flex"
        >
          <span className="h-full w-px bg-border transition-colors group-hover:bg-primary group-focus-visible:bg-primary" />
          <span className="absolute h-10 w-1.5 rounded-full bg-border transition-colors group-hover:bg-primary group-focus-visible:bg-primary" />
        </div>

        {/* VISUALIZE CODE EXECUTION */}
        <section aria-label="Laboratoire d'exécution" className="flex min-w-0 flex-1 flex-col gap-4 bg-surface/40 p-4 sm:p-6 lg:overflow-y-auto">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-display text-2xl">Laboratoire d&apos;exécution</h2>
            <span className="font-hand text-lg text-primary">écris, exécute, observe, comprends</span>
          </div>
          {erreur && <MessageErreur message={erreur} />}

          {vue === "prediction" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                <RobotAlgo taille={52} className="shrink-0" />
                <p className="text-sm">
                  {rappel ?? "Quand ton algorithme est prêt, prédis ce qu'il va faire : la première exécution s'ouvre juste après."}
                </p>
              </div>
              <FormulairePrediction
                points={exercice.points_controle}
                engagee={prediction}
                enCours={occupe}
                onEngager={(p) => (compterBlocs(blocs) ? engager(p) : setRappel("Écris d'abord ton algorithme dans l'éditeur, puis prédis."))}
              />
            </div>
          )}

          {vue === "execution" &&
            (!execution ? (
              <p className="text-sm text-muted">{occupe ? "Le moteur exécute ton algorithme…" : "Exécute ton algorithme pour l'observer pas à pas."}</p>
            ) : perimee ? (
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-4">
                <RobotAlgo taille={52} className="shrink-0" />
                <p className="text-sm">Ton algorithme a changé : exécute-le à nouveau pour observer la nouvelle version.</p>
              </div>
            ) : (
              <>
                <BarreControle c={commandes} total={execution.trace.length} />
                <CeQuiSePasse pas={execution.trace[k]} suivante={execution.trace[k + 1]?.ligne ?? null} fin={k >= dernier} erreur={execution.erreur} />
                <div className="grid gap-4 2xl:grid-cols-2">
                  <Panneau titre="Flux de contrôle">
                    <FluxControle execution={execution} k={k} />
                  </Panneau>
                  {Object.values(execution.trace[k]?.variables ?? {}).some(Array.isArray) && (
                    <Panneau titre="Tableaux">
                      <StructuresDonnees execution={execution} k={k} initiales={exercice.entrees} />
                    </Panneau>
                  )}
                </div>
                <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <Panneau titre="Variables">
                    <ExplorateurVariables execution={execution} k={k} initiales={exercice.entrees} />
                  </Panneau>
                  <Console execution={execution} k={k} />
                </div>
              </>
            ))}

          {vue === "comparaison" && comparaison && <EcranComparaison comparaison={comparaison} />}

          {/* Les étapes suivantes du cycle, selon ce que le moteur a enregistré */}
          {prediction && (
            <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border/70 pt-4">
              {vue === "comparaison" ? (
                <button type="button" onClick={() => setVue("execution")} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:border-primary">
                  Revoir l&apos;exécution
                </button>
              ) : (
                execution &&
                !perimee && (
                  <button
                    type="button"
                    onClick={comparer}
                    disabled={occupe}
                    className="flex items-center gap-2 rounded-xl border border-primary/50 bg-surface px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-40"
                  >
                    <Scale size={16} /> Comparer avec ma prédiction
                  </button>
                )
              )}
              {tentative.comparaison_vue && (
                <button
                  type="button"
                  onClick={valider}
                  disabled={occupe}
                  className="ml-auto flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-[0_10px_24px_-10px_var(--primary)] disabled:opacity-40"
                >
                  Valider ma solution <ArrowRight size={16} />
                </button>
              )}
              {tentative.comparaison_vue && (
                <p className="w-full text-xs text-muted">Corrige ce que la comparaison t&apos;a montré, ré-exécute pour vérifier, puis valide.</p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Aide et échelle d'indices, à la demande : l'écran de travail reste dégagé. */}
      <div className={`fixed inset-0 z-50 ${aideOuverte ? "" : "pointer-events-none"}`} aria-hidden={!aideOuverte}>
        <div onClick={() => setAideOuverte(false)} className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${aideOuverte ? "opacity-100" : "opacity-0"}`} />
        <aside
          role="dialog"
          aria-label="Aide"
          className={`absolute inset-y-0 right-0 flex w-[min(26rem,92vw)] flex-col gap-4 overflow-y-auto bg-bg p-5 shadow-2xl transition-transform duration-300 ${
            aideOuverte ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Aide</h2>
            <button type="button" onClick={() => setAideOuverte(false)} aria-label="Fermer l'aide" className="rounded-lg p-2 text-muted hover:text-text" tabIndex={aideOuverte ? 0 : -1}>
              <X size={18} />
            </button>
          </div>
          <EchelleIndices
            tentativeId={tentative.id}
            nbIndices={exercice.nb_indices}
            propose={echecs >= 2}
            onDeroulement={() => {
              setAideOuverte(false);
              if (prediction) executer();
              else {
                setVue("prediction");
                setRappel("Le déroulement guidé s'ouvre juste après ta prédiction : engage-la d'abord.");
              }
            }}
          />
          {aide}
        </aside>
      </div>
    </div>
  );
}

function Panneau({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{titre}</h3>
      {children}
    </div>
  );
}
