import type { StatutChapitre } from "@/lib/progression-cours";

/**
 * L'état d'un chapitre. « En cours » désigne le prochain chapitre à lire ;
 * tant qu'aucun chapitre n'est terminé, le premier est seulement « À commencer ».
 */
export function StatutPastille({ statut, premier = false, petit = false }: { statut: StatutChapitre; premier?: boolean; petit?: boolean }) {
  const { texte, classe } =
    statut === "termine"
      ? { texte: "Terminé", classe: "bg-success-soft text-success" }
      : statut === "en_cours"
        ? premier
          ? { texte: "À commencer", classe: "bg-primary-soft text-primary" }
          : { texte: "En cours", classe: "bg-primary-soft text-primary" }
        : { texte: "À venir", classe: "bg-surface-2 text-muted" };
  return <span className={`inline-flex items-center rounded-full font-semibold ${petit ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"} ${classe}`}>{texte}</span>;
}
