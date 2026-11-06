"use client";

import { useSyncExternalStore } from "react";

export type CleGuide = "test" | "espace";

export type VideoGuide = {
  /** Fichier vidéo, chargé seulement à la demande. Hébergement externe : ajouter son domaine à media-src (next.config.ts). */
  source: string | null;
  sousTitres: string | null;
  affiche: string | null;
};

/** Vidéos de démonstration, tournées sur l'application avec des exercices d'exemple, narration en synthèse vocale. */
export const VIDEOS: Record<CleGuide, VideoGuide> = {
  test: { source: "/guides/test-positionnement.mp4", sousTitres: "/guides/test-positionnement.vtt", affiche: "/guides/test-positionnement.jpg" },
  espace: { source: "/guides/espace-travail.mp4", sousTitres: "/guides/espace-travail.vtt", affiche: "/guides/espace-travail.jpg" },
};

// « Déjà consulté » est gardé sur cet appareil : les profils n'ont pas de préférences côté serveur.
const CLE = "algodex.guides.consultes";
const auditeurs = new Set<() => void>();

function lire(): string {
  try {
    return localStorage.getItem(CLE) ?? "";
  } catch {
    return "";
  }
}

function abonner(rappel: () => void) {
  auditeurs.add(rappel);
  window.addEventListener("storage", rappel);
  return () => {
    auditeurs.delete(rappel);
    window.removeEventListener("storage", rappel);
  };
}

export function marquerConsulte(cle: CleGuide) {
  try {
    const liste = lire().split(",").filter(Boolean);
    if (!liste.includes(cle)) localStorage.setItem(CLE, [...liste, cle].join(","));
  } catch {}
  auditeurs.forEach((rappel) => rappel());
}

/** Vrai côté serveur : le signal « nouveau » n'apparaît qu'une fois le navigateur consulté. */
export function useGuideConsulte(cle: CleGuide): boolean {
  return useSyncExternalStore(abonner, () => lire().split(",").includes(cle), () => true);
}
