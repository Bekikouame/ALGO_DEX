"use client";

import { BookOpen, ChevronDown, ChevronRight, Gauge, House, Menu, PanelLeftClose, PanelLeftOpen, Route, Telescope, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { FenetreQuitterProfil } from "./quitter-profil";
import { RobotAlgo } from "./espace/illustrations";
import { Avatar, Logo, Marque } from "./marque";

interface SousRubrique {
  href: string | null; // null : pas encore disponible
  libelle: string;
  actifSur?: string;
}

interface GroupeSousMenu {
  groupe: string;
  rubriques: SousRubrique[];
}

// « Parcours » et « Exploration » sont des sections de Mon espace ; « Ressources » regroupe le cours et la documentation.
export const NAVIGATION: { href: string; libelle: string; icone: typeof House; actifSur?: string[]; sousMenu?: GroupeSousMenu[] }[] = [
  { href: "/parcours", libelle: "Mon espace", icone: House },
  { href: "/parcours#progression", libelle: "Parcours", icone: Route },
  { href: "/calibrage", libelle: "Test de niveau", icone: Gauge },
  { href: "/parcours#explorations", libelle: "Exploration", icone: Telescope },
  {
    href: "/ressources/algorithmique",
    libelle: "Ressources",
    icone: BookOpen,
    actifSur: ["/ressources", "/langages"],
    sousMenu: [
      {
        groupe: "Apprendre",
        rubriques: [
          { href: "/ressources/algorithmique", libelle: "Cours d'algorithmique", actifSur: "/ressources/algorithmique" },
          { href: "/langages", libelle: "Documentation", actifSur: "/langages" },
        ],
      },
      { groupe: "Pratiquer", rubriques: [{ href: "/ressources/exercices", libelle: "Exercices", actifSur: "/ressources/exercices" }] },
      { groupe: "S'inspirer", rubriques: [{ href: null, libelle: "Blog" }] },
    ],
  },
];

// --------------------------------------------------------------------------
// État de la barre : développée ou compacte, choix mémorisé et partagé entre les pages
// --------------------------------------------------------------------------

type Mode = "developpee" | "compacte";
const CLE = "algodex.barre";
const EVENEMENT = "algodex-barre";

function abonnerChoix(rappel: () => void) {
  window.addEventListener("storage", rappel);
  window.addEventListener(EVENEMENT, rappel);
  return () => {
    window.removeEventListener("storage", rappel);
    window.removeEventListener(EVENEMENT, rappel);
  };
}
function lireChoix(): Mode | null {
  try {
    const v = localStorage.getItem(CLE);
    return v === "developpee" || v === "compacte" ? v : null;
  } catch {
    return null;
  }
}
function ecrireChoix(mode: Mode) {
  try {
    localStorage.setItem(CLE, mode);
  } catch {}
  window.dispatchEvent(new Event(EVENEMENT));
}

const ORDINATEUR = "(min-width: 1280px)";
function abonnerLargeur(rappel: () => void) {
  const m = window.matchMedia(ORDINATEUR);
  m.addEventListener("change", rappel);
  return () => m.removeEventListener("change", rappel);
}

/** Sans choix de l'élève : développée sur ordinateur, compacte sur tablette (et là où l'on veut de la place). */
function useModeBarre(compacteParDefaut: boolean): [Mode, () => void] {
  const choix = useSyncExternalStore(abonnerChoix, lireChoix, () => null);
  const ordinateur = useSyncExternalStore(abonnerLargeur, () => window.matchMedia(ORDINATEUR).matches, () => true);
  const mode: Mode = choix ?? (compacteParDefaut || !ordinateur ? "compacte" : "developpee");
  return [mode, () => ecrireChoix(mode === "compacte" ? "developpee" : "compacte")];
}

const commencePar = (chemin: string, prefixe: string) => chemin === prefixe || chemin.startsWith(prefixe + "/");
const estActif = (chemin: string, { href, actifSur }: (typeof NAVIGATION)[number]) =>
  actifSur ? actifSur.some((p) => commencePar(chemin, p)) : !href.includes("#") && chemin === href;

/**
 * Les sous-rubriques de la rubrique active, par groupes (Apprendre, Pratiquer, S'inspirer).
 * Le bloc se déplie et se replie en douceur ; le retrait et le fil vertical le rattachent à sa rubrique.
 */
function SousMenu({
  groupes,
  chemin,
  ouvert,
  id,
  onChoisir,
  tabIndex,
}: {
  groupes: GroupeSousMenu[];
  chemin: string;
  ouvert: boolean;
  id: string;
  onChoisir?: () => void;
  tabIndex?: number;
}) {
  const focus = ouvert ? tabIndex : -1;
  return (
    <div
      id={id}
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${ouvert ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      aria-hidden={!ouvert}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="ml-[1.15rem] mt-2 flex flex-col border-l border-border pb-1 pl-2.5">
          {groupes.map(({ groupe, rubriques }, g) => (
            <div key={groupe} className={g > 0 ? "mt-3 border-t border-border/70 pt-3" : ""}>
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{groupe}</p>
              <ul className="flex flex-col gap-sous">
                {rubriques.map(({ href, libelle, actifSur }) => {
                  const actif = !!actifSur && commencePar(chemin, actifSur);
                  const classe = `relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[14.5px] transition-colors before:absolute before:-left-2.5 before:top-1/2 before:h-4 before:w-[3px] before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full ${
                    actif ? "bg-primary/10 font-semibold text-primary before:bg-primary" : "text-text/75 before:bg-transparent hover:bg-primary/5 hover:text-primary"
                  }`;
                  return (
                    <li key={libelle}>
                      {href ? (
                        <Link href={href} onClick={onChoisir} tabIndex={focus} aria-current={actif ? "page" : undefined} className={classe}>
                          {libelle}
                        </Link>
                      ) : (
                        <span className={`${classe} cursor-default justify-between text-text/55`} aria-disabled>
                          {libelle}
                          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">bientôt</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Le chevron qui déplie ou replie les sous-rubriques. */
function Chevron({ ouvert, controle, onBasculer, sombre, tabIndex }: { ouvert: boolean; controle: string; onBasculer: () => void; sombre: boolean; tabIndex?: number }) {
  return (
    <button
      type="button"
      onClick={onBasculer}
      tabIndex={tabIndex}
      aria-expanded={ouvert}
      aria-controls={controle}
      aria-label={ouvert ? "Replier les ressources" : "Déplier les ressources"}
      className={`absolute right-2 top-6 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors ${
        sombre ? "text-on-primary/85 hover:bg-white/15" : "text-muted hover:bg-primary/10 hover:text-primary"
      }`}
    >
      <ChevronDown size={17} className={`transition-transform duration-300 ${ouvert ? "rotate-180" : ""}`} />
    </button>
  );
}

function useChangerProfil(pseudo?: string) {
  const [ouverte, setOuverte] = useState(false);
  return {
    demander: () => setOuverte(true),
    fenetre: ouverte && pseudo ? <FenetreQuitterProfil pseudo={pseudo} onRester={() => setOuverte(false)} /> : null,
  };
}

// --------------------------------------------------------------------------
// Tablette et ordinateur : la barre latérale rétractable
// --------------------------------------------------------------------------

/**
 * La barre latérale de l'espace apprenant, développée ou réduite à une colonne d'icônes.
 * Elle occupe sa largeur réelle dans la mise en page : le contenu voisin se redimensionne avec elle.
 */
export function BarreLaterale({
  pseudo,
  compacteParDefaut = false,
  annotation = "Pas juste du code !",
}: {
  pseudo?: string;
  compacteParDefaut?: boolean;
  /** La phrase manuscrite au-dessus du robot. */
  annotation?: string;
}) {
  const chemin = usePathname();
  const [mode, basculer] = useModeBarre(compacteParDefaut);
  const { demander: changerProfil, fenetre: fenetreQuitter } = useChangerProfil(pseudo);
  const compacte = mode === "compacte";
  // Le sous-menu de Ressources : ouvert dans sa section, repliable par son chevron.
  const [replie, setReplie] = useState(false);
  const sousMenuOuvert = !compacte && !replie && NAVIGATION.some((r) => r.sousMenu && estActif(chemin, r));
  // Libellés : ils s'effacent pendant que la barre se replie, sans quitter l'arbre d'accessibilité.
  const libelle = `overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-300 ${compacte ? "max-w-0 opacity-0" : "max-w-[11rem] opacity-100"}`;

  return (
    <aside
      aria-label="Navigation latérale"
      className={`sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r border-border/70 bg-surface/70 py-6 backdrop-blur transition-[width,padding] duration-300 ease-out md:flex ${
        compacte ? "w-[4.75rem] px-3" : "w-64 px-5"
      }`}
    >
      <div className={`flex items-center ${compacte ? "flex-col gap-4" : "justify-between gap-2"}`}>
        <Link href="/" aria-label="ALGO_DEX, accueil" className={compacte ? "" : "min-w-0 px-1"}>
          {compacte ? <Logo /> : <Marque />}
        </Link>
        <button
          type="button"
          onClick={basculer}
          aria-label={compacte ? "Développer la barre latérale" : "Réduire la barre latérale"}
          aria-expanded={!compacte}
          title={compacte ? "Développer" : "Réduire"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted shadow-sm transition-colors hover:border-primary/50 hover:text-primary"
        >
          {compacte ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav
        className={`-mx-2 flex min-h-0 flex-col gap-1.5 overflow-y-auto px-2 pb-2 ${compacte ? "mt-6 items-center" : "mt-8"}`}
        aria-label="Navigation principale"
      >
        {NAVIGATION.map((rubrique) => {
          const { href, libelle: nom, icone: Icone, sousMenu } = rubrique;
          const actif = estActif(chemin, rubrique);
          const avecChevron = actif && !!sousMenu && !compacte;
          return (
            <div key={href} className={compacte ? "" : "relative flex flex-col"}>
              <Link
                href={href}
                aria-current={actif ? "page" : undefined}
                aria-label={compacte ? nom : undefined}
                className={`group relative flex items-center rounded-2xl text-[15px] font-medium transition-all duration-300 ${
                  compacte ? "h-11 w-11 justify-center" : `gap-3 px-4 py-3 ${avecChevron ? "pr-12" : ""}`
                } ${
                  actif
                    ? "actif-pop bg-primary text-on-primary shadow-[0_12px_28px_-12px_var(--primary)]"
                    : "text-text/80 hover:bg-primary/8 hover:text-primary"
                }`}
              >
                <Icone size={19} strokeWidth={1.8} className="shrink-0" />
                <span className={libelle}>{nom}</span>
                {compacte && <Bulle>{nom}</Bulle>}
              </Link>
              {avecChevron && <Chevron ouvert={sousMenuOuvert} controle="sous-menu-barre" onBasculer={() => setReplie((x) => !x)} sombre />}
              {sousMenu && actif && !compacte && <SousMenu groupes={sousMenu} chemin={chemin} ouvert={sousMenuOuvert} id="sous-menu-barre" />}
            </div>
          );
        })}
      </nav>

      <div className={`mt-auto flex flex-col gap-3 ${compacte ? "items-center" : ""}`}>
        {/* Le robot, seulement quand la barre est développée et que la hauteur le permet */}
        {!compacte && (
          <div
            className={`relative hidden items-end justify-center pt-10 ${sousMenuOuvert ? "[@media(min-height:940px)]:flex" : "[@media(min-height:720px)]:flex"}`}
          >
            <span className="absolute right-0 top-0 max-w-[8.5rem] -rotate-6 text-center font-hand text-xl leading-5 text-primary">
              {annotation}
            </span>
            <RobotAlgo taille={118} tablette className="flotte" />
          </div>
        )}
        {pseudo &&
          (compacte ? (
            <button
              type="button"
              onClick={changerProfil}
              aria-label={`${pseudo} : changer de profil`}
              className="group relative rounded-full transition-transform hover:scale-105"
            >
              <Avatar pseudo={pseudo} />
              <Bulle>{pseudo} · changer de profil</Bulle>
            </button>
          ) : (
            <button
              type="button"
              onClick={changerProfil}
              title="Changer de profil"
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left transition-colors hover:border-primary/50"
            >
              <Avatar pseudo={pseudo} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{pseudo}</span>
                <span className="block text-xs text-muted">Apprenant</span>
              </span>
              <ChevronRight size={16} className="text-muted" />
            </button>
          ))}
      </div>
      {fenetreQuitter}
    </aside>
  );
}

/** Le nom d'une rubrique au survol (ou au focus clavier) de son icône, en mode compact. */
function Bulle({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-lg bg-text px-2.5 py-1.5 text-xs font-medium text-bg opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
    >
      {children}
    </span>
  );
}

// --------------------------------------------------------------------------
// Téléphone : un menu latéral coulissant
// --------------------------------------------------------------------------

export function BoutonMenu({ onOuvrir }: { onOuvrir: () => void }) {
  return (
    <button
      type="button"
      onClick={onOuvrir}
      aria-label="Ouvrir le menu"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text md:hidden"
    >
      <Menu size={20} />
    </button>
  );
}

/** Menu coulissant : fond assombri, fermeture par la croix, Échap, le fond, ou après le choix d'une rubrique. */
export function MenuMobile({ ouvert, onFermer, pseudo }: { ouvert: boolean; onFermer: () => void; pseudo?: string }) {
  const chemin = usePathname();
  const { demander: changerProfil, fenetre: fenetreQuitter } = useChangerProfil(pseudo);
  const [replie, setReplie] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [ouvert, onFermer]);

  return (
    <div className={`fixed inset-0 z-50 md:hidden ${ouvert ? "" : "pointer-events-none"}`} aria-hidden={!ouvert}>
      <div onClick={onFermer} className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${ouvert ? "opacity-100" : "opacity-0"}`} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface px-5 py-6 shadow-2xl transition-transform duration-300 ease-out ${
          ouvert ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/" onClick={onFermer} aria-label="ALGO_DEX, accueil">
            <Marque />
          </Link>
          <button type="button" onClick={onFermer} aria-label="Fermer le menu" className="rounded-xl p-2 text-muted hover:text-text" tabIndex={ouvert ? 0 : -1}>
            <X size={20} />
          </button>
        </div>
        <nav className="-mx-2 mt-8 flex min-h-0 flex-col gap-1.5 overflow-y-auto px-2 pb-2" aria-label="Navigation principale">
          {NAVIGATION.map((rubrique) => {
            const { href, libelle, icone: Icone, sousMenu } = rubrique;
            const actif = estActif(chemin, rubrique);
            return (
              <div key={href} className="relative flex flex-col">
                <Link
                  href={href}
                  onClick={onFermer}
                  tabIndex={ouvert ? 0 : -1}
                  aria-current={actif ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium ${actif && sousMenu ? "pr-12" : ""} ${
                    actif ? "bg-primary text-on-primary" : "text-text/80 hover:bg-primary/8 hover:text-primary"
                  }`}
                >
                  <Icone size={19} strokeWidth={1.8} />
                  {libelle}
                </Link>
                {actif && sousMenu && (
                  <>
                    <Chevron ouvert={!replie} controle="sous-menu-mobile" onBasculer={() => setReplie((x) => !x)} sombre tabIndex={ouvert ? 0 : -1} />
                    <SousMenu groupes={sousMenu} chemin={chemin} ouvert={!replie} id="sous-menu-mobile" onChoisir={onFermer} tabIndex={ouvert ? 0 : -1} />
                  </>
                )}
              </div>
            );
          })}
        </nav>
        {pseudo && (
          <button
            type="button"
            onClick={changerProfil}
            tabIndex={ouvert ? 0 : -1}
            className="mt-auto flex items-center gap-3 rounded-2xl border border-border p-3 text-left"
          >
            <Avatar pseudo={pseudo} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{pseudo}</span>
              <span className="block text-xs text-muted">Changer de profil</span>
            </span>
          </button>
        )}
        {fenetreQuitter}
      </div>
    </div>
  );
}
