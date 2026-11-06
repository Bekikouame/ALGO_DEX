"use client";

// L'appareil se souvient de ses profils (ARCH-1) ; leurs données vivent en base.

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

const CLE_IDS = "algodex.profils";
const CLE_ACTIF = "algodex.actif";
// Pseudos déjà utilisés ici : un simple rappel, sans identifiant. Rouvrir l'un d'eux demande son code.
const CLE_PSEUDOS = "algodex.pseudos";
// Ordinateur partagé : date de la dernière activité ; sans activité pendant 30 minutes, le profil se ferme.
const CLE_PARTAGE = "algodex.partage";
const DELAI_PARTAGE_MS = 30 * 60 * 1000;
const FORMAT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function lire(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

function ecrire(cle: string, valeur: string | null) {
  try {
    if (valeur === null) localStorage.removeItem(cle);
    else localStorage.setItem(cle, valeur);
  } catch {}
}

export function idsAppareil(): string[] {
  try {
    const ids = JSON.parse(lire(CLE_IDS) ?? "[]");
    return Array.isArray(ids) ? ids.filter((x) => typeof x === "string" && FORMAT_ID.test(x)) : [];
  } catch {
    return [];
  }
}

export function memoriserProfil(id: string, partage = false) {
  ecrire(CLE_IDS, JSON.stringify([id, ...idsAppareil().filter((x) => x !== id)]));
  ecrire(CLE_ACTIF, id);
  ecrire(CLE_PARTAGE, partage ? String(Date.now()) : null);
  try {
    sessionStorage.removeItem(CLE_MESSAGE);
  } catch {}
}

export function profilActif(): string | null {
  return lire(CLE_ACTIF);
}

export function pseudosAppareil(): string[] {
  try {
    const pseudos = JSON.parse(lire(CLE_PSEUDOS) ?? "[]");
    return Array.isArray(pseudos) ? pseudos.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function memoriserPseudo(pseudo: string) {
  ecrire(CLE_PSEUDOS, JSON.stringify([pseudo, ...pseudosAppareil().filter((x) => x !== pseudo)].slice(0, 20)));
}

export function oublierPseudo(pseudo: string) {
  ecrire(CLE_PSEUDOS, JSON.stringify(pseudosAppareil().filter((x) => x !== pseudo)));
}

export function oublierProfil(id: string) {
  ecrire(CLE_IDS, JSON.stringify(idsAppareil().filter((x) => x !== id)));
  if (lire(CLE_ACTIF) === id) ecrire(CLE_ACTIF, null);
}

/** Quitter : l'identifiant sort de l'appareil, il ne reste que le pseudo. Y revenir demandera le code. */
export function quitterProfil(pseudo?: string) {
  const actif = lire(CLE_ACTIF);
  if (actif) oublierProfil(actif);
  if (pseudo) memoriserPseudo(pseudo);
  ecrire(CLE_PARTAGE, null);
  notifier();
}

/** Le serveur ne connaît plus ce profil (base réinitialisée, profil supprimé) : retour propre à l'accueil. */
export function profilPerdu() {
  const actif = lire(CLE_ACTIF);
  if (actif) oublierProfil(actif);
  ecrire(CLE_PARTAGE, null);
  try {
    sessionStorage.setItem(CLE_MESSAGE, "Ce profil n'existe plus sur ce serveur. Crée un nouveau profil pour continuer.");
  } catch {}
  // Rechargement complet voulu : plus aucun écran ne doit garder l'ancien profil en mémoire.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/");
}

const CLE_MESSAGE = "algodex.message";

/** Le message laissé pour la page d'accueil : il reste affiché jusqu'à l'ouverture d'un profil. */
export function lireMessageAccueil(): string | null {
  try {
    return sessionStorage.getItem(CLE_MESSAGE);
  } catch {
    return null;
  }
}

/** Sur ordinateur partagé : ferme le profil après 30 minutes sans activité. Renvoie vrai s'il vient d'être fermé. */
export function expirerSiInactif(): boolean {
  const vu = Number(lire(CLE_PARTAGE));
  if (!vu || Date.now() - vu < DELAI_PARTAGE_MS) return false;
  quitterProfil();
  return true;
}

function noterActivite() {
  if (lire(CLE_PARTAGE)) ecrire(CLE_PARTAGE, String(Date.now()));
}

const auditeurs = new Set<() => void>();
function notifier() {
  auditeurs.forEach((rappel) => rappel());
}

function abonner(rappel: () => void) {
  auditeurs.add(rappel);
  window.addEventListener("storage", rappel);
  return () => {
    auditeurs.delete(rappel);
    window.removeEventListener("storage", rappel);
  };
}

/** Profil actif ; renvoie à l'accueil s'il n'y en a pas. */
export function useProfilActif(): string | null {
  const router = useRouter();
  // undefined côté serveur : on ne sait pas encore ; null côté client : aucun profil.
  const profilId = useSyncExternalStore(abonner, () => lire(CLE_ACTIF), () => undefined);

  useEffect(() => {
    if (profilId === null) router.replace("/");
  }, [profilId, router]);

  useEffect(() => {
    expirerSiInactif();
    const minuteur = window.setInterval(expirerSiInactif, 60_000);
    window.addEventListener("pointerdown", noterActivite);
    window.addEventListener("keydown", noterActivite);
    return () => {
      window.clearInterval(minuteur);
      window.removeEventListener("pointerdown", noterActivite);
      window.removeEventListener("keydown", noterActivite);
    };
  }, []);

  return profilId ?? null;
}

/** Brouillon local des blocs d'une tentative : le serveur ne les stocke pas. */
export function lireBrouillon<T>(tentativeId: string): T | null {
  try {
    const brut = lire(`algodex.brouillon.${tentativeId}`);
    return brut ? (JSON.parse(brut) as T) : null;
  } catch {
    return null;
  }
}

export function ecrireBrouillon(tentativeId: string, valeur: unknown) {
  ecrire(`algodex.brouillon.${tentativeId}`, JSON.stringify(valeur));
}

/** La dernière solution validée d'un exercice : « Revoir » la rouvre au lieu d'un éditeur vide. */
export function lireSolution<T>(profilId: string, exerciceId: string): T | null {
  try {
    const brut = lire(`algodex.solution.${profilId}.${exerciceId}`);
    return brut ? (JSON.parse(brut) as T) : null;
  } catch {
    return null;
  }
}

export function ecrireSolution(profilId: string, exerciceId: string, valeur: unknown) {
  ecrire(`algodex.solution.${profilId}.${exerciceId}`, JSON.stringify(valeur));
}

/** Saisie d'une prédiction pas encore engagée : elle survit à une actualisation de la page. */
export function lireSaisie<T>(cle: string): T | null {
  try {
    const brut = sessionStorage.getItem(`algodex.saisie.${cle}`);
    return brut ? (JSON.parse(brut) as T) : null;
  } catch {
    return null;
  }
}

export function ecrireSaisie(cle: string, valeur: unknown | null) {
  try {
    if (valeur === null) sessionStorage.removeItem(`algodex.saisie.${cle}`);
    else sessionStorage.setItem(`algodex.saisie.${cle}`, JSON.stringify(valeur));
  } catch {}
}
