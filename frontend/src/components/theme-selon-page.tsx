"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Sans choix explicite (bouton soleil/lune), l'accueil public est sombre et l'espace apprenant clair,
 * comme les maquettes validées. Un choix explicite est mémorisé et vaut partout.
 */
export function ThemeSelonPage() {
  const chemin = usePathname();
  useEffect(() => {
    let choisi: string | null = null;
    try {
      choisi = localStorage.getItem("algodex.theme");
    } catch {}
    if (!choisi) document.documentElement.setAttribute("data-theme", chemin === "/" ? "dark" : "light");
  }, [chemin]);
  return null;
}
