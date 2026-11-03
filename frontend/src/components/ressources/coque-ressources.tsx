"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { BarreLaterale, BoutonMenu, MenuMobile } from "@/components/barre-laterale";
import { Avatar, Marque } from "@/components/marque";
import { BasculeTheme } from "@/components/theme";
import { rechercherDansCours } from "@/lib/cours";

/**
 * La coque de la rubrique Ressources : la barre latérale de l'espace, une barre du haut avec la recherche
 * dans le cours, et le contenu qui défile seul. La classe `ressources` applique la palette ivoire du cours.
 */
export function CoqueRessources({ pseudo, children }: { pseudo?: string; children: ReactNode }) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div className="ressources flex min-h-screen bg-bg text-text lg:h-screen lg:overflow-hidden">
      <BarreLaterale pseudo={pseudo} annotation="Apprendre aujourd'hui, créer demain !" />
      <MenuMobile ouvert={menuOuvert} onFermer={() => setMenuOuvert(false)} pseudo={pseudo} />

      <div className="relative flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-y-auto lg:scroll-smooth motion-reduce:scroll-auto">
        <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center gap-icone border-b border-border/70 bg-bg/85 px-page backdrop-blur">
          <BoutonMenu onOuvrir={() => setMenuOuvert(true)} />
          <span className="md:hidden">
            <Marque sousTitre={false} />
          </span>
          <RechercheCours />
          <div className="ml-auto flex items-center gap-3">
            <BasculeTheme />
            {pseudo && <Avatar pseudo={pseudo} taille={40} />}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[96rem] flex-1 px-page pb-section pt-bloc">{children}</main>
      </div>
    </div>
  );
}

/** Recherche dans le contenu du cours (chapitres, sections, textes), ouverte avec ⌘K ou Ctrl+K. */
function RechercheCours() {
  const router = useRouter();
  const champ = useRef<HTMLInputElement>(null);
  const idListe = useId();
  const [requete, setRequete] = useState("");
  const [ouverte, setOuverte] = useState(false);
  const [choisi, setChoisi] = useState(0);
  const resultats = rechercherDansCours(requete);

  useEffect(() => {
    const raccourci = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        champ.current?.focus();
      }
    };
    window.addEventListener("keydown", raccourci);
    return () => window.removeEventListener("keydown", raccourci);
  }, []);

  const lien = (r: (typeof resultats)[number]) => `/ressources/algorithmique/${r.chapitre.slug}${r.section ? `#${r.section.id}` : ""}`;

  function aller(n: number) {
    const r = resultats[n];
    if (!r) return;
    setOuverte(false);
    setRequete("");
    champ.current?.blur();
    router.push(lien(r));
  }

  const visible = ouverte && requete.trim().length >= 2;

  return (
    <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-md">
      <label className="flex h-11 items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 text-sm shadow-[0_1px_2px_rgb(19_32_59/0.04)] transition-colors focus-within:border-primary/60">
        <Search size={17} className="shrink-0 text-muted" aria-hidden />
        <span className="sr-only">Rechercher dans le cours</span>
        <input
          ref={champ}
          type="search"
          role="combobox"
          aria-expanded={visible}
          aria-controls={idListe}
          aria-activedescendant={visible && resultats[choisi] ? `${idListe}-${choisi}` : undefined}
          value={requete}
          onChange={(e) => {
            setRequete(e.target.value);
            setChoisi(0);
            setOuverte(true);
          }}
          onFocus={() => setOuverte(true)}
          onBlur={() => setTimeout(() => setOuverte(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setChoisi((c) => Math.min(c + 1, resultats.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setChoisi((c) => Math.max(c - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              aller(choisi);
            } else if (e.key === "Escape") {
              setOuverte(false);
              champ.current?.blur();
            }
          }}
          placeholder="Rechercher un cours, une notion..."
          className="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-muted/80 [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd className="hidden shrink-0 rounded-md border border-border bg-surface-2 px-1.5 py-0.5 font-sans text-[11px] font-semibold text-muted md:inline">⌘K</kbd>
      </label>

      {visible && (
        <ul id={idListe} role="listbox" className="absolute inset-x-0 top-full z-40 mt-2 max-h-[22rem] overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-xl">
          {resultats.length === 0 && <li className="px-3 py-3 text-sm text-muted">Aucun passage du cours ne correspond à « {requete.trim()} ».</li>}
          {resultats.map((r, n) => (
            <li key={`${r.chapitre.slug}-${r.section?.id ?? ""}`} id={`${idListe}-${n}`} role="option" aria-selected={n === choisi}>
              <Link
                href={lien(r)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOuverte(false);
                  setRequete("");
                }}
                onMouseEnter={() => setChoisi(n)}
                className={`block rounded-xl px-3 py-2.5 ${n === choisi ? "bg-primary-soft" : ""}`}
              >
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-primary">
                  Chapitre {r.chapitre.numero} · {r.section?.titre ?? r.chapitre.titre}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-sm text-text/80">{r.extrait}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
