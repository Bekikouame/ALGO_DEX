"use client";

import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageErreur } from "@/components/coque";
import { SceneNotion } from "@/components/espace/illustrations";
import {
  CarteExercice,
  chapitreDeNotion,
  etatExercice,
  LIBELLES_ETAT,
  LIBELLES_NIVEAU,
  ordreDifficulte,
  type EtatExercice,
} from "@/components/ressources/carte-exercice";
import { CoqueRessources } from "@/components/ressources/coque-ressources";
import { api, LIBELLES_NOTION, NOTIONS, type ExerciceBibliotheque, type Notion } from "@/lib/api";
import { useProfilActif } from "@/lib/profils";

const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** La bibliothèque : tous les exercices du laboratoire, tirés du cours, par notion. */
export default function BibliothequeExercices() {
  const profilId = useProfilActif();
  const [pseudo, setPseudo] = useState<string>();
  const [exercices, setExercices] = useState<ExerciceBibliotheque[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [notion, setNotion] = useState<Notion | "toutes">("toutes");
  const [etat, setEtat] = useState<EtatExercice | "tous">("tous");
  const [niveau, setNiveau] = useState<keyof typeof LIBELLES_NIVEAU | "tous">("tous");
  const [difficulte, setDifficulte] = useState<number | null>(null);
  const [requete, setRequete] = useState("");

  useEffect(() => {
    if (!profilId) return;
    api
      .bibliotheque(profilId)
      .then((b) => setExercices(b.exercices))
      .catch((e) => setErreur(e.message));
    api
      .cockpit(profilId)
      .then((c) => setPseudo(c.profil.pseudo))
      .catch(() => {});
  }, [profilId]);

  const tous = exercices ?? [];
  const q = sansAccents(requete.trim());
  const visibles = tous.filter(
    (e) =>
      (notion === "toutes" || e.notion === notion) &&
      (etat === "tous" || etatExercice(e) === etat) &&
      (niveau === "tous" || e.niveau === niveau) &&
      (difficulte === null || e.difficulte === difficulte) &&
      (!q || sansAccents(`${e.titre} ${e.enonce}`).includes(q)),
  );
  const reussis = tous.filter((e) => e.reussi).length;

  return (
    <CoqueRessources pseudo={pseudo}>
      <Link href="/ressources" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-primary">
        <ArrowLeft size={16} /> Retour aux ressources
      </Link>
      <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex rounded-lg bg-primary-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">Bibliothèque</span>
          <h1 className="mt-4 font-display text-[2.8rem] leading-none tracking-tight sm:text-[3.4rem]">Exercices</h1>
          <p className="mt-3 max-w-xl text-text/75">
            Les exercices du cours, à faire dans le laboratoire : tu écris l&apos;algorithme, tu prédis, tu exécutes pas à pas, tu compares.
          </p>
        </div>
        {exercices && (
          <div className="card flex items-center gap-4 px-carte py-4">
            <div>
              <p className="text-2xl font-extrabold">
                {reussis} <span className="text-base font-semibold text-muted">/ {tous.length}</span>
              </p>
              <p className="text-xs text-muted">exercices réussis</p>
            </div>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-primary-soft" aria-hidden>
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-lavande" style={{ width: `${tous.length ? (reussis / tous.length) * 100 : 0}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* notions */}
      <div className="mt-section grid grid-cols-2 gap-icone lg:grid-cols-4" role="tablist" aria-label="Notions">
        {NOTIONS.map((n) => {
          const liste = tous.filter((e) => e.notion === n);
          const choisie = notion === n;
          return (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={choisie}
              onClick={() => setNotion(choisie ? "toutes" : n)}
              className={`card flex items-center gap-3 overflow-hidden p-3 text-left transition-all ${choisie ? "border-primary ring-2 ring-primary/25" : "hover:border-primary/40"}`}
            >
              <SceneNotion notion={n} className="hidden h-12 w-20 shrink-0 rounded-xl bg-primary-soft/60 sm:block" />
              <span className="min-w-0">
                <span className="block font-bold">{LIBELLES_NOTION[n]}</span>
                <span className="text-xs text-muted">
                  {exercices ? `${liste.filter((e) => e.reussi).length} / ${liste.length} réussis` : "…"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* filtres */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex h-11 flex-1 items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 text-sm focus-within:border-primary/60 sm:max-w-sm">
          <Search size={16} className="text-muted" aria-hidden />
          <span className="sr-only">Chercher un exercice</span>
          <input
            type="search"
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            placeholder="Chercher un exercice…"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted/80"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="État">
          {(["tous", "a_faire", "commence", "reussi", "verrouille"] as const).map((x) => (
            <button
              key={x}
              type="button"
              aria-pressed={etat === x}
              onClick={() => setEtat(x)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                etat === x ? "bg-primary text-on-primary" : "border border-border bg-surface text-text/75 hover:text-primary"
              }`}
            >
              {x === "tous" ? "Tous" : LIBELLES_ETAT[x]}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-icone flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Niveau">
          {(["tous", "debutant", "intermediaire", "avance"] as const).map((x) => (
            <button
              key={x}
              type="button"
              aria-pressed={niveau === x}
              onClick={() => setNiveau(x)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                niveau === x ? "bg-primary text-on-primary" : "border border-border bg-surface text-text/75 hover:text-primary"
              }`}
            >
              {x === "tous" ? "Tous les niveaux" : LIBELLES_NIVEAU[x]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 sm:ml-3" role="group" aria-label="Difficulté sur 5">
          <span className="text-sm text-muted">Difficulté</span>
          {[1, 2, 3, 4, 5].map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={difficulte === d}
              onClick={() => setDifficulte(difficulte === d ? null : d)}
              className={`h-8 w-8 rounded-full text-sm font-semibold transition-colors ${
                difficulte === d ? "bg-primary text-on-primary" : "border border-border bg-surface text-text/75 hover:text-primary"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {erreur && (
        <div className="mt-6">
          <MessageErreur message={erreur} />
        </div>
      )}
      {!exercices && !erreur && <p className="mt-section text-muted">Chargement de la bibliothèque…</p>}

      {/* exercices, groupés par notion */}
      {exercices &&
        NOTIONS.filter((n) => visibles.some((e) => e.notion === n)).map((n) => {
          const chapitre = chapitreDeNotion(n);
          return (
            <section key={n} className="mt-section" aria-labelledby={`notion-${n}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`notion-${n}`} className="font-display text-[1.8rem]">
                  {LIBELLES_NOTION[n]}
                </h2>
                {chapitre && (
                  <Link href={`/ressources/algorithmique/${chapitre.slug}`} className="text-sm font-medium text-primary hover:underline">
                    Revoir le chapitre {chapitre.numero} : {chapitre.titre}
                  </Link>
                )}
              </div>
              <ul className="mt-bloc grid gap-bloc sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {visibles
                  .filter((e) => e.notion === n)
                  .sort(ordreDifficulte)
                  .map((e) => (
                    <li key={e.id}>
                      <CarteExercice exercice={e} avecChapitre={false} />
                    </li>
                  ))}
              </ul>
            </section>
          );
        })}
      {exercices && visibles.length === 0 && <p className="mt-section text-center text-muted">Aucun exercice ne correspond à ces filtres.</p>}
    </CoqueRessources>
  );
}
