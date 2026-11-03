"use client";

// Lecture du cours : les chapitres que l'élève a marqués comme terminés.
// Le moteur les enregistre (/api/cours) ; l'appareil en garde une copie pour un affichage immédiat.
// Les chapitres marqués avant l'enregistrement côté serveur sont envoyés au moteur au premier chargement.

import { useEffect, useSyncExternalStore } from "react";
import { api } from "./api";
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

function ecrireLocal(profilId: string, slugs: string[]) {
  try {
    localStorage.setItem(cle(profilId), JSON.stringify(slugs));
  } catch {}
  window.dispatchEvent(new Event(EVENEMENT));
}

/** Marque un chapitre : affichage immédiat, puis l'état renvoyé par le moteur fait foi. */
export async function marquerChapitre(profilId: string, slug: string, termine: boolean) {
  const avant = analyser(lireBrut(profilId));
  const sans = avant.filter((s) => s !== slug);
  ecrireLocal(profilId, termine ? [...sans, slug] : sans);
  try {
    ecrireLocal(profilId, analyser(JSON.stringify((await api.marquerChapitre(profilId, slug, termine)).termines)));
  } catch {
    ecrireLocal(profilId, avant); // le moteur n'a pas enregistré : on n'affiche pas un état faux
  }
}

const synchronises = new Set<string>();

/** Au premier usage pour ce profil : envoie au moteur ce que l'appareil était seul à connaître, puis adopte l'état du moteur. */
async function synchroniser(profilId: string) {
  if (synchronises.has(profilId)) return;
  synchronises.add(profilId);
  try {
    let { termines } = await api.chapitresLus(profilId);
    for (const slug of analyser(lireBrut(profilId)).filter((s) => !termines.includes(s))) {
      ({ termines } = await api.marquerChapitre(profilId, slug, true));
    }
    ecrireLocal(profilId, analyser(JSON.stringify(termines)));
  } catch {
    synchronises.delete(profilId); // nouvel essai au prochain affichage
  }
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
  useEffect(() => {
    if (profilId) void synchroniser(profilId);
  }, [profilId]);
  const termines = brut === null ? null : analyser(brut);
  const suivant = CHAPITRES.find((c) => !termines?.includes(c.slug)) ?? CHAPITRES[0];
  const tousFinis = termines !== null && termines.length === CHAPITRES.length;
  return {
    termines,
    suivant,
    statut: (slug) => (termines?.includes(slug) ? "termine" : !tousFinis && slug === suivant.slug ? "en_cours" : "a_venir"),
  };
}
