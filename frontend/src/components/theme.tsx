"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function abonner(rappel: () => void) {
  const observateur = new MutationObserver(rappel);
  observateur.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observateur.disconnect();
}

const themeActuel = (): Theme => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

export function BasculeTheme() {
  const theme = useSyncExternalStore(abonner, themeActuel, () => "dark" as Theme);

  function choisir(t: Theme) {
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("algodex.theme", t);
    } catch {}
  }

  return (
    <div className="flex items-center rounded-full border border-border bg-surface p-1" role="group" aria-label="Thème">
      {(["light", "dark"] as const).map((t) => {
        const Icone = t === "light" ? Sun : Moon;
        const actif = theme === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => choisir(t)}
            aria-pressed={actif}
            aria-label={t === "light" ? "Thème clair" : "Thème sombre"}
            className={`rounded-full p-1.5 transition-colors ${actif ? "bg-primary text-on-primary" : "text-muted hover:text-text"}`}
          >
            <Icone size={16} />
          </button>
        );
      })}
    </div>
  );
}
