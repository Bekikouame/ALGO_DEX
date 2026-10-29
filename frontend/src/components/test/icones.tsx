"use client";

// Icônes dessinées pour le test de niveau : traits dégradés lavande → violet, accent rose,
// tracées à l'apparition (classe « dessin »). Toutes décoratives : le texte voisin porte le sens.
import { useId, type ReactNode } from "react";
import type { Notion } from "@/lib/api";

type Props = { taille?: number; className?: string };

function Toile({ taille = 28, className = "", children, de = "var(--lavande)", a = "var(--primary)" }: Props & { children: (trait: string) => ReactNode; de?: string; a?: string }) {
  const id = useId();
  return (
    <svg width={taille} height={taille} viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={de} />
          <stop offset="1" stopColor={a} />
        </linearGradient>
      </defs>
      {children(`url(#${id})`)}
    </svg>
  );
}

const trait = { strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Lire : une loupe qui balaie des lignes de code. */
export function IconeLire(p: Props) {
  return (
    <Toile {...p}>
      {(t) => (
        <>
          <path d="M8 12h18M8 20h12M8 28h8" stroke={t} {...trait} className="dessin" />
          <circle cx="29" cy="27" r="9" stroke={t} {...trait} className="dessin" />
          <path d="M36 34l6 6" stroke="var(--rose)" {...trait} className="dessin" />
          <path d="M25 25.5a4 4 0 0 1 4-2.5" stroke="var(--rose)" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </Toile>
  );
}

/** Prédire : une boule de cristal et son étincelle. */
export function IconePredire(p: Props) {
  return (
    <Toile {...p}>
      {(t) => (
        <>
          <circle cx="24" cy="21" r="13" stroke={t} {...trait} className="dessin" />
          <path d="M14 40h20M17 34l-3 6M31 34l3 6" stroke={t} {...trait} className="dessin" />
          <path d="M19 17c2-3 5-4 8-3" stroke="var(--rose)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M38 6v6M35 9h6" stroke="var(--rose)" strokeWidth="2.5" strokeLinecap="round" className="scintille" />
        </>
      )}
    </Toile>
  );
}

/** Observer : un écran qui joue, avec l'onde de l'exécution. */
export function IconeObserver(p: Props) {
  return (
    <Toile {...p}>
      {(t) => (
        <>
          <rect x="5" y="9" width="38" height="26" rx="6" stroke={t} {...trait} className="dessin" />
          <path d="M20 16.5v11l9-5.5z" fill="var(--rose)" />
          <path d="M8 42c4-4 8 0 12-3s8 0 12-3 6 1 8 0" stroke={t} strokeWidth="2.5" strokeLinecap="round" className="dessin" />
        </>
      )}
    </Toile>
  );
}

/** Comparer : une balance, prédiction d'un côté, réalité de l'autre. */
export function IconeComparer(p: Props) {
  return (
    <Toile {...p}>
      {(t) => (
        <>
          <path d="M24 6v34M14 42h20M10 12h28" stroke={t} {...trait} className="dessin" />
          <path d="M10 12l-6 13h12zM38 12l-6 13h12z" stroke={t} {...trait} className="dessin" />
          <circle cx="24" cy="6" r="2.5" fill="var(--rose)" />
        </>
      )}
    </Toile>
  );
}

export const ICONES_PHASES = [IconeLire, IconePredire, IconeObserver, IconeComparer];

/** L'emblème de chaque notion : tiroir, embranchement, boucle, cases. */
export function EmblemeNotion({ notion, ...p }: Props & { notion: Notion }) {
  return (
    <Toile {...p}>
      {(t) =>
        notion === "variables" ? (
          <>
            <rect x="7" y="13" width="34" height="24" rx="5" stroke={t} {...trait} className="dessin" />
            <path d="M7 22h34" stroke={t} {...trait} className="dessin" />
            <path d="M20 29h8" stroke="var(--rose)" {...trait} />
            <path d="M16 13l3-6h10l3 6" stroke={t} strokeWidth="2.5" strokeLinejoin="round" className="dessin" />
          </>
        ) : notion === "conditions" ? (
          <>
            <path d="M24 42V28" stroke={t} {...trait} className="dessin" />
            <path d="M24 28c0-8-10-8-14-16M24 28c0-8 10-8 14-16" stroke={t} {...trait} className="dessin" />
            <path d="M24 23l4 5-4 5-4-5z" fill="var(--rose)" />
            <circle cx="9" cy="10" r="3" stroke="var(--menthe)" strokeWidth="2.5" />
            <circle cx="39" cy="10" r="3" stroke={t} strokeWidth="2.5" />
          </>
        ) : notion === "boucles" ? (
          <>
            <path d="M38 24a14 14 0 1 1-5-10.7" stroke={t} {...trait} className="dessin" />
            <path d="M34 6l-1 8 8 1" stroke={t} {...trait} className="dessin" />
            <circle cx="24" cy="24" r="3.5" fill="var(--rose)" />
          </>
        ) : (
          <>
            <rect x="4" y="15" width="12" height="14" rx="3" stroke={t} {...trait} className="dessin" />
            <rect x="18" y="15" width="12" height="14" rx="3" stroke="var(--rose)" {...trait} className="dessin" />
            <rect x="32" y="15" width="12" height="14" rx="3" stroke={t} {...trait} className="dessin" />
            <path d="M10 36v3M24 36v3M38 36v3" stroke={t} strokeWidth="2.5" strokeLinecap="round" />
          </>
        )
      }
    </Toile>
  );
}

/** Verdict juste : une coche qui se trace, entourée d'étincelles. */
export function CocheTracee(p: Props) {
  return (
    <Toile {...p} de="var(--menthe)" a="color-mix(in oklab, var(--menthe) 60%, var(--primary))">
      {(t) => (
        <>
          <circle cx="24" cy="24" r="17" stroke={t} {...trait} className="dessin" />
          <path d="M16 24.5l5.5 5.5L33 18" stroke={t} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="dessin dessin-tard" />
          <path d="M42 6v5M39.5 8.5h5M6 38v4M4 40h4" stroke="var(--rose)" strokeWidth="2" strokeLinecap="round" className="scintille" />
        </>
      )}
    </Toile>
  );
}

/** Écart : deux traces qui divergent, la prédiction et la réalité. */
export function Ecart(p: Props) {
  return (
    <Toile {...p} de="var(--rose)" a="color-mix(in oklab, var(--rose) 55%, var(--primary))">
      {(t) => (
        <>
          <path d="M6 30c8 0 12-4 16-10" stroke={t} {...trait} className="dessin" />
          <path d="M22 20c4-6 10-10 20-10" stroke={t} {...trait} className="dessin dessin-tard" />
          <path d="M22 20c5 8 11 14 20 14" stroke="var(--lavande)" strokeWidth="3" strokeLinecap="round" strokeDasharray="3 5" />
          <circle cx="22" cy="20" r="3.5" fill="var(--rose)" />
        </>
      )}
    </Toile>
  );
}

/** Le point de départ : un drapeau planté. */
export function Drapeau(p: Props) {
  return (
    <Toile {...p} de="var(--rose)" a="var(--primary)">
      {(t) => (
        <>
          <path d="M12 44V6" stroke={t} {...trait} className="dessin" />
          <path d="M12 8c8-4 14 4 24 0v16c-10 4-16-4-24 0" stroke={t} {...trait} fill="color-mix(in oklab, var(--rose) 18%, transparent)" className="dessin" />
          <path d="M6 44h14" stroke={t} {...trait} />
        </>
      )}
    </Toile>
  );
}

/** Notion démontrée : une coupe et son étoile. */
export function Coupe(p: Props) {
  return (
    <Toile {...p} de="var(--trophy)" a="color-mix(in oklab, var(--trophy) 55%, var(--rose))">
      {(t) => (
        <>
          <path d="M15 8h18v10a9 9 0 0 1-18 0z" stroke={t} {...trait} className="dessin" />
          <path d="M15 12H8c0 6 3 9 7 9M33 12h7c0 6-3 9-7 9M24 27v8M17 40h14" stroke={t} {...trait} className="dessin" />
          <path d="M24 11l1.5 3 3.2.4-2.4 2.2.6 3.2-2.9-1.6-2.9 1.6.6-3.2-2.4-2.2 3.2-.4z" fill="var(--trophy)" />
        </>
      )}
    </Toile>
  );
}

/** Pas encore testée : un cercle en pointillés qui attend. */
export function Attente({ taille = 28, className = "" }: Props) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <circle cx="24" cy="24" r="16" stroke="var(--muted)" strokeWidth="3" strokeDasharray="4 6" strokeLinecap="round" className="tourne-lent" />
    </svg>
  );
}
