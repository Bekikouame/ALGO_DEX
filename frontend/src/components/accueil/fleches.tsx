"use client";

import { X } from "lucide-react";
import { createContext, useContext, useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";

/** Ce que les flèches de l'accueil désignent. */
export type Cible = "code" | "visualisation" | "exercices" | "parcours";

const Contexte = createContext<{ actif: Cible | null; activer: (c: Cible | null) => void }>({
  actif: null,
  activer: () => {},
});

export function FournisseurFleches({ children }: { children: ReactNode }) {
  const [actif, activer] = useState<Cible | null>(null);

  // Échap ou un toucher ailleurs referme l'explication ouverte.
  useEffect(() => {
    if (!actif) return;
    const echap = (e: KeyboardEvent) => e.key === "Escape" && activer(null);
    const dehors = (e: PointerEvent) => !(e.target as Element).closest("[data-fleche]") && activer(null);
    window.addEventListener("keydown", echap);
    document.addEventListener("pointerdown", dehors);
    return () => {
      window.removeEventListener("keydown", echap);
      document.removeEventListener("pointerdown", dehors);
    };
  }, [actif]);

  return <Contexte.Provider value={{ actif, activer }}>{children}</Contexte.Provider>;
}

/** Attributs à poser sur la destination d'une flèche : elle s'éclaire quand la flèche est active. */
export function useCible(cible: Cible) {
  const actif = useContext(Contexte).actif === cible;
  return { "data-cible-active": actif || undefined };
}

/** Un tracé dessiné à la main : la courbe et sa pointe, dans leur propre repère. */
export type Trace = { largeur: number; hauteur: number; d: string; pointe: string; className?: string };

/**
 * Flèche manuscrite qui explique une partie de l'expérience.
 * Survol, clavier ou toucher : elle se retrace, sa destination s'éclaire, l'explication s'affiche
 * et `onActiver` agit sur la démonstration (changer de niveau, relancer l'exécution…).
 */
export function Fleche({
  cible,
  nom,
  explication,
  traces,
  couleur,
  className = "",
  bulle = "",
  onActiver,
}: {
  cible: Cible;
  nom: string;
  explication: string;
  traces: Trace[];
  couleur: "menthe" | "rose" | "lavande";
  className?: string;
  bulle?: string;
  onActiver?: () => void;
}) {
  const { actif: courant, activer } = useContext(Contexte);
  const actif = courant === cible;
  const id = useId();

  function ouvrir() {
    if (actif) return;
    activer(cible);
    onActiver?.();
  }

  return (
    <span
      data-fleche
      data-actif={actif || undefined}
      style={{ "--fleche": `var(--${couleur})` } as CSSProperties}
      className={`fleche relative z-20 ${className}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && ouvrir()}
      onPointerLeave={(e) => e.pointerType === "mouse" && actif && activer(null)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && actif && activer(null)}
    >
      <button
        type="button"
        aria-label={`Explication : ${nom}`}
        aria-expanded={actif}
        aria-describedby={id}
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && ouvrir()}
        onClick={(e) => {
          // Au toucher, un second appui referme ; à la souris, le survol garde l'explication ouverte.
          const souris = (e.nativeEvent as PointerEvent).pointerType === "mouse";
          if (!actif) ouvrir();
          else if (!souris) activer(null);
        }}
        className="block cursor-pointer rounded-xl p-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--fleche)]"
      >
        {traces.map((t, k) => (
          <svg key={k} width={t.largeur} height={t.hauteur} viewBox={`0 0 ${t.largeur} ${t.hauteur}`} className={t.className} aria-hidden>
            <path d={t.d} className="fleche-trait" />
            <path d={t.pointe} className="fleche-pointe" />
          </svg>
        ))}
      </button>
      <span
        id={id}
        hidden={!actif}
        aria-live="polite"
        className={`absolute top-full z-30 mt-1 flex w-56 items-start gap-2 rounded-xl border border-[var(--fleche)]/50 bg-surface p-3 text-left text-sm leading-snug text-text shadow-card ${bulle}`}
      >
        <span className="flex-1">{explication}</span>
        <button
          type="button"
          onClick={() => activer(null)}
          aria-label="Fermer l'explication"
          className="-m-1 rounded-md p-1 text-muted hover:text-text"
        >
          <X size={14} />
        </button>
      </span>
    </span>
  );
}
