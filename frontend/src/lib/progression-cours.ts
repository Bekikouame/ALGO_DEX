"use client";

// Lecture du cours : les chapitres que l'élève a marqués comme terminés.
// Le moteur ne stocke pas encore la lecture des cours (aucun modèle Cours ni Chapitre côté backend) :
// on la garde sur l'appareil, par profil, en attendant un point d'API dédié.

import { useSyncExternalStore } from "react";
import { CHAPITRES } from "./cours";

const EVENEMENT = "algodex-cours";
const cle = (profilId: string) => `algodex.cours.${profilId}`;

function abonner(rappel: () => void) {
  window.addEventListener("storage", rappel);
  window.addEventListener(EVENEMENT, rappel);
  return () => {
    window.removeEventListener("storage", rappel);
    window.removeEventListener(EVENEMENT, rappel);
  };
}

// Chaîne brute : useSyncExternalStore compare par identité, le tableau est reconstruit à la lecture.
function lireBrut(profilId: string | null): string {
  if (!profilId) return "[]";
  try {
    return localStorage.getItem(cle(profilId)) ?? "[]";
  } catch {
    return "[]";
  }
}

function analyser(brut: string): string[] {
  try {
    const slugs = JSON.parse(brut);
    return Array.isArray(slugs) ? slugs.filter((s) => CHAPITRES.some((c) => c.slug === s)) : [];
  } catch {
    return [];
  }
}

export function marquerChapitre(profilId: string, slug: string, termine: boolean) {
  const actuels = analyser(lireBrut(profilId)).filter((s) => s !== slug);
  try {
    localStorage.setItem(cle(profilId), JSON.stringify(termine ? [...actuels, slug] : actuels));
  } catch {}
  window.dispatchEvent(new Event(EVENEMENT));
}

export type StatutChapitre = "termine" | "en_cours" | "a_venir";

export interface LectureCours {
  /** null tant que l'appareil n'a pas été lu (rendu serveur). */
  termines: string[] | null;
  statut: (slug: string) => StatutChapitre;
  /** Le premier chapitre non terminé : celui que « Commencer le cours » ouvre. */
  suivant: (typeof CHAPITRES)[number];
}

export function useLectureCours(profilId: string | null): LectureCours {
  const brut = useSyncExternalStore(abonner, () => lireBrut(profilId), () => null);
  const termines = brut === null ? null : analyser(brut);
  const suivant = CHAPITRES.find((c) => !termines?.includes(c.slug)) ?? CHAPITRES[0];
  const tousFinis = termines !== null && termines.length === CHAPITRES.length;
  return {
    termines,
    suivant,
    statut: (slug) => (termines?.includes(slug) ? "termine" : !tousFinis && slug === suivant.slug ? "en_cours" : "a_venir"),
  };
}
