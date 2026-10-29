import { CheckCircle2, Circle, Lock, Square, Trophy } from "lucide-react";
import Link from "next/link";
import { LIBELLES_NOTION, type Etat, type LigneCarte, type Notion } from "@/lib/api";

const ETATS: Record<Etat, { libelle: string; icone: typeof Trophy; classe: string }> = {
  demontree: { libelle: "Validée au test de niveau", icone: Trophy, classe: "text-trophy" },
  validee: { libelle: "Validée", icone: CheckCircle2, classe: "text-success" },
  en_cours: { libelle: "En cours", icone: Circle, classe: "text-primary fill-current" },
  a_faire: { libelle: "À faire", icone: Square, classe: "text-muted" },
};

/** La carte de maîtrise (F8) : quatre notions, quatre états, aucune note. */
export function CarteMaitrise({
  carte,
  debloquees,
  liens = {},
  prochaine,
}: {
  carte: LigneCarte[];
  debloquees: Notion[];
  liens?: Partial<Record<Notion, string>>;
  prochaine?: Notion | null;
}) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {carte.map((ligne, k) => {
        const ouverte = debloquees.includes(ligne.notion);
        const { libelle, icone: Icone, classe } = ETATS[ligne.etat];
        const lien = ouverte ? liens[ligne.notion] : undefined;
        const estProchaine = ligne.notion === prochaine;
        const contenu = (
          <>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted">0{k + 1}</span>
              {ouverte ? <Icone size={22} className={classe} /> : <Lock size={18} className="text-muted" />}
            </div>
            <div className="mt-4 font-display text-xl font-semibold">{LIBELLES_NOTION[ligne.notion]}</div>
            <div className="mt-1 text-sm text-muted">
              {ouverte ? libelle : `S'ouvre après ${LIBELLES_NOTION[carte[k - 1]?.notion ?? ligne.notion].toLowerCase()}`}
            </div>
            {estProchaine && (
              <span className="mt-3 inline-block rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-on-primary">
                prochaine étape
              </span>
            )}
          </>
        );
        const classes = `card block h-full p-4 transition-all ${estProchaine ? "ring-2 ring-primary" : ""} ${
          lien ? "hover:-translate-y-0.5 hover:border-primary" : ""
        } ${ouverte ? "" : "opacity-60"}`;
        return (
          <li key={ligne.notion}>
            {lien ? (
              <Link href={lien} className={classes}>
                {contenu}
              </Link>
            ) : (
              <div className={classes}>{contenu}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function LegendeCarte() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
      {(Object.keys(ETATS) as Etat[]).map((e) => {
        const { libelle, icone: Icone, classe } = ETATS[e];
        return (
          <li key={e} className="flex items-center gap-1.5">
            <Icone size={14} className={classe} /> {libelle}
          </li>
        );
      })}
    </ul>
  );
}
