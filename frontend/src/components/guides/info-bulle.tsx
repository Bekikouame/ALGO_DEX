"use client";

import { Info } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Petite aide contextuelle : s'ouvre au clic ou au clavier, se referme avec Échap ou un clic ailleurs. */
export function InfoBulle({ etiquette, children, clair = false }: { etiquette: string; children: ReactNode; clair?: boolean }) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const bulle = useRef<HTMLDivElement>(null);

  function basculer() {
    if (position) return setPosition(null);
    const r = bouton.current?.getBoundingClientRect();
    if (!r) return;
    const largeur = Math.min(260, window.innerWidth - 24);
    const left = Math.min(Math.max(12, r.left + r.width / 2 - largeur / 2), window.innerWidth - largeur - 12);
    setPosition({ top: Math.min(r.bottom + 8, window.innerHeight - 140), left });
  }

  useEffect(() => {
    if (!position) return;
    const fermer = () => setPosition(null);
    const touche = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      fermer();
      bouton.current?.focus();
    };
    const dehors = (e: PointerEvent) => {
      const cible = e.target as Node;
      if (!bulle.current?.contains(cible) && !bouton.current?.contains(cible)) fermer();
    };
    window.addEventListener("keydown", touche);
    document.addEventListener("pointerdown", dehors);
    window.addEventListener("resize", fermer);
    document.addEventListener("scroll", fermer, true);
    return () => {
      window.removeEventListener("keydown", touche);
      document.removeEventListener("pointerdown", dehors);
      window.removeEventListener("resize", fermer);
      document.removeEventListener("scroll", fermer, true);
    };
  }, [position]);

  return (
    <>
      <button
        ref={bouton}
        type="button"
        onClick={basculer}
        aria-label={etiquette}
        aria-expanded={!!position}
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
          clair ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-muted hover:bg-surface-2 hover:text-text"
        }`}
      >
        <Info size={15} aria-hidden />
      </button>
      {position &&
        createPortal(
          <div
            ref={bulle}
            role="tooltip"
            className="fixed z-[72] w-[min(16.25rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-text shadow-xl"
            style={position}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
