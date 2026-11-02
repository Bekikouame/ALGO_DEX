"use client";

import { ArrowRight, BookOpen, Clock, Languages, Newspaper, Telescope } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CoqueRessources } from "@/components/ressources/coque-ressources";
import { SceneCours } from "@/components/ressources/illustrations";
import { api } from "@/lib/api";
import { CHAPITRES, DUREE_TOTALE, formaterDuree } from "@/lib/cours";
import { useLectureCours } from "@/lib/progression-cours";
import { useProfilActif } from "@/lib/profils";

const AUTRES = [
  {
    href: "/langages",
    icone: Languages,
    titre: "Documentation",
    texte: "Un même algorithme écrit en Python, JavaScript, Java et C, débloqué notion par notion.",
  },
  {
    href: "/ressources/exercices",
    icone: Telescope,
    titre: "Exercices",
    texte: "La bibliothèque d'exercices du cours, à faire dans le laboratoire : écris, prédis, exécute et compare.",
  },
];

/** La rubrique Ressources : le cours d'algorithmique et les autres supports. */
export default function Ressources() {
  const profilId = useProfilActif();
  const [pseudo, setPseudo] = useState<string>();
  const lecture = useLectureCours(profilId);

  useEffect(() => {
    if (!profilId) return;
    api
      .cockpit(profilId)
      .then((c) => setPseudo(c.profil.pseudo))
      .catch(() => {});
  }, [profilId]);

  return (
    <CoqueRessources pseudo={pseudo}>
      <h1 className="font-display text-[2.8rem] leading-none tracking-tight">Ressources</h1>
      <p className="mt-3 max-w-xl text-text/75">Tout pour apprendre à ton rythme : un cours complet, la documentation des langages et les exercices.</p>

      <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-muted">Cours</h2>
      <Link
        href="/ressources/algorithmique"
        className="card group mt-3 grid items-center gap-6 overflow-hidden p-6 transition-colors hover:border-primary/40 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]"
      >
        <div>
          <span className="inline-flex rounded-lg bg-primary-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">Cours</span>
          <h3 className="mt-3 font-display text-4xl">Algorithmique</h3>
          <p className="mt-2 max-w-md text-text/75">Apprends à penser comme un ordinateur, pas besoin d&apos;être un génie, juste de la méthode&nbsp;!</p>
          <p className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <BookOpen size={15} /> {CHAPITRES.length} chapitres
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={15} /> {formaterDuree(DUREE_TOTALE)} environ
            </span>
            {lecture.termines && (
              <span>
                {lecture.termines.length} / {CHAPITRES.length} terminés
              </span>
            )}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 font-semibold text-primary">
            Ouvrir le cours <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
        <SceneCours className="hidden w-full md:block" />
      </Link>

      <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-muted">Et aussi</h2>
      <ul className="mt-3 grid gap-4 md:grid-cols-3">
        {AUTRES.map(({ href, icone: Icone, titre, texte }) => (
          <li key={href}>
            <Link href={href} className="card flex h-full flex-col p-5 transition-colors hover:border-primary/40">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icone size={19} />
              </span>
              <span className="mt-3 font-bold">{titre}</span>
              <span className="mt-1 text-sm text-text/70">{texte}</span>
            </Link>
          </li>
        ))}
        <li>
          <div className="card flex h-full flex-col p-5 opacity-60" aria-disabled>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-muted">
              <Newspaper size={19} />
            </span>
            <span className="mt-3 font-bold">Blog</span>
            <span className="mt-1 text-sm text-text/70">Bientôt : des articles pour aller plus loin.</span>
          </div>
        </li>
      </ul>
    </CoqueRessources>
  );
}
