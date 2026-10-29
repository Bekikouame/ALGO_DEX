"use client";

import {
  BookOpen,
  ChartNoAxesColumnIncreasing,
  ClipboardCheck,
  Clock,
  Code2,
  CodeXml,
  Eye,
  GitBranch,
  Heart,
  Infinity as Infini,
  ShieldCheck,
  Trophy,
  UserRound,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Fleche, useCible, type Cible, type Trace } from "./fleches";

type Teinte = "menthe" | "rose" | "lavande" | "or";

// Classes complètes (Tailwind ne voit pas les noms construits à la volée).
const TEINTES: Record<Teinte, { texte: string; cercle: string; tuile: string; pastille: string }> = {
  menthe: {
    texte: "text-menthe",
    cercle: "border-menthe/70 bg-menthe/10 text-menthe shadow-[0_0_26px_-8px_var(--menthe)]",
    tuile: "border-menthe/50 bg-menthe/10 text-menthe shadow-[0_0_30px_-10px_var(--menthe)]",
    pastille: "border-menthe/45",
  },
  rose: {
    texte: "text-rose",
    cercle: "border-rose/70 bg-rose/10 text-rose shadow-[0_0_26px_-8px_var(--rose)]",
    tuile: "border-rose/50 bg-rose/10 text-rose shadow-[0_0_30px_-10px_var(--rose)]",
    pastille: "border-rose/45",
  },
  lavande: {
    texte: "text-lavande",
    cercle: "border-lavande/70 bg-lavande/10 text-lavande shadow-[0_0_26px_-8px_var(--lavande)]",
    tuile: "border-lavande/50 bg-lavande/10 text-lavande shadow-[0_0_30px_-10px_var(--lavande)]",
    pastille: "border-lavande/45",
  },
  or: {
    texte: "text-trophy",
    cercle: "border-trophy/70 bg-trophy/10 text-trophy shadow-[0_0_26px_-8px_var(--trophy)]",
    tuile: "border-trophy/50 bg-trophy/10 text-trophy shadow-[0_0_30px_-10px_var(--trophy)]",
    pastille: "border-trophy/45",
  },
};

// Écran large : la flèche part sous l'icône et file à gauche, vers la fenêtre de démonstration.
const VERS_LA_FENETRE: Trace = {
  largeur: 46,
  hauteur: 40,
  d: "M40 4 C 43 24, 28 34, 6 32",
  pointe: "M14 25 L5 32 L13 38",
  className: "hidden lg:block",
};
// Écran étroit : la démonstration est au-dessus, la flèche remonte.
const VERS_LE_HAUT: Trace = {
  largeur: 34,
  hauteur: 40,
  d: "M6 36 C 24 34, 30 20, 24 5",
  pointe: "M17 11 L24 4 L30 12",
  className: "lg:hidden",
};
// Le parcours en 5 étapes est toujours plus bas.
const VERS_LE_BAS: Trace = {
  largeur: 46,
  hauteur: 44,
  d: "M38 4 C 50 16, 26 22, 26 38",
  pointe: "M19 31 L26 39 L33 31",
};

const FONCTIONNALITES: {
  icone: LucideIcon;
  teinte: Exclude<Teinte, "or">;
  titre: string;
  texte: string;
  cible: Cible;
  explication: string;
  traces: Trace[];
  place: string;
}[] = [
  {
    icone: Code2,
    teinte: "menthe",
    titre: "Des exercices variés",
    texte: "Du simple au complexe, avec des défis adaptés à ton niveau.",
    cible: "exercices",
    explication: "Résous des problèmes adaptés à ton niveau. La démonstration passe au niveau suivant.",
    traces: [VERS_LA_FENETRE, VERS_LE_HAUT],
    place: "lg:absolute lg:-left-[3.75rem] lg:top-10",
  },
  {
    icone: Eye,
    teinte: "lavande",
    titre: "Une visualisation interactive",
    texte: "Observe, modifie, teste… comprends vraiment comment ça fonctionne.",
    cible: "visualisation",
    explication: "Observe les variables évoluer à chaque étape. L'exécution reprend depuis le début.",
    traces: [VERS_LA_FENETRE, VERS_LE_HAUT],
    place: "lg:absolute lg:-left-[3.75rem] lg:top-10",
  },
  {
    icone: GitBranch,
    teinte: "rose",
    titre: "Un parcours personnalisé",
    texte: "Passe ton test de positionnement et suis un chemin qui te correspond.",
    cible: "parcours",
    explication: "Évalue ton niveau et progresse étape par étape.",
    traces: [VERS_LE_BAS],
    place: "lg:absolute lg:left-0 lg:top-[3.25rem]",
  },
];

/** La colonne des trois promesses, chacune reliée par une flèche à ce qu'elle désigne ; certaines agissent sur la démonstration. */
export function Fonctionnalites({ actions = {} }: { actions?: Partial<Record<Cible, () => void>> }) {
  return (
    <ul className="flex flex-col gap-8">
      {FONCTIONNALITES.map((f) => {
        const t = TEINTES[f.teinte];
        return (
          <li key={f.titre} className="relative flex items-start gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 ${t.cercle}`}>
              <f.icone size={22} strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className={`font-semibold ${t.texte}`}>{f.titre}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{f.texte}</p>
            </div>
            <Fleche
              cible={f.cible}
              nom={f.titre.toLowerCase()}
              explication={f.explication}
              traces={f.traces}
              couleur={f.teinte}
              className={`shrink-0 self-center ${f.place}`}
              bulle="right-0 lg:left-0 lg:right-auto"
              onActiver={actions[f.cible]}
            />
          </li>
        );
      })}
    </ul>
  );
}

const ETAPES: { icone: LucideIcon; teinte: Teinte; titre: string; texte: string; duree: string; sansFin?: boolean }[] = [
  {
    icone: UserRound,
    teinte: "rose",
    titre: "Choisis ton pseudo",
    texte: "Pas besoin de compte compliqué. Ton pseudo suffit pour commencer.",
    duree: "2 min",
  },
  {
    icone: ClipboardCheck,
    teinte: "lavande",
    titre: "Passe ton test de niveau",
    texte: "Quelques questions pour évaluer ton niveau et te diriger vers le bon parcours.",
    duree: "5–10 min",
  },
  {
    icone: CodeXml,
    teinte: "menthe",
    titre: "Découvre les exercices",
    texte: "Résous des défis concrets et observe ton code en action.",
    duree: "À ton rythme",
  },
  {
    icone: ChartNoAxesColumnIncreasing,
    teinte: "or",
    titre: "Progresse",
    texte: "Fais passer chaque notion au vert sur ta carte de maîtrise et vois ta progression.",
    duree: "Tout au long du parcours",
  },
  {
    icone: Trophy,
    teinte: "rose",
    titre: "Deviens la meilleure version de toi-même",
    texte: "Chaque notion au vert débloque ton algorithme en Python, puis en quatre langages.",
    duree: "Sans limite",
    sansFin: true,
  },
];

/** « Ton parcours en 5 étapes », reliées par des flèches. */
export function Etapes() {
  const cible = useCible("parcours");
  return (
    <section id="parcours" aria-labelledby="titre-etapes" {...cible} className="cible scroll-mt-32 rounded-3xl p-2 sm:p-4">
      <div className="flex items-center gap-4">
        <h2 id="titre-etapes" className="relative shrink-0 -rotate-2 font-hand text-3xl text-lavande">
          Ton parcours en 5 étapes
          <svg viewBox="0 0 220 14" className="absolute -bottom-3 left-0 h-3 w-full text-rose" preserveAspectRatio="none" aria-hidden>
            <path d="M2 9 C 60 3, 140 4, 218 8" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </h2>
        <span className="h-px flex-1 bg-gradient-to-r from-lavande/50 to-transparent" aria-hidden />
      </div>

      <ol className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {ETAPES.map((e, n) => {
          const t = TEINTES[e.teinte];
          const Duree = e.sansFin ? Infini : Clock;
          return (
            <li key={e.titre} className="relative">
              <div className="flex items-center gap-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 font-display text-xl ${t.cercle}`}>
                  {n + 1}
                </span>
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${t.tuile}`}>
                  <e.icone size={26} strokeWidth={1.75} aria-hidden />
                </span>
              </div>
              {n < ETAPES.length - 1 && (
                <svg width="56" height="24" viewBox="0 0 56 24" className="absolute right-0 top-4 hidden text-lavande/80 xl:block" aria-hidden>
                  <path d="M3 13 C 18 9, 34 15, 51 12" className="fleche-trait" />
                  <path d="M44 6 L52 12 L44 18" className="fleche-pointe" />
                </svg>
              )}
              <h3 className={`mt-4 text-lg font-bold leading-snug ${n === 0 ? "text-text" : t.texte}`}>{e.titre}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{e.texte}</p>
              <span className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${t.pastille}`}>
                <Duree size={14} aria-hidden /> {e.duree}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const BENEFICES: { icone: LucideIcon; texte: string; classe: string }[] = [
  { icone: Zap, texte: "100 % pratique", classe: "text-lavande" },
  { icone: BookOpen, texte: "Accessible à tous les niveaux", classe: "text-lavande" },
  { icone: ShieldCheck, texte: "Suivi personnalisé", classe: "text-lavande" },
  { icone: Heart, texte: "Ni note ni classement, juste tes progrès", classe: "text-rose" },
];

/** Le bandeau des bénéfices, et l'invitation manuscrite qui ouvre le panneau de démarrage. */
export function Bandeau({ onCommencer }: { onCommencer: () => void }) {
  return (
    <footer id="a-propos" className="scroll-mt-32 border-t border-border pb-8 pt-6">
      <div className="flex flex-col gap-8 xl:flex-row xl:items-center">
        <ul className="grid flex-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0">
          {BENEFICES.map((b, n) => (
            <li key={b.texte} className={`flex items-center gap-4 xl:px-6 ${n > 0 ? "xl:border-l xl:border-border" : "xl:pl-0"}`}>
              <b.icone size={24} strokeWidth={1.75} className={`shrink-0 ${b.classe}`} aria-hidden />
              <span className="text-sm">{b.texte}</span>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onCommencer} className="group flex items-end gap-1 self-end text-left text-rose xl:self-auto">
          <svg width="52" height="34" viewBox="0 0 52 34" aria-hidden className="transition-transform group-hover:-translate-x-1">
            <path d="M48 28 C 34 32, 16 26, 8 8" className="fleche-trait" />
            <path d="M3 15 L7 6 L15 11" className="fleche-pointe" />
          </svg>
          <span className="-rotate-6 font-hand text-2xl leading-6">
            Le prochain chapitre
            <br />
            commence ici&nbsp;!
          </span>
        </button>
      </div>
    </footer>
  );
}
