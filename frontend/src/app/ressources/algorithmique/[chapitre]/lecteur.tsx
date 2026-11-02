"use client";

import { AlertTriangle, ArrowLeft, ArrowRight, Check, Clock, Gauge, Languages, Lightbulb, Target } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { CarteExercice } from "@/components/ressources/carte-exercice";
import { CoqueRessources } from "@/components/ressources/coque-ressources";
import { VisuelChapitre } from "@/components/ressources/illustrations";
import { StatutPastille } from "@/components/ressources/statut";
import { api, LIBELLES_NOTION, type ExerciceBibliotheque } from "@/lib/api";
import { CHAPITRES, chapitreParSlug, type Bloc } from "@/lib/cours";
import { marquerChapitre, useLectureCours } from "@/lib/progression-cours";
import { useProfilActif } from "@/lib/profils";

/** Un chapitre du cours : sections, exercices corrigés, et les vrais exercices du laboratoire pour s'entraîner. */
export function LecteurChapitre() {
  const { chapitre: slug } = useParams<{ chapitre: string }>();
  const chapitre = chapitreParSlug(slug);
  const profilId = useProfilActif();
  const lecture = useLectureCours(profilId);
  const [pseudo, setPseudo] = useState<string>();
  const [bibliotheque, setBibliotheque] = useState<ExerciceBibliotheque[] | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!profilId) return;
    api
      .bibliotheque(profilId)
      .then((b) => setBibliotheque(b.exercices))
      .catch(() => setErreur(true));
    api
      .cockpit(profilId)
      .then((c) => setPseudo(c.profil.pseudo))
      .catch(() => {});
  }, [profilId]);

  if (!chapitre) notFound();

  const statut = lecture.statut(chapitre.slug);
  const termine = statut === "termine";
  const suivant = CHAPITRES.find((c) => c.numero === chapitre.numero + 1);
  const precedent = CHAPITRES.find((c) => c.numero === chapitre.numero - 1);
  const exercices = bibliotheque?.filter((e) => chapitre.notions.includes(e.notion)) ?? [];

  return (
    <CoqueRessources pseudo={pseudo}>
      <div className="grid gap-x-10 gap-y-8 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <article className="min-w-0 max-w-3xl">
          <Link href="/ressources/algorithmique" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-primary">
            <ArrowLeft size={16} /> Retour au cours
          </Link>

          {/* en-tête */}
          <header className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-lg bg-primary-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Chapitre {String(chapitre.numero).padStart(2, "0")}
                </span>
                <StatutPastille statut={statut} premier={!lecture.termines?.length && chapitre.numero === 1} />
                <span className="flex items-center gap-1.5 text-sm text-muted">
                  <Clock size={15} /> {chapitre.duree} min
                </span>
              </div>
              <h1 className="mt-4 font-display text-[2.6rem] leading-[1.05] tracking-tight sm:text-5xl">{chapitre.titre}</h1>
              <p className="mt-3 text-[17px] text-text/75">{chapitre.resume}</p>
            </div>
            <div className="w-full max-w-[15rem] shrink-0 rounded-3xl bg-gradient-to-br from-primary-soft to-[#f3efff] dark:to-surface-2">
              <VisuelChapitre numero={chapitre.numero} className="w-full" />
            </div>
          </header>

          <div className="card mt-7 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
              <Target size={16} /> Objectifs
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-3">
              {chapitre.objectifs.map((o) => (
                <li key={o} className="flex items-start gap-2 text-sm text-text/80">
                  <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0 text-primary" /> {o}
                </li>
              ))}
            </ul>
          </div>

          {/* sections */}
          {chapitre.sections.map((s) => (
            <section key={s.id} id={s.id} className="mt-10 scroll-mt-24" aria-labelledby={`titre-${s.id}`}>
              <h2 id={`titre-${s.id}`} className="font-display text-[1.75rem] leading-tight">
                {s.titre}
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {s.blocs.map((b, n) => (
                  <BlocCours key={n} bloc={b} />
                ))}
              </div>
            </section>
          ))}

          {/* entraînement réel */}
          <section id="epreuve" className="mt-12 scroll-mt-24" aria-labelledby="titre-epreuve">
            <h2 id="titre-epreuve" className="font-display text-[1.75rem] leading-tight">
              Mets-toi à l&apos;épreuve
            </h2>
            {chapitre.notions.length === 0 ? (
              <div className="card mt-4 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <p className="flex-1 text-text/80">
                  Ce chapitre n&apos;a pas d&apos;exercice dans le laboratoire. Le test de niveau te fait lire et dérouler de vrais algorithmes : un bon
                  moyen de vérifier où tu en es.
                </p>
                <Link href="/calibrage" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary">
                  <Gauge size={16} /> Test de niveau
                </Link>
              </div>
            ) : (
              <>
                <p className="mt-2 text-text/75">
                  Les exercices du laboratoire sur {chapitre.notions.map((n) => LIBELLES_NOTION[n].toLowerCase()).join(" et ")} : écris, prédis, exécute,
                  compare.
                </p>
                {erreur && <p className="mt-3 text-sm text-danger">Les exercices n&apos;ont pas pu être chargés.</p>}
                {!bibliotheque && !erreur && <p className="mt-3 text-sm text-muted">Chargement des exercices…</p>}
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {exercices.map((e) => (
                    <li key={e.id}>
                      <CarteExercice exercice={e} avecChapitre={false} />
                    </li>
                  ))}
                </ul>
                <Link href="/ressources/exercices" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                  Toute la bibliothèque d&apos;exercices <ArrowRight size={15} />
                </Link>
              </>
            )}
            {chapitre.numero === CHAPITRES.length && (
              <Link
                href="/langages"
                className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-primary/40 p-4 text-sm text-text/80 transition-colors hover:bg-primary-soft/50"
              >
                <Languages size={18} className="shrink-0 text-primary" />
                <span className="flex-1">
                  Envie de voir ces algorithmes en Python, JavaScript, Java ou C&nbsp;? La documentation les montre côte à côte, notion par notion.
                </span>
                <ArrowRight size={16} className="text-primary" />
              </Link>
            )}
          </section>

          {/* fin de chapitre */}
          <div className="card mt-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="font-semibold">{termine ? "Chapitre terminé, bravo !" : "Tu as tout lu et essayé les exercices ?"}</p>
              <p className="font-hand text-xl text-primary">{termine ? "Une étape de plus vers le sommet !" : "Prends ton temps, relis si besoin."}</p>
            </div>
            <button
              type="button"
              disabled={!profilId}
              onClick={() => profilId && marquerChapitre(profilId, chapitre.slug, !termine)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                termine ? "border border-border bg-surface text-muted hover:text-text" : "bg-success text-white hover:brightness-110"
              }`}
            >
              {termine ? "Marquer comme non terminé" : (
                <>
                  <Check size={16} strokeWidth={3} /> J&apos;ai terminé ce chapitre
                </>
              )}
            </button>
          </div>

          <nav className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between" aria-label="Chapitres voisins">
            {precedent ? (
              <Link href={`/ressources/algorithmique/${precedent.slug}`} className="flex items-center gap-2 text-sm font-medium text-muted hover:text-primary">
                <ArrowLeft size={16} /> {precedent.titre}
              </Link>
            ) : (
              <span />
            )}
            {suivant ? (
              <Link
                href={`/ressources/algorithmique/${suivant.slug}`}
                className="bouton-lumineux inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
              >
                Chapitre suivant : {suivant.titre} <ArrowRight size={16} />
              </Link>
            ) : (
              <Link href="/ressources/algorithmique" className="bouton-lumineux inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white">
                Retour au cours <ArrowRight size={16} />
              </Link>
            )}
          </nav>
        </article>

        {/* sommaire */}
        <aside className="hidden xl:block" aria-label="Sommaire du chapitre">
          <div className="sticky top-24 flex flex-col gap-4">
            <nav className="card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Dans ce chapitre</h2>
              <ol className="mt-3 flex flex-col gap-1 border-l border-border">
                {[...chapitre.sections, { id: "epreuve", titre: "Mets-toi à l'épreuve" }].map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-sm text-text/75 hover:border-primary hover:text-primary">
                      {s.titre}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <nav className="card p-5" aria-label="Chapitres du cours">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Le cours</h2>
              <ol className="mt-3 flex flex-col gap-1.5">
                {CHAPITRES.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/ressources/algorithmique/${c.slug}`}
                      aria-current={c.slug === chapitre.slug ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${c.slug === chapitre.slug ? "bg-primary-soft font-semibold text-primary" : "text-text/75 hover:text-primary"}`}
                    >
                      <span className="w-5 font-mono text-xs">{String(c.numero).padStart(2, "0")}</span>
                      <span className="flex-1">{c.titre}</span>
                      {lecture.statut(c.slug) === "termine" && <Check size={14} strokeWidth={3} className="text-success" />}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </aside>
      </div>
    </CoqueRessources>
  );
}

// --------------------------------------------------------------------------
// Rendu des blocs du cours
// --------------------------------------------------------------------------

/** Texte du cours : **gras** et `pseudo-code` en ligne. */
function Riche({ texte }: { texte: string }) {
  return (
    <>
      {texte.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((m, n) => {
        if (m.startsWith("**")) return <strong key={n} className="font-semibold text-text">{m.slice(2, -2)}</strong>;
        if (m.startsWith("`"))
          return (
            <code key={n} className="rounded-md bg-primary-soft px-1.5 py-0.5 font-mono text-[0.88em] text-primary">
              {m.slice(1, -1)}
            </code>
          );
        return <Fragment key={n}>{m}</Fragment>;
      })}
    </>
  );
}

const MOTS_CLES = new Set([
  "variable", "variables", "constante", "tableau", "de", "lire", "écrire", "si", "alors", "sinon", "fin", "selon",
  "tant", "que", "faire", "répéter", "jusqu'à", "pour", "à", "fonction", "procédure", "retourner", "var",
  "et", "ou", "non", "mod", "div", "vrai", "faux", "entier", "entiers", "réel", "réels", "booléen", "caractère", "chaîne", "Algorithme",
]);

/** Coloration du pseudo-code du cours, avec les couleurs des panneaux de code d'ALGO_DEX. */
function colorerLigne(ligne: string) {
  const [code, commentaire] = ligne.split(/(?=\/\/)/);
  return (
    <>
      {code.split(/("[^"]*"|\s+|[()[\],:←+\-*/<>≥≤≠=.]|(?<![\p{L}\d_])\d+(?:,\d+)?)/u).map((m, n) => {
        if (!m) return null;
        if (MOTS_CLES.has(m)) return <span key={n} className="text-[#c4a7ff]">{m}</span>;
        if (/^[←+\-*/<>≥≤≠=]$/.test(m)) return <span key={n} className="text-[#f062b8]">{m}</span>;
        if (/^\d/.test(m)) return <span key={n} className="text-[#f5b06b]">{m}</span>;
        if (m.startsWith('"')) return <span key={n} className="text-[#3ddbb0]">{m}</span>;
        if (/^[\p{L}_][\p{L}\d_]*$/u.test(m)) return <span key={n} className="text-[#8fd8ff]">{m}</span>;
        return m;
      })}
      {commentaire && <span className="text-[#7d86b5]">{commentaire}</span>}
    </>
  );
}

function Encadre({ icone, titre, classe, children }: { icone: ReactNode; titre: string; classe: string; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border px-5 py-4 ${classe}`}>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        {icone} {titre}
      </p>
      <p className="mt-1.5 leading-relaxed text-text/85">{children}</p>
    </div>
  );
}

function BlocCours({ bloc }: { bloc: Bloc }) {
  switch (bloc.type) {
    case "texte":
      return (
        <p className="text-[16.5px] leading-relaxed text-text/80">
          <Riche texte={bloc.texte} />
        </p>
      );
    case "liste": {
      const Liste = bloc.ordonnee ? "ol" : "ul";
      return (
        <Liste className={`flex flex-col gap-2 pl-6 text-[16px] leading-relaxed text-text/80 ${bloc.ordonnee ? "list-decimal marker:font-bold marker:text-primary" : "list-disc marker:text-primary"}`}>
          {bloc.items.map((i) => (
            <li key={i} className="pl-1">
              <Riche texte={i} />
            </li>
          ))}
        </Liste>
      );
    }
    case "code":
      return (
        <figure className="overflow-hidden rounded-2xl bg-code-bg shadow-[0_18px_40px_-24px_#0d1240]">
          {bloc.titre && (
            <figcaption className="flex items-center gap-2 border-b border-code-line px-4 py-2.5 font-mono text-xs text-code-text/70">
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </span>
              {bloc.titre}
            </figcaption>
          )}
          <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[13.5px] leading-6 text-code-text">
            {bloc.lignes.map((l, n) => (
              <div key={n} className="flex">
                <span className="mr-4 w-5 shrink-0 select-none text-right text-code-text/30">{n + 1}</span>
                <span className="whitespace-pre">{l ? colorerLigne(l) : " "}</span>
              </div>
            ))}
          </pre>
        </figure>
      );
    case "tableau":
      return (
        <figure className="overflow-x-auto rounded-2xl border border-border bg-surface">
          {bloc.legende && <figcaption className="border-b border-border px-4 py-2.5 text-sm font-semibold text-text/80">{bloc.legende}</figcaption>}
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-primary-soft/60">
                {bloc.entetes.map((e) => (
                  <th key={e} scope="col" className="whitespace-nowrap px-4 py-2.5 font-semibold text-primary">
                    {e}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloc.lignes.map((l, n) => (
                <tr key={n} className="border-t border-border">
                  {l.map((c, k) => (
                    <td key={k} className={`px-4 py-2.5 align-top text-text/80 ${k === 0 ? "font-medium" : ""} ${/[←()]|^\d|^(vrai|faux)$/.test(c) ? "font-mono text-[13px]" : ""}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      );
    case "retenir":
      return (
        <Encadre icone={<Lightbulb size={15} />} titre="À retenir" classe="border-lavande/25 bg-[#f1edff] text-lavande dark:bg-primary-soft">
          <Riche texte={bloc.texte} />
        </Encadre>
      );
    case "attention":
      return (
        <Encadre icone={<AlertTriangle size={15} />} titre="Attention" classe="border-warning/30 bg-warning-soft text-warning">
          <Riche texte={bloc.texte} />
        </Encadre>
      );
    case "exercice":
      return (
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Exercice</p>
          <h3 className="mt-1 text-lg font-bold">{bloc.titre}</h3>
          <p className="mt-2 leading-relaxed text-text/80">
            <Riche texte={bloc.enonce} />
          </p>
          <details className="group mt-4">
            <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-xl border border-primary/30 px-3.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">Voir une solution</span>
              <span className="hidden group-open:inline">Masquer la solution</span>
            </summary>
            <div className="mt-4 flex flex-col gap-4 border-l-2 border-primary/30 pl-4">
              {bloc.solution.map((b, n) => (
                <BlocCours key={n} bloc={b} />
              ))}
            </div>
          </details>
        </div>
      );
  }
}
