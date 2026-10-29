"use client";

import { ArrowLeft, ArrowRight, BookOpen, Eye, FileCode2, Hourglass, PenLine, Scale, Target, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EditeurBlocs } from "@/components/blocs/editeur";
import { MessageErreur } from "@/components/coque";
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
import { compterBlocs, enPseudoCode, variablesConnues, type Bloc } from "@/lib/blocs";
import { afficherValeur, decrireMoment } from "@/lib/format";
import { ecrireBrouillon, lireBrouillon } from "@/lib/profils";
import { EcranComparaison } from "./comparaison";
import { BarreEtapes, PointsProgression, type DefEtape } from "./etapes";
import { EchelleIndices } from "./indices";
import { FormulairePrediction } from "./prediction";
import { PseudoCode } from "./pseudo-code";
import { Visualisation } from "./visualisation";

type Vue = "comprendre" | "lire" | "ecrire" | "predire" | "visualiser" | "comparer";

const ETAPES_COEUR: DefEtape<Vue>[] = [
  { cle: "comprendre", titre: "Comprendre", sousTitre: "Lire l'énoncé", icone: BookOpen },
  { cle: "ecrire", titre: "Écrire", sousTitre: "Composer les blocs", icone: PenLine },
  { cle: "predire", titre: "Prédire", sousTitre: "Tracer dans ta tête", icone: Target },
  { cle: "visualiser", titre: "Visualiser", sousTitre: "Observer l'exécution", icone: Eye },
  { cle: "comparer", titre: "Comparer", sousTitre: "Prédiction vs réalité", icone: Scale },
];

const ETAPES_EXPRESS: DefEtape<Vue>[] = [
  { cle: "lire", titre: "Lire", sousTitre: "L'algorithme fourni", icone: FileCode2 },
  { cle: "predire", titre: "Prédire", sousTitre: "Tracer dans ta tête", icone: Target },
  { cle: "visualiser", titre: "Visualiser", sousTitre: "Observer l'exécution", icone: Eye },
  { cle: "comparer", titre: "Comparer", sousTitre: "Prédiction vs réalité", icone: Scale },
];

const RANG: Etape[] = ["ecrit", "predite", "visualisee", "comparee", "corrigee", "reussie"];
const atteint = (t: Tentative, e: Etape) => RANG.indexOf(t.etape_atteinte) >= RANG.indexOf(e);

/** Le cycle complet : (écrire) → prédire → visualiser → comparer → (corriger) → valider. */
export function Cycle({
  depart,
  pseudo,
  filAriane,
  asideDroite,
  onSoumis,
}: {
  depart: Progression & { exercice: ExercicePublic };
  pseudo?: string;
  filAriane: ReactNode;
  asideDroite?: ReactNode;
  onSoumis: (resultat: Soumission, progression: Progression) => void;
}) {
  const exercice = depart.exercice;
  const coeur = exercice.type === "coeur";
  const etapes = coeur ? ETAPES_COEUR : ETAPES_EXPRESS;

  const [tentative, setTentative] = useState(depart.tentative);
  const [blocs, setBlocsBrut] = useState<Bloc[]>(() => lireBrouillon<Bloc[]>(depart.tentative.id) ?? []);
  const [vue, setVue] = useState<Vue>(() => vueDeReprise(depart.tentative, coeur, blocs));
  const [execution, setExecutionBrut] = useState<Execution | null>(null);
  const [numeroExecution, setNumeroExecution] = useState(0);
  const [comparaison, setComparaison] = useState<Comparaison | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [echecs, setEchecs] = useState(0);
  const [refus, setRefus] = useState<{ message: string; console: string[] } | null>(null);
  const [noteIndice, setNoteIndice] = useState<string | null>(null);

  const prediction = tentative.prediction;
  const verrouille = coeur && !!prediction && !tentative.comparaison_vue;
  const variables = useMemo(
    () => [...new Set([...variablesConnues(blocs, exercice.entrees), ...exercice.points_controle.map((p) => p.variable)])],
    [blocs, exercice],
  );

  function setExecution(r: Execution | null) {
    setExecutionBrut(r);
    if (r) setNumeroExecution((n) => n + 1);
  }

  function setBlocs(b: Bloc[]) {
    setBlocsBrut(b);
    setExecution(null);
    ecrireBrouillon(tentative.id, b);
  }

  async function action<T>(f: () => Promise<T>): Promise<T | undefined> {
    setErreur(null);
    setOccupe(true);
    try {
      return await f();
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setOccupe(false);
    }
  }

  const executer = () =>
    action(async () => {
      const r = await api.executer(tentative.id, coeur ? blocs : undefined);
      setExecution(r);
      setTentative(r.tentative);
      if (r.erreur) setEchecs((n) => n + 1);
      setVue("visualiser");
    });

  const comparer = () =>
    action(async () => {
      const r = await api.comparer(tentative.id, coeur ? blocs : undefined);
      setComparaison(r.resultat ?? null);
      setTentative(r.tentative);
      setVue("comparer");
    });

  const engager = (p: Prediction) =>
    action(async () => {
      const r = await api.predire(tentative.id, p, coeur ? blocs : undefined);
      setTentative(r.tentative);
      const ex = await api.executer(tentative.id, coeur ? blocs : undefined);
      setExecution(ex);
      setTentative(ex.tentative);
      setVue("visualiser");
    });

  const soumettre = () =>
    action(async () => {
      const r = await api.soumettre(tentative.id, coeur ? blocs : undefined);
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

  // Reprise d'une tentative déjà visualisée : on rejoue l'exécution.
  const repris = useRef(false);
  useEffect(() => {
    if (repris.current || vue !== "visualiser" || execution) return;
    repris.current = true;
    api
      .executer(tentative.id, coeur ? blocs : undefined)
      .then((r) => {
        setExecution(r);
        setTentative(r.tentative);
      })
      .catch((e) => setErreur(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accessibles = new Set<Vue>(coeur ? ["comprendre", "ecrire", "predire"] : ["lire", "predire"]);
  if (prediction) accessibles.add("visualiser");
  if (atteint(tentative, "visualisee")) accessibles.add("comparer");

  function choisirVue(v: Vue) {
    setRefus(null);
    if (v === "visualiser" && !execution) void executer();
    else if (v === "comparer" && !comparaison) void comparer();
    else setVue(v);
  }

  function deroulementGuide() {
    if (!prediction) {
      setNoteIndice("Le déroulement guidé s'ouvre juste après ta prédiction : engage-la d'abord.");
      return;
    }
    setNoteIndice(null);
    choisirVue("visualiser");
  }

  const bouton = (libelle: string, onClick: () => void, desactive = false) => (
    <button
      type="button"
      onClick={onClick}
      disabled={desactive || occupe}
      className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-card disabled:opacity-40"
    >
      {occupe ? "…" : libelle} <ArrowRight size={16} />
    </button>
  );

  let actionPrincipale: ReactNode = null;
  if (vue === "comprendre") actionPrincipale = bouton("J'ai compris, j'écris", () => setVue("ecrire"));
  if (vue === "lire") actionPrincipale = bouton("Je prédis", () => setVue("predire"));
  if (vue === "ecrire") {
    if (!prediction) actionPrincipale = bouton("Je prédis", () => setVue("predire"), compterBlocs(blocs) === 0);
    else if (verrouille) actionPrincipale = bouton("Visualiser", () => choisirVue("visualiser"));
    else actionPrincipale = bouton("Ré-exécuter", executer, compterBlocs(blocs) === 0);
  }
  if (vue === "predire" && prediction) actionPrincipale = bouton("Visualiser", () => choisirVue("visualiser"));
  if (vue === "visualiser") {
    actionPrincipale = tentative.comparaison_vue && coeur ? bouton("Valider ma solution", soumettre) : bouton("Comparer", comparer);
  }
  if (vue === "comparer") actionPrincipale = bouton(coeur ? "Valider ma solution" : "Valider et continuer", soumettre);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/parcours" className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-text" aria-label="Retour au parcours">
            <ArrowLeft size={18} />
          </Link>
          <nav className="min-w-0 flex-1 truncate text-sm text-muted">{filAriane}</nav>
          <PointsProgression total={etapes.length} courant={etapes.findIndex((e) => e.cle === vue)} />
          <BasculeTheme />
          {pseudo && <Avatar pseudo={pseudo} taille={34} />}
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1500px] flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_290px]">
        <aside className="flex flex-col gap-4">
          <Enonce exercice={exercice} />
          {coeur && (
            <>
              <EchelleIndices
                tentativeId={tentative.id}
                nbIndices={exercice.nb_indices}
                propose={echecs >= 2}
                onDeroulement={deroulementGuide}
              />
              {noteIndice && <p className="text-sm text-muted">{noteIndice}</p>}
              <p className="ml-6 -rotate-2 font-hand text-xl text-muted">Réfléchis bien avant de passer à la visualisation !</p>
            </>
          )}
        </aside>

        <main className="flex min-w-0 flex-col gap-4">
          {erreur && <MessageErreur message={erreur} />}
          {refus && (
            <div className="card border-accent/40 p-5">
              <div className="flex items-center gap-2 font-semibold text-accent">
                <Wrench size={18} /> Pas encore
              </div>
              <p className="mt-1 text-sm">{refus.message}</p>
              {refus.console.length > 0 && (
                <pre className="mt-3 rounded-lg bg-code-bg p-3 font-mono text-sm text-code-text">{refus.console.join("\n")}</pre>
              )}
              <button
                type="button"
                onClick={() => {
                  setRefus(null);
                  setVue("ecrire");
                }}
                className="mt-3 text-sm font-semibold text-primary"
              >
                Corriger mon algorithme →
              </button>
            </div>
          )}

          {vue === "comprendre" && <Comprendre />}

          {vue === "lire" && exercice.lignes && (
            <section className="flex flex-col gap-4">
              <TitreVue titre="Lis l'algorithme" sousTitre="Suis-le ligne par ligne, sans rien exécuter encore." />
              <PseudoCode lignes={exercice.lignes} titre="Algorithme fourni" />
            </section>
          )}

          {vue === "ecrire" && (
            <section className="flex flex-col gap-4">
              <TitreVue titre="Écris ton algorithme" sousTitre="Compose-le en blocs : aucune syntaxe à taper." />
              <div className="card p-4">
                <EditeurBlocs blocs={blocs} onChange={setBlocs} variables={variables} verrouille={verrouille} />
              </div>
              {tentative.comparaison_vue && (
                <p className="text-sm text-muted">Corrige ce que la comparaison t&apos;a montré, puis ré-exécute pour vérifier.</p>
              )}
            </section>
          )}

          {vue === "predire" && (
            <section className="grid gap-4 xl:grid-cols-2">
              <PseudoCode
                lignes={coeur ? enPseudoCode(blocs).map((texte, k) => ({ ligne: k + 1, texte })) : (exercice.lignes ?? [])}
                titre={coeur ? "Ton algorithme" : "Algorithme fourni"}
                className="self-start"
              />
              <FormulairePrediction points={exercice.points_controle} engagee={prediction} onEngager={engager} enCours={occupe} />
            </section>
          )}

          {vue === "visualiser" && (
            <section className="flex flex-col gap-4">
              <TitreVue titre="Visualisation de l'exécution" sousTitre="Observe pas à pas comment évoluent les variables." />
              {execution ? <Visualisation key={numeroExecution} execution={execution} initiales={exercice.entrees} /> : <p className="text-muted">Exécution…</p>}
            </section>
          )}

          {vue === "comparer" && comparaison && <EcranComparaison comparaison={comparaison} />}
        </main>

        {asideDroite && <aside className="flex flex-col gap-4 lg:col-span-2 xl:col-span-1">{asideDroite}</aside>}
      </div>

      <BarreEtapes
        etapes={etapes}
        courante={vue}
        accessibles={accessibles}
        onChoisir={choisirVue}
        action={
          <div className="flex items-center gap-2">
            {vue === "comparer" && coeur && (
              <button
                type="button"
                onClick={() => setVue("ecrire")}
                className="hidden rounded-xl border border-border px-4 py-3 text-sm font-medium sm:block"
              >
                Corriger
              </button>
            )}
            {actionPrincipale}
          </div>
        }
      />
    </div>
  );
}

function vueDeReprise(t: Tentative, coeur: boolean, blocs: Bloc[]): Vue {
  if (!t.prediction) return coeur ? (blocs.length ? "ecrire" : "comprendre") : "lire";
  if (!atteint(t, "visualisee")) return "predire";
  return !coeur || blocs.length ? "visualiser" : "ecrire";
}

function TitreVue({ titre, sousTitre }: { titre: string; sousTitre: string }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">{titre}</h2>
      <p className="text-sm text-muted">{sousTitre}</p>
    </div>
  );
}

function Enonce({ exercice }: { exercice: ExercicePublic }) {
  const entrees = Object.entries(exercice.entrees);
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
          {exercice.type === "coeur" ? "Exercice cœur" : "Express"}
        </span>
        <span className="rounded-lg bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
          {LIBELLES_NOTION[exercice.notion]}
        </span>
      </div>
      <h1 className="mt-4 font-display text-3xl font-semibold leading-tight">{exercice.titre}</h1>
      <p className="mt-3 text-[15px] leading-relaxed">{exercice.enonce}</p>

      {entrees.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-bg p-4">
          <div className="mb-2 text-sm font-semibold">Entrées</div>
          <ul className="flex flex-col gap-1.5">
            {entrees.map(([nom, v]) => (
              <li key={nom} className="flex items-center gap-2 font-mono text-sm">
                <span className="text-muted">{nom} =</span>
                <span className="rounded-md bg-primary-soft px-2 py-0.5 font-semibold text-primary">{afficherValeur(v)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <div className="mb-2 text-sm font-semibold">Ce que tu devras prédire</div>
        <ol className="flex flex-col gap-2 text-sm">
          {exercice.points_controle.map((p, k) => (
            <li key={p.id} className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold">
                {k + 1}
              </span>
              <span>
                <code className="font-mono font-semibold">{p.variable}</code>{" "}
                <span className="text-muted">{decrireMoment(p.moment, p.variable)}</span>
              </span>
            </li>
          ))}
          <li className="flex gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold">
              {exercice.points_controle.length + 1}
            </span>
            <span className="text-muted">la sortie finale</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

function Comprendre() {
  return (
    <section className="flex flex-col gap-4">
      <TitreVue titre="1. Comprendre le problème" sousTitre="Avant d'écrire quoi que ce soit." />
      <div className="card p-5">
        <div className="mb-3 font-semibold">Ce que tu dois faire :</div>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
          <li>Lire attentivement l&apos;énoncé, à gauche.</li>
          <li>Repérer les entrées et les noms de variables imposés.</li>
          <li>Repérer ce qui doit être affiché à la fin.</li>
          <li>Imaginer, en français, les étapes qui mènent de l&apos;entrée à la sortie.</li>
        </ul>
      </div>
      <div className="flex gap-4 rounded-2xl border border-primary/30 bg-primary-soft p-5">
        <Hourglass size={22} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <div className="font-semibold text-primary">Prends le temps de réfléchir !</div>
          <p className="mt-1 text-sm">
            Ici, la réponse ne s&apos;affiche jamais : c&apos;est toi qui la construis. Tu prédiras ensuite ce que ton
            algorithme fait, puis tu le verras s&apos;exécuter pas à pas.
          </p>
        </div>
      </div>
    </section>
  );
}
