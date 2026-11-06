"use client";

import { ArrowRight, CirclePlay, Zap } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Demarrage, type VueDemarrage } from "@/components/accueil/demarrage";
import { DemoExecution, type CommandesDemo } from "@/components/accueil/demo";
import { Fleche, FournisseurFleches } from "@/components/accueil/fleches";
import { Bandeau, Etapes, Fonctionnalites } from "@/components/accueil/sections";
import { Marque, Mascotte } from "@/components/marque";
import { BasculeTheme } from "@/components/theme";
import { ETAPES_TEST } from "@/components/guides/contenus";
import { lireMessageAccueil } from "@/lib/profils";

// La visite n'est chargée que si l'utilisateur la demande.
const VisiteGuidee = dynamic(() => import("@/components/guides/visite-guidee").then((m) => m.VisiteGuidee), { ssr: false });

// Pas de pages « Ressources » ni « À propos » dans la V1 : ces liens mènent aux sections de l'accueil.
const NAVIGATION = [
  { href: "#haut", libelle: "Accueil", actif: true },
  { href: "#parcours", libelle: "Parcours" },
  { href: "#demo", libelle: "Ressources" },
  { href: "#a-propos", libelle: "À propos" },
];

export default function Accueil() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    const laisse = lireMessageAccueil();
    if (laisse) window.setTimeout(() => setMessage(laisse), 0);
  }, []);
  const [guide, setGuide] = useState(false);
  const [vue, setVue] = useState<VueDemarrage>("nouveau");
  const [ouvert, setOuvert] = useState(false);
  const bouton = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLDivElement>(null);
  const demo = useRef<CommandesDemo>(null);

  // Ouvre le panneau de démarrage sous l'en-tête et place le focus sur ce qu'il faut remplir.
  function ouvrir(v: VueDemarrage) {
    setVue(v);
    setOuvert(true);
    requestAnimationFrame(() => document.getElementById(v === "nouveau" ? "pseudo" : "titre-reprendre")?.focus());
  }

  function fermer(rendreLeFocus: boolean) {
    setOuvert(false);
    if (rendreLeFocus) bouton.current?.focus();
  }

  // Échap ou un clic hors du panneau le referme.
  useEffect(() => {
    if (!ouvert) return;
    const echap = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOuvert(false);
      bouton.current?.focus();
    };
    const dehors = (e: PointerEvent) => {
      const cible = e.target as Node;
      if (!panneau.current?.contains(cible) && !bouton.current?.contains(cible)) setOuvert(false);
    };
    window.addEventListener("keydown", echap);
    document.addEventListener("pointerdown", dehors);
    return () => {
      window.removeEventListener("keydown", echap);
      document.removeEventListener("pointerdown", dehors);
    };
  }, [ouvert]);

  return (
    <FournisseurFleches>
      <div className="fond-labo min-h-screen overflow-x-clip">
        {message && (
          <p role="status" className="bg-warning-soft px-4 py-3 text-center text-sm text-warning">
            {message}
          </p>
        )}
        <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-[96rem] items-center gap-2 px-4 py-3.5 sm:gap-6 sm:px-8">
            <a href="#haut" aria-label="ALGO_DEX, retour en haut" className="min-w-0 shrink overflow-hidden">
              <Marque />
            </a>
            <nav aria-label="Navigation principale" className="mx-auto hidden gap-10 whitespace-nowrap text-sm lg:flex">
              {NAVIGATION.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  aria-current={l.actif ? "page" : undefined}
                  className={`relative py-2 transition-colors hover:text-text ${
                    l.actif
                      ? "font-semibold text-lavande after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-lavande"
                      : "text-muted"
                  }`}
                >
                  {l.libelle}
                </a>
              ))}
            </nav>
            <div className="relative ml-auto flex items-center gap-2 sm:gap-3 lg:ml-0">
              <span className="hidden min-[400px]:block">
                <BasculeTheme />
              </span>
              <button
                ref={bouton}
                type="button"
                data-guide="commencer"
                onClick={() => (ouvert ? fermer(false) : ouvrir("nouveau"))}
                aria-expanded={ouvert}
                aria-controls="panneau-demarrage"
                className="bouton-lumineux flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2.5 text-sm font-semibold text-white sm:px-5"
              >
                Commencer <ArrowRight size={16} className="hidden sm:block" aria-hidden />
              </button>
              {ouvert && (
                <div
                  ref={panneau}
                  id="panneau-demarrage"
                  role="dialog"
                  aria-labelledby={`titre-${vue}`}
                  className="absolute right-0 top-full z-50 mt-4 w-[min(24rem,calc(100vw-2rem))]"
                >
                  <Demarrage vue={vue} onVue={ouvrir} onFermer={() => fermer(true)} />
                </div>
              )}
            </div>
          </div>
          <nav aria-label="Navigation principale" className="flex justify-center gap-6 border-t border-border/50 py-2.5 text-sm lg:hidden">
            {NAVIGATION.map((l) => (
              <a key={l.href} href={l.href} aria-current={l.actif ? "page" : undefined} className={l.actif ? "font-semibold text-lavande" : "text-muted"}>
                {l.libelle}
              </a>
            ))}
          </nav>
        </header>

        <main className="relative mx-auto max-w-[96rem] px-4 sm:px-8">
          <span className="points-deco pointer-events-none absolute right-[24%] top-6 hidden h-16 w-40 opacity-50 xl:block" aria-hidden />
          <span className="points-deco pointer-events-none absolute -right-2 top-[26rem] hidden h-24 w-24 opacity-50 xl:block" aria-hidden />

          {/* Trois colonnes sur grand écran : introduction, démonstration, fonctionnalités. */}
          <section
            id="haut"
            className="grid scroll-mt-32 gap-x-12 gap-y-10 pt-8 lg:grid-cols-2 lg:pt-10 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.25fr)_minmax(0,0.8fr)] xl:pt-8"
          >
            <Introduction onGuide={() => setGuide(true)} />

            <div id="demo" className="relative scroll-mt-32 pt-16 lg:col-start-1 lg:row-start-2 xl:col-start-2 xl:row-start-1 xl:pt-14">
              <div className="absolute left-[28%] top-0 flex items-start gap-1 sm:left-[38%]">
                <Fleche
                  cible="code"
                  nom="le code source"
                  explication="Découvre comment un algorithme est écrit."
                  couleur="rose"
                  traces={[{ largeur: 46, hauteur: 60, d: "M42 8 C 22 8, 12 24, 14 54", pointe: "M7 46 L14 55 L21 46" }]}
                  className="mt-2"
                  bulle="left-0"
                />
                <p className="-rotate-6 font-hand text-xl leading-5 text-lavande">
                  Observe l&apos;exécution
                  <br />
                  de ton code pas à pas
                </p>
              </div>
              <DemoExecution ref={demo} />
              {/* Seul le robot déborde sur la fenêtre : la bulle reste sous la phrase du pas courant. */}
              <div className="relative z-10 -mt-4 flex items-end gap-2 pl-1 sm:pl-3">
                <Mascotte taille={76} className="shrink-0" />
                <p className="mb-1 max-w-[16rem] rounded-2xl rounded-bl-sm border border-primary/45 bg-surface/85 px-3.5 py-2 text-[13px] leading-snug shadow-card backdrop-blur">
                  Pas à pas, tu vas voir comment chaque ligne change le résultat&nbsp;!
                </p>
              </div>
            </div>

            <div className="lg:col-start-2 lg:row-start-2 lg:self-center lg:pl-4 xl:col-start-3 xl:row-start-1 xl:pl-0">
              <Fonctionnalites
                actions={{
                  exercices: () => demo.current?.niveauSuivant(),
                  visualisation: () => demo.current?.rejouer(),
                }}
              />
            </div>
          </section>

          <div className="mt-12 lg:mt-14">
            <Etapes />
          </div>

          <div className="mt-10">
            <Bandeau onCommencer={() => ouvrir("nouveau")} />
          </div>
        </main>
      </div>
      {guide && <VisiteGuidee cle="test" titre="Le test de positionnement" etapes={ETAPES_TEST} videoDabord onFermer={() => setGuide(false)} />}
    </FournisseurFleches>
  );
}

function Introduction({ onGuide }: { onGuide: () => void }) {
  return (
    <div className="lg:col-span-2 lg:row-start-1 xl:col-span-1">
      <p className="inline-flex flex-wrap items-center gap-x-2.5 sm:whitespace-nowrap rounded-xl border border-primary/40 bg-surface/50 px-3.5 py-2 text-xs font-semibold tracking-[0.14em] xl:gap-x-2 xl:text-[11px] xl:tracking-[0.1em]">
        <Zap size={16} className="text-lavande" aria-hidden />
        APPRENDRE <span className="text-lavande" aria-hidden>·</span> CODER <span className="text-lavande" aria-hidden>·</span> PROGRESSER
      </p>
      <h1 className="mt-6 font-display text-[clamp(2.6rem,7vw,4.4rem)] leading-[1.03] xl:text-[clamp(2.6rem,3.4vw,4rem)]">
        Maîtrise la logique, <span className="texte-degrade">progresse à ton rythme.</span>
      </h1>
      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted xl:text-sm">
        ALGO_DEX est ton compagnon d&apos;apprentissage en algorithmique. Ici, tu apprends en pratiquant, avec des
        explications claires, des visualisations interactives et un parcours adapté à ton niveau.
      </p>
      <p className="mt-4 flex max-w-md flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <CirclePlay size={18} className="shrink-0 text-lavande" aria-hidden />
        <span>Comment fonctionne le test de positionnement&nbsp;?</span>
        <button type="button" onClick={onGuide} className="font-semibold text-primary underline underline-offset-2 hover:no-underline">
          Voir la vidéo
        </button>
      </p>
      <div className="mt-6 flex items-end gap-2 text-rose">
        <p className="-rotate-6 font-hand text-2xl leading-6">
          Une expérience pensée
          <br />
          pour comprendre,
          <br />
          pas juste pour mémoriser&nbsp;!
        </p>
        <svg width="40" height="60" viewBox="0 0 40 60" className="mb-6 shrink-0" aria-hidden>
          <path d="M6 56 C 22 46, 30 30, 30 6" className="fleche-trait" />
          <path d="M23 13 L30 4 L36 14" className="fleche-pointe" />
        </svg>
      </div>
    </div>
  );
}
