"use client";

// L'appareil se souvient de ses profils (ARCH-1) ; leurs données vivent en base.

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

const CLE_IDS = "algodex.profils";
const CLE_ACTIF = "algodex.actif";

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
    return Array.isArray(ids) ? ids.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function memoriserProfil(id: string) {
  ecrire(CLE_IDS, JSON.stringify([id, ...idsAppareil().filter((x) => x !== id)]));
  ecrire(CLE_ACTIF, id);
}

export function oublierProfil(id: string) {
  ecrire(CLE_IDS, JSON.stringify(idsAppareil().filter((x) => x !== id)));
  if (lire(CLE_ACTIF) === id) ecrire(CLE_ACTIF, null);
}

export function quitterProfil() {
  ecrire(CLE_ACTIF, null);
}

function abonner(rappel: () => void) {
  window.addEventListener("storage", rappel);
  return () => window.removeEventListener("storage", rappel);
}

/** Profil actif ; renvoie à l'accueil s'il n'y en a pas. */
export function useProfilActif(): string | null {
  const router = useRouter();
  // undefined côté serveur : on ne sait pas encore ; null côté client : aucun profil.
  const profilId = useSyncExternalStore(abonner, () => lire(CLE_ACTIF), () => undefined);

  useEffect(() => {
    if (profilId === null) router.replace("/");
  }, [profilId, router]);

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
