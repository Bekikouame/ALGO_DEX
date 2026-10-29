"use client";

import { useId } from "react";

export function Logo({ taille = 36 }: { taille?: number }) {
  const id = useId();
  return (
    <svg width={taille} height={taille} viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--hero-from)" />
          <stop offset="1" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      <path d="M20 2 36 11v18L20 38 4 29V11z" fill={`url(#${id})`} />
      <path d="M20 2v18m0 0 16-9M20 20 4 11m16 9v18" stroke="white" strokeOpacity=".35" strokeWidth="1.5" fill="none" />
      <path d="M20 12l7 4v8l-7 4-7-4v-8z" fill="white" fillOpacity=".9" />
    </svg>
  );
}

export function Marque({ sousTitre = true }: { sousTitre?: boolean }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Logo />
      <div className="leading-tight">
        <div className="text-lg font-bold tracking-tight sm:text-xl">ALGO_DEX</div>
        {sousTitre && <div className="hidden text-xs tracking-wide text-muted sm:block">Laboratoire de logique</div>}
      </div>
    </div>
  );
}

/** Le petit robot des deux maquettes, dessiné en SVG. */
export function Mascotte({ taille = 96, className = "" }: { taille?: number; className?: string }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 100 100" className={className} aria-hidden>
      <ellipse cx="50" cy="92" rx="26" ry="5" fill="var(--primary)" opacity=".18" />
      <line x1="50" y1="14" x2="50" y2="24" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="11" r="5" fill="var(--accent)" />
      <rect x="18" y="24" width="64" height="48" rx="22" fill="var(--surface)" stroke="var(--primary)" strokeWidth="3" />
      <rect x="27" y="34" width="46" height="26" rx="13" fill="var(--code-bg)" />
      <ellipse cx="40" cy="47" rx="5" ry="6.5" fill="#6ee7ff" />
      <ellipse cx="60" cy="47" rx="5" ry="6.5" fill="#6ee7ff" />
      <circle cx="41.5" cy="45" r="1.6" fill="white" />
      <circle cx="61.5" cy="45" r="1.6" fill="white" />
      <rect x="12" y="40" width="7" height="16" rx="3.5" fill="var(--primary)" />
      <rect x="81" y="40" width="7" height="16" rx="3.5" fill="var(--primary)" />
      <rect x="36" y="72" width="28" height="14" rx="7" fill="var(--surface)" stroke="var(--primary)" strokeWidth="3" />
    </svg>
  );
}

export function Avatar({ pseudo, taille = 40 }: { pseudo: string; taille?: number }) {
  const initiales = pseudo
    .split(/\s+/)
    .map((m) => m[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-on-primary"
      style={{ width: taille, height: taille, fontSize: taille * 0.38 }}
      aria-hidden
    >
      {initiales}
    </span>
  );
}
