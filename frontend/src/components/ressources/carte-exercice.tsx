import { ArrowRight, CheckCircle2, Lock, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { LIBELLES_NOTION, type ExerciceBibliotheque } from "@/lib/api";
import { CHAPITRES } from "@/lib/cours";

export type EtatExercice = "reussi" | "commence" | "a_faire" | "verrouille";

export const etatExercice = (e: ExerciceBibliotheque): EtatExercice =>
  !e.accessible ? "verrouille" : e.reussi ? "reussi" : e.tentative_en_cours ? "commence" : "a_faire";

export const LIBELLES_ETAT: Record<EtatExercice, string> = {
  reussi: "Réussi",
  commence: "Commencé",
  a_faire: "À faire",
  verrouille: "Verrouillé",
};

/** Le chapitre du cours qui prépare une notion. */
export const chapitreDeNotion = (notion: ExerciceBibliotheque["notion"]) => CHAPITRES.find((c) => c.notions.includes(notion));

/** Un exercice de la bibliothèque : il s'ouvre dans le laboratoire, sauf si sa notion est encore verrouillée. */
export function CarteExercice({ exercice, avecChapitre = true }: { exercice: ExerciceBibliotheque; avecChapitre?: boolean }) {
  const etat = etatExercice(exercice);
  const chapitre = chapitreDeNotion(exercice.notion);
  const pastille = {
    reussi: "bg-success-soft text-success",
    commence: "bg-warning-soft text-warning",
    a_faire: "bg-primary-soft text-primary",
    verrouille: "bg-surface-2 text-muted",
  }[etat];
  const Icone = { reussi: CheckCircle2, commence: RotateCcw, a_faire: Play, verrouille: Lock }[etat];

  const contenu = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-lg bg-primary-soft/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
          {LIBELLES_NOTION[exercice.notion]}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${pastille}`}>
          <Icone size={12} fill={etat === "a_faire" ? "currentColor" : "none"} /> {LIBELLES_ETAT[etat]}
        </span>
      </div>
      <h3 className="mt-3 text-[16px] font-bold leading-snug">{exercice.titre}</h3>
      <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-text/70">{exercice.enonce}</p>
      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted">
        {avecChapitre && chapitre ? <span>Chapitre {chapitre.numero} · {chapitre.titre}</span> : <span />}
        {etat === "verrouille" ? (
          <span className="shrink-0">S&apos;ouvre avec ton parcours</span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary">
            {etat === "reussi" ? "Refaire" : etat === "commence" ? "Reprendre" : "Commencer"} <ArrowRight size={14} />
          </span>
        )}
      </div>
    </>
  );

  return etat === "verrouille" ? (
    <div className="card flex h-full flex-col p-5 opacity-60" aria-disabled>
      {contenu}
    </div>
  ) : (
    <Link
      href={`/exercice/${exercice.id}`}
      className="card flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-22px_var(--primary)]"
    >
      {contenu}
    </Link>
  );
}
