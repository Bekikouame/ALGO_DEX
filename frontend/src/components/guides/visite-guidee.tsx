"use client";

import { ArrowLeft, ArrowRight, MonitorPlay, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { marquerConsulte, VIDEOS, type CleGuide } from "@/lib/guides-apprenant";
import { GuideVideo } from "./guide-video";

export type EtapeGuide = {
  titre: string;
  texte: ReactNode;
  /** Valeur de l'attribut data-guide du composant à montrer. Sans cible, la bulle reste dans son coin. */
  cible?: string;
  /** Composant montré si la cible n'est pas à l'écran (ex. commandes absentes avant la première exécution). */
  secours?: string;
  /** Texte ajouté quand la cible principale n'est pas à l'écran. */
  siAbsente?: ReactNode;
  visuel?: ReactNode;
  /** Résumé en texte brut, pour la transcription de la vidéo. */
  transcription: string;
};

type Rect = { top: number; left: number; width: number; height: number };

const MARGE = 12;
const ECART = 14;

function trouver(cible?: string): HTMLElement | null {
  if (!cible) return null;
  const elements = document.querySelectorAll<HTMLElement>(`[data-guide="${cible}"]`);
  return [...elements].find((e) => e.getClientRects().length > 0) ?? null;
}

/** La bulle se place à côté du composant sans le couvrir ; si la place manque, elle se range en bas de l'écran. */
function placer(r: Rect | null, l: number, h: number): { top: number; left: number } {
  const larg = window.innerWidth;
  const haut = window.innerHeight;
  const coin = { top: Math.max(MARGE, haut - h - MARGE), left: Math.max(MARGE, larg - l - MARGE) };
  if (!r) return coin;
  const borneL = (x: number) => Math.min(Math.max(MARGE, x), larg - l - MARGE);
  const borneH = (y: number) => Math.min(Math.max(MARGE, y), haut - h - MARGE);
  // Sur grand écran, à côté plutôt que dessous : l'éditeur, sous l'énoncé, reste libre.
  if (larg >= 1024 && r.left + r.width + ECART + l <= larg - MARGE) return { top: borneH(r.top), left: r.left + r.width + ECART };
  if (r.top + r.height + ECART + h <= haut - MARGE) return { top: r.top + r.height + ECART, left: borneL(r.left) };
  if (r.top - ECART - h >= MARGE) return { top: r.top - ECART - h, left: borneL(r.left) };
  if (r.left + r.width + ECART + l <= larg - MARGE) return { top: borneH(r.top), left: r.left + r.width + ECART };
  if (r.left - ECART - l >= MARGE) return { top: borneH(r.top), left: r.left - ECART - l };
  return coin;
}

/**
 * Visite guidée non bloquante : aucun voile sur la page, le composant reste visible et utilisable,
 * seul un contour le signale. La bulle se ferme à tout moment.
 */
export function VisiteGuidee({
  cle,
  titre,
  etapes,
  videoDabord = false,
  onFermer,
}: {
  cle: CleGuide;
  titre: string;
  etapes: EtapeGuide[];
  /** Ouvre directement la vidéo ; la visite guidée reste à un clic. */
  videoDabord?: boolean;
  onFermer: () => void;
}) {
  const [n, setN] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [absente, setAbsente] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [video, setVideo] = useState(videoDabord);
  const bulle = useRef<HTMLDivElement>(null);
  const titreEtape = useRef<HTMLHeadingElement>(null);
  const etape = etapes[n];
  const derniere = n === etapes.length - 1;

  const fermer = useCallback(() => {
    marquerConsulte(cle);
    onFermer();
  }, [cle, onFermer]);

  // Amène le composant à l'écran quand l'étape change.
  useEffect(() => {
    const element = video ? null : (trouver(etape.cible) ?? trouver(etape.secours));
    if (element) {
      const haut = element.getBoundingClientRect().height;
      element.style.scrollMarginTop = "76px";
      element.scrollIntoView({ block: haut < window.innerHeight * 0.4 ? "center" : "start", behavior: "auto" });
    }
    titreEtape.current?.focus({ preventScroll: true });
  }, [etape, video]);

  // Le contour et la bulle suivent le composant : défilement, redimensionnement, panneau déplacé.
  useLayoutEffect(() => {
    let image = 0;
    let precedent = "";
    const suivre = () => {
      const principal = trouver(etape.cible);
      const element = principal ?? trouver(etape.secours);
      // Pendant la vidéo, rien n'est signalé dans la page : la fenêtre reste dans son coin.
      const r = video ? null : (element?.getBoundingClientRect() ?? null);
      const b = bulle.current;
      const cle = `${r?.top},${r?.left},${r?.width},${r?.height},${b?.offsetWidth},${b?.offsetHeight},${window.innerWidth},${window.innerHeight}`;
      if (cle !== precedent) {
        precedent = cle;
        setRect(r && { top: r.top, left: r.left, width: r.width, height: r.height });
        setAbsente(!!etape.cible && !principal);
        if (b) setPosition(placer(r, b.offsetWidth, b.offsetHeight));
      }
      image = requestAnimationFrame(suivre);
    };
    suivre();
    return () => cancelAnimationFrame(image);
  }, [etape, video]);

  useEffect(() => {
    const echap = (e: KeyboardEvent) => {
      if (e.key === "Escape" && bulle.current?.contains(e.target as Node)) fermer();
    };
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [fermer]);

  return createPortal(
    <>
      {rect && (
        <div
          aria-hidden
          data-guide-contour
          className="pointer-events-none fixed z-[70] rounded-2xl outline outline-2 outline-offset-2 outline-primary shadow-[0_0_0_6px_color-mix(in_oklab,var(--primary)_18%,transparent)] transition-all duration-200"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      )}
      <div
        ref={bulle}
        role="dialog"
        aria-modal="false"
        aria-labelledby="titre-etape-guide"
        data-guide-bulle
        className={`fixed z-[71] flex max-h-[min(80vh,38rem)] flex-col rounded-2xl border border-primary/40 bg-surface shadow-2xl ${video ? "w-[min(34rem,calc(100vw-1.5rem))]" : "w-[min(23rem,calc(100vw-1.5rem))]"}`}
        style={position ? { top: position.top, left: position.left } : { right: MARGE, bottom: MARGE }}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-muted">{titre}</span>
          <button
            type="button"
            onClick={() => setVideo((v) => !v)}
            aria-pressed={video}
            title={VIDEOS[cle].source ? "Regarder la vidéo" : "Guide vidéo"}
            className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-text"
          >
            <MonitorPlay size={15} aria-hidden /> Vidéo
          </button>
          <button type="button" onClick={fermer} aria-label="Fermer le guide" className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-text">
            <X size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3" aria-live="polite">
          {video ? (
            <GuideVideo cle={cle} etapes={etapes} titreCache />
          ) : (
            <>
              <h2 id="titre-etape-guide" ref={titreEtape} tabIndex={-1} className="font-display text-xl leading-snug outline-none">
                {etape.titre}
              </h2>
              <div className="mt-1.5 text-sm leading-relaxed text-muted">{etape.texte}</div>
              {absente && etape.siAbsente && <div className="mt-2 text-sm leading-relaxed text-muted">{etape.siAbsente}</div>}
              {etape.visuel && <div className="mt-3">{etape.visuel}</div>}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-border px-4 py-2.5">
          <span className="flex items-center gap-2 text-xs text-muted">
            <span className="flex gap-1" aria-hidden>
              {etapes.map((_, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === n ? "bg-primary" : i < n ? "bg-primary/40" : "bg-border"}`} />
              ))}
            </span>
            Étape {n + 1} sur {etapes.length}
          </span>
          <button
            type="button"
            onClick={() => {
              setVideo(false);
              setN((x) => x - 1);
            }}
            disabled={n === 0}
            aria-label="Étape précédente du guide"
            className="ml-auto rounded-lg border border-border p-1.5 disabled:opacity-40"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (video) return setVideo(false);
              if (derniere) fermer();
              else setN((x) => x + 1);
            }}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-on-primary"
          >
            {video ? "Visite guidée" : derniere ? "Terminer" : "Suivant"} {(video || !derniere) && <ArrowRight size={15} aria-hidden />}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
