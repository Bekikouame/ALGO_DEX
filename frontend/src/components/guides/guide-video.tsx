"use client";

import { Mascotte } from "@/components/marque";
import { VIDEOS, type CleGuide } from "@/lib/guides-apprenant";
import type { EtapeGuide } from "./visite-guidee";

/**
 * Le mini-guide vidéo : monté seulement à la demande, rien n'est téléchargé avant « lecture ».
 * Les commandes natives donnent lecture, pause, progression, son et sous-titres ; jamais de lancement automatique.
 */
export function GuideVideo({ cle, etapes, titreCache = false }: { cle: CleGuide; etapes: EtapeGuide[]; titreCache?: boolean }) {
  const video = VIDEOS[cle];
  return (
    <div>
      {titreCache && (
        <h2 id="titre-etape-guide" className="sr-only">
          Guide vidéo
        </h2>
      )}
      {video.source ? (
        <video
          controls
          playsInline
          preload="none"
          poster={video.affiche ?? undefined}
          className="aspect-video w-full rounded-xl bg-[#0b0d29]"
        >
          <source src={video.source} />
          {video.sousTitres && <track kind="subtitles" srcLang="fr" label="Français" src={video.sousTitres} default />}
        </video>
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-bg/70 p-3 text-center">
          <Mascotte taille={52} />
          <p className="text-sm font-semibold">Guide vidéo bientôt disponible</p>
          <p className="text-xs text-muted">La visite guidée fonctionne déjà.</p>
        </div>
      )}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-medium">Transcription</summary>
        <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-muted">
          {etapes.map((e) => (
            <li key={e.titre}>
              <strong className="text-text">{e.titre}.</strong> {e.transcription}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
