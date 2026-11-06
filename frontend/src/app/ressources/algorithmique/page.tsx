"use client";

import { ArrowLeft, ArrowRight, BarChart3, BookOpen, Check, Clock, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RobotAlgo } from "@/components/espace/illustrations";
import { Annotation } from "@/components/espace/sections";
import { CoqueRessources } from "@/components/ressources/coque-ressources";
import { MontagneObjectif, SceneCours, VisuelChapitre } from "@/components/ressources/illustrations";
import { StatutPastille } from "@/components/ressources/statut";
import { api } from "@/lib/api";
import { CHAPITRES, COURS, DUREE_TOTALE, formaterDuree } from "@/lib/cours";
import { useLectureCours, type LectureCours } from "@/lib/progression-cours";
import { useProfilActif } from "@/lib/profils";

const APPRENTISSAGES = [
  "Comprendre ce qu'est un algorithme et comment il fonctionne",
  "Utiliser des variables, des types et des opérateurs",
  "Écrire des conditions et des boucles",
  "Manipuler des tableaux et rechercher dans une collection",
  "Découper un problème en fonctions réutilisables",
];

/** La page du cours d'algorithmique : héros, aperçu, chapitres, et la colonne de progression. */
export default function CoursAlgorithmique() {
  const profilId = useProfilActif();
  const [pseudo, setPseudo] = useState<string>();
  const lecture = useLectureCours(profilId);

  // Seul le pseudo vient du moteur ici : le cours lui-même n'est pas (encore) stocké côté serveur.
  useEffect(() => {
    if (!profilId) return;
    api
      .cockpit(profilId)
      .then((c) => setPseudo(c.profil.pseudo))
      .catch(() => {});
  }, [profilId]);

  const lienSuivant = `/ressources/algorithmique/${lecture.suivant.slug}`;
  const aCommence = !!lecture.termines?.length;

  return (
    <CoqueRessources pseudo={pseudo}>
      <div className="grid gap-section xl:grid-cols-[minmax(0,1fr)_19rem] 2xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ---------------------------------------------------------------- héros */}
        <section aria-labelledby="titre-cours" className="relative xl:col-start-1">
          <Link href="/ressources" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-primary">
            <ArrowLeft size={16} /> Retour aux ressources
          </Link>
          <div className="mt-5 grid items-center gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="relative z-10">
              <span className="inline-flex rounded-lg bg-primary-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">Cours</span>
              <h1 id="titre-cours" className="mt-4 font-display text-[2.6rem] leading-none min-[360px]:text-[3.4rem] tracking-tight text-text sm:text-[4.25rem]">
                {COURS.titre}
              </h1>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-text/75">
                Apprends à penser comme un ordinateur, pas besoin d&apos;être un génie, juste de la méthode&nbsp;!
              </p>
              <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-text/80">
                <li className="flex items-center gap-2">
                  <BarChart3 size={17} className="text-primary" /> {COURS.niveau}
                </li>
                <li className="flex items-center gap-2 sm:before:mr-3 sm:before:h-4 sm:before:w-px sm:before:bg-border">
                  <BookOpen size={17} className="text-primary" /> {CHAPITRES.length} chapitres
                </li>
                <li className="flex items-center gap-2 sm:before:mr-3 sm:before:h-4 sm:before:w-px sm:before:bg-border">
                  <Clock size={17} className="text-primary" /> {formaterDuree(DUREE_TOTALE)} environ
                </li>
              </ul>
              <Link
                href={lienSuivant}
                className="bouton-lumineux mt-8 inline-flex items-center gap-3 rounded-2xl px-6 py-3.5 text-[15px] font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                {aCommence ? "Reprendre le cours" : "Commencer le cours"} <ArrowRight size={18} />
              </Link>
              <Annotation fleche="droite" className="mt-6 hidden pl-24 sm:inline-flex">
                Pas à pas, tu vas y arriver&nbsp;!
              </Annotation>
            </div>

            <div className="relative -mx-2 sm:mx-0">
              <SceneCours className="w-full" />
              <RobotAlgo taille={118} tablette className="flotte absolute bottom-[14%] right-[13%] w-[20%] drop-shadow-xl" />
              <span className="absolute -top-2 right-0 hidden max-w-[12rem] rotate-3 text-right font-hand text-[22px] leading-6 text-lavande sm:block">
                Un bon algorithme, c&apos;est une idée bien organisée&nbsp;!
              </span>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- colonne de droite */}
        <aside className="flex flex-col gap-bloc xl:col-start-2 xl:row-span-3 xl:row-start-1" aria-label="Ton avancement">
          <CarteProgression lecture={lecture} />
          <ContenuDuCours lecture={lecture} />
          <div className="card overflow-hidden p-0">
            <MontagneObjectif atteintes={lecture.termines?.length ?? 0} className="w-full" />
            <div className="px-carte pb-carte">
              <p className="font-hand text-[22px] leading-6 text-lavande">Chaque chapitre t&apos;approche de ton objectif&nbsp;!</p>
              <Link
                href="/ressources"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-surface px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
              >
                Voir tous les cours <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </aside>

        {/* ---------------------------------------------------------------- aperçu */}
        <section aria-labelledby="titre-apercu" className="xl:col-start-1">
          <h2 id="titre-apercu" className="font-display text-[1.9rem] text-text">
            Aperçu du cours
          </h2>
          <div className="card mt-bloc grid gap-0 overflow-hidden p-0 md:grid-cols-2">
            <div className="relative p-carte">
              <h3 className="text-lg font-bold">Pourquoi apprendre l&apos;algorithmique&nbsp;?</h3>
              <p className="mt-3 leading-relaxed text-text/75">
                L&apos;algorithmique est l&apos;art de résoudre un problème étape par étape. Avant d&apos;écrire la moindre ligne de code, on
                réfléchit à la méthode&nbsp;: quelles données, quelles actions, dans quel ordre. C&apos;est la base de tout programme,
                quel que soit le langage.
              </p>
              <p className="mt-3 leading-relaxed text-text/75">
                Ici, tout s&apos;écrit en pseudo-code, en français&nbsp;: tu te concentres sur le raisonnement, la syntaxe viendra
                ensuite.
              </p>
              <p className="mt-5 -rotate-2 font-hand text-[22px] leading-6 text-primary">Le langage change, la logique reste&nbsp;!</p>
            </div>
            <div className="border-t border-border bg-surface-2/40 p-carte md:border-l md:border-t-0">
              <h3 className="text-lg font-bold">Ce que tu vas apprendre</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {APPRENTISSAGES.map((a) => (
                  <li key={a} className="flex items-start gap-3 text-[15px] text-text/80">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
              <figure className="mt-6 rounded-2xl bg-[#efebff] px-5 py-4 text-[#3a2a9c] dark:bg-primary-soft dark:text-text">
                <blockquote className="text-[15px] font-medium leading-relaxed">
                  «&nbsp;Un algorithme, c&apos;est une recette précise&nbsp;: les bons ingrédients, les bonnes étapes, dans le bon
                  ordre.&nbsp;»
                </blockquote>
                <figcaption className="mt-2 text-xs font-bold tracking-wider text-lavande">— ALGO_DEX</figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- chapitres */}
        <section aria-labelledby="titre-chapitres" className="xl:col-start-1">
          <h2 id="titre-chapitres" className="font-display text-[1.9rem] text-text">
            Les chapitres du cours
          </h2>
          <ol className="mt-bloc grid gap-bloc sm:grid-cols-2 2xl:grid-cols-4">
            {CHAPITRES.map((c) => {
              const statut = lecture.statut(c.slug);
              return (
                <li key={c.slug}>
                  <Link
                    href={`/ressources/algorithmique/${c.slug}`}
                    className="card group flex h-full flex-col p-carte transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_40px_-20px_var(--primary)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-3xl text-primary/90">{String(c.numero).padStart(2, "0")}</span>
                      <StatutPastille statut={statut} premier={!aCommence && c.numero === 1} />
                    </div>
                    <div className="mt-3 rounded-2xl bg-gradient-to-br from-primary-soft to-[#f3efff] dark:to-surface-2">
                      <VisuelChapitre numero={c.numero} className="w-full" />
                    </div>
                    <h3 className="mt-4 text-[17px] font-bold leading-snug">{c.titre}</h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-text/70">{c.resume}</p>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm text-muted">
                        <Clock size={15} /> {c.duree} min
                      </span>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-3 py-2 text-[13px] font-semibold text-on-primary transition-transform group-hover:translate-x-0.5">
                        {statut === "termine" ? "Revoir" : statut === "en_cours" ? (aCommence ? "Continuer" : "Commencer") : "Découvrir"}
                        <Play size={13} fill="currentColor" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </CoqueRessources>
  );
}

function CarteProgression({ lecture }: { lecture: LectureCours }) {
  const faits = lecture.termines?.length ?? 0;
  const part = faits / CHAPITRES.length;
  const rayon = 34;
  const tour = 2 * Math.PI * rayon;
  return (
    <section className="card p-carte" aria-labelledby="titre-progression">
      <h2 id="titre-progression" className="text-[17px] font-bold">
        Ta progression
      </h2>
      <div className="mt-4 flex items-center gap-5">
        <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0 -rotate-90" aria-hidden>
          <circle cx="42" cy="42" r={rayon} fill="none" stroke="var(--primary-soft)" strokeWidth="9" />
          {part > 0 && <circle
            cx="42"
            cy="42"
            r={rayon}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${tour * part} ${tour}`}
            className="transition-[stroke-dasharray] duration-700"
          />}
        </svg>
        <div>
          <p className="text-3xl font-extrabold text-text">{lecture.termines ? `${Math.round(part * 100)} %` : "…"}</p>
          <p className="text-sm text-muted">
            {faits} / {CHAPITRES.length} chapitres terminés
          </p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-soft" role="progressbar" aria-valuemin={0} aria-valuemax={CHAPITRES.length} aria-valuenow={faits} aria-label="Chapitres terminés">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-lavande transition-[width] duration-700" style={{ width: `${part * 100}%` }} />
      </div>
      <p className="mt-3 text-xs text-muted">Enregistrée sur ton profil.</p>
    </section>
  );
}

function ContenuDuCours({ lecture }: { lecture: LectureCours }) {
  const aCommence = !!lecture.termines?.length;
  return (
    <section className="card p-carte" aria-labelledby="titre-contenu">
      <h2 id="titre-contenu" className="text-[17px] font-bold">
        Contenu du cours
      </h2>
      <ol className="relative mt-4 flex flex-col gap-1">
        {CHAPITRES.map((c, n) => {
          const statut = lecture.statut(c.slug);
          return (
            <li key={c.slug} className="relative">
              {n < CHAPITRES.length - 1 && (
                <span aria-hidden className={`absolute left-[17px] top-11 h-[calc(100%-1.75rem)] w-0.5 ${statut === "termine" ? "bg-primary" : "bg-border"}`} />
              )}
              <Link href={`/ressources/algorithmique/${c.slug}`} className="flex gap-3 rounded-xl p-1.5 transition-colors hover:bg-primary-soft/60">
                <span
                  className={`relative z-10 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                    statut === "termine"
                      ? "bg-primary text-white"
                      : statut === "en_cours"
                        ? "border-2 border-primary bg-surface text-primary"
                        : "border-2 border-border bg-surface text-muted"
                  }`}
                >
                  {statut === "termine" ? <Check size={16} strokeWidth={3} /> : String(c.numero).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-snug">{c.titre}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {c.duree} min
                    </span>
                    <StatutPastille statut={statut} premier={!aCommence && c.numero === 1} petit />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
