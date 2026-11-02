"use client";

import { ArrowDown, ArrowUp, Delete, Lock, Plus, Trash2, X } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { colorer } from "@/components/code/colorer";
import { blocVide, depuisJetons, enJetons, modifierSequence, type Bloc, type Chemin, type TypeBloc } from "@/lib/blocs";

// Éditeur intégré (F3) : le code se lit comme du code, les parties à compléter sont des « trous »
// qu'on remplit au clic. On compose par blocs, sans jamais taper de syntaxe ; le JSON produit est
// exactement celui qu'attend l'interpréteur du moteur.

type Insertion = { chemin: Chemin; position: number };

/** Pendant l'exécution : ligne en cours, lignes déjà exécutées, ligne suivante, ligne en erreur (numéros du moteur). */
export type SuiviExecution = { courante: number | null; executees: Set<number>; suivante: number | null; erreur: number | null };

interface ContexteEditeur {
  variables: string[];
  verrouille: boolean;
  modifier: (chemin: Chemin, f: (seq: Bloc[]) => Bloc[]) => void;
  ouvert: string | null;
  ouvrir: (id: string | null) => void;
  insertion: Insertion | null;
  inserer: (i: Insertion | null) => void;
  suivi: SuiviExecution | null;
}

const Contexte = createContext<ContexteEditeur | null>(null);
const useEditeur = () => useContext(Contexte)!;

const cle = (chemin: Chemin) => chemin.join(".");
const memeChemin = (a: Chemin, b: Chemin) => cle(a) === cle(b);

export function EditeurBlocs({
  blocs,
  onChange,
  variables,
  verrouille = false,
  suivi = null,
  sansCadre = false,
}: {
  blocs: Bloc[];
  onChange: (b: Bloc[]) => void;
  variables: string[];
  verrouille?: boolean;
  suivi?: SuiviExecution | null;
  sansCadre?: boolean;
}) {
  const [ouvert, ouvrir] = useState<string | null>(null);
  const [insertion, inserer] = useState<Insertion | null>(null);
  const modifier = (chemin: Chemin, f: (seq: Bloc[]) => Bloc[]) => onChange(modifierSequence(blocs, chemin, f));

  // Un clic hors d'une bulle, ou Échap, referme bulle et menu d'insertion.
  useEffect(() => {
    if (!ouvert && !insertion) return;
    const dehors = (e: PointerEvent) => {
      if (!(e.target as Element).closest("[data-editeur-bulle]")) {
        ouvrir(null);
        inserer(null);
      }
    };
    const echap = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      ouvrir(null);
      inserer(null);
    };
    document.addEventListener("pointerdown", dehors);
    window.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("pointerdown", dehors);
      window.removeEventListener("keydown", echap);
    };
  }, [ouvert, insertion]);

  const lignes = aplatir(blocs, [], 0, verrouille ? null : insertion);
  const numerotee = (l: Ligne) => l.sorte === "bloc" || l.sorte === "sinon" || l.sorte === "fin";
  // Numéro de ligne de code : les menus et les corps vides n'en ont pas.
  const numeros = lignes.map((l, k) => (numerotee(l) ? lignes.slice(0, k + 1).filter(numerotee).length : null));

  return (
    <Contexte.Provider value={{ variables, verrouille, modifier, ouvert, ouvrir, insertion, inserer, suivi }}>
      <div
        className={
          sansCadre
            ? "text-[#e4e6ff]"
            : "rounded-3xl border border-[#4b43b8]/60 bg-[#111338] p-3 text-[#e4e6ff] shadow-[0_30px_80px_-30px_rgb(108_92_252/0.55)]"
        }
      >
        <div className={`mb-2.5 flex items-center gap-3 px-1 ${sansCadre ? "hidden" : ""}`}>
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </span>
          <span className="rounded-lg bg-[#0b0d29] px-3 py-1 text-xs font-semibold">mon algorithme</span>
          {verrouille ? (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-[#b4a3ff]">
              <Lock size={13} /> figé jusqu&apos;à la comparaison
            </span>
          ) : (
            <span className="ml-auto hidden text-xs text-white/40 sm:block">clique sur un … pour le remplir</span>
          )}
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#0b0d29] py-2 font-mono text-[14px]">
          {lignes.map((l, k) => (
            <LigneEditeur key={idLigne(l)} ligne={l} numero={numeros[k]} />
          ))}
        </div>
      </div>
    </Contexte.Provider>
  );
}

// --------------------------------------------------------------------------
// Les lignes affichées : instructions, « sinon », « fin … », corps vides, menu d'insertion
// --------------------------------------------------------------------------

type BlocSi = Extract<Bloc, { type: "si" }>;
type Ligne =
  | { sorte: "bloc"; bloc: Bloc; chemin: Chemin; index: number; taille: number; niveau: number }
  | { sorte: "sinon"; bloc: BlocSi; chemin: Chemin; index: number; niveau: number }
  | { sorte: "fin"; texte: string; chemin: Chemin; index: number; niveau: number }
  | { sorte: "vide"; chemin: Chemin; niveau: number }
  | { sorte: "menu"; chemin: Chemin; position: number; niveau: number };

function idLigne(l: Ligne) {
  if (l.sorte === "vide") return `vide:${cle(l.chemin)}`;
  if (l.sorte === "menu") return `menu:${cle(l.chemin)}:${l.position}`;
  return `${l.sorte}:${cle(l.chemin)}:${l.index}`;
}

function aplatir(blocs: Bloc[], chemin: Chemin, niveau: number, insertion: Insertion | null): Ligne[] {
  const menu = (position: number): Ligne[] =>
    insertion && memeChemin(insertion.chemin, chemin) && insertion.position === position ? [{ sorte: "menu", chemin, position, niveau }] : [];
  const lignes: Ligne[] = [...menu(0)];
  if (blocs.length === 0 && lignes.length === 0) lignes.push({ sorte: "vide", chemin, niveau });
  blocs.forEach((bloc, index) => {
    lignes.push({ sorte: "bloc", bloc, chemin, index, taille: blocs.length, niveau });
    if (bloc.type === "si") {
      lignes.push(...aplatir(bloc.alors, [...chemin, index, "alors"], niveau + 1, insertion));
      const cheminSinon: Chemin = [...chemin, index, "sinon"];
      if (bloc.sinon.length || (insertion && memeChemin(insertion.chemin, cheminSinon))) {
        lignes.push({ sorte: "sinon", bloc, chemin, index, niveau });
        lignes.push(...aplatir(bloc.sinon, cheminSinon, niveau + 1, insertion));
      }
      lignes.push({ sorte: "fin", texte: "fin si", chemin, index, niveau });
    } else if (bloc.type === "tant_que" || bloc.type === "pour") {
      lignes.push(...aplatir(bloc.corps, [...chemin, index, "corps"], niveau + 1, insertion));
      lignes.push({ sorte: "fin", texte: bloc.type === "pour" ? "fin pour" : "fin tant que", chemin, index, niveau });
    }
    lignes.push(...menu(index + 1));
  });
  return lignes;
}

/** Où « + » insère une ligne : dans le corps d'un bloc ouvrant, sinon juste après. */
function pointInsertion(l: Ligne): Insertion | null {
  if (l.sorte === "bloc") {
    if (l.bloc.type === "si") return { chemin: [...l.chemin, l.index, "alors"], position: 0 };
    if (l.bloc.type === "pour" || l.bloc.type === "tant_que") return { chemin: [...l.chemin, l.index, "corps"], position: 0 };
    return { chemin: l.chemin, position: l.index + 1 };
  }
  if (l.sorte === "sinon") return { chemin: [...l.chemin, l.index, "sinon"], position: 0 };
  if (l.sorte === "fin") return { chemin: l.chemin, position: l.index + 1 };
  return null;
}

const RETRAIT = 1.5; // rem par niveau

function LigneEditeur({ ligne, numero }: { ligne: Ligne; numero: number | null }) {
  const { verrouille, inserer, suivi } = useEditeur();
  const courante = !!suivi && numero !== null && suivi.courante === numero;
  const executee = !!suivi && numero !== null && suivi.executees.has(numero);
  const suivante = !!suivi && numero !== null && suivi.suivante === numero && !courante;
  const enErreur = !!suivi && numero !== null && suivi.erreur === numero;
  const point = pointInsertion(ligne);
  // Un trait vertical discret par niveau d'indentation, comme dans un éditeur de code.
  const retrait = {
    paddingLeft: `${ligne.niveau * RETRAIT + 0.25}rem`,
    backgroundImage: `repeating-linear-gradient(to right, rgb(255 255 255 / 0.08) 0 1px, transparent 1px ${RETRAIT}rem)`,
    backgroundSize: `${ligne.niveau * RETRAIT}rem 100%`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "0.3rem 0",
  };

  return (
    <div
      aria-current={courante ? "step" : undefined}
      className={`group relative flex min-h-9 items-center pr-2 transition-colors duration-300 ${
        enErreur
          ? "bg-[#ff5f57]/20"
          : courante
            ? "bg-[#6c5cfc]/35 shadow-[inset_3px_0_0_#8b7bff]"
            : suivante
              ? "shadow-[inset_3px_0_0_rgb(139_123_255/0.35)]"
              : "hover:bg-white/[0.03] focus-within:bg-white/[0.04]"
      } ${suivi && !executee && !courante ? "opacity-60" : ""}`}
    >
      <span className="flex w-11 shrink-0 select-none items-center justify-end gap-0.5 pr-2 text-right text-white/30 sm:w-14 sm:gap-1 sm:pr-3">
        {!verrouille && point && (
          <button
            type="button"
            data-editeur-bulle
            onClick={() => inserer(point)}
            aria-label={`Insérer une ligne après la ligne ${numero}`}
            className="flex h-5 w-5 items-center justify-center rounded-md text-[#f062b8] opacity-0 transition-opacity hover:bg-[#f062b8]/15 focus:opacity-100 group-hover:opacity-100"
          >
            <Plus size={14} />
          </button>
        )}
        <span className={`w-5 ${courante ? "font-bold text-[#b4a3ff]" : ""}`}>{courante ? "▶" : numero}</span>
        {suivi && numero !== null && (
          <span
            aria-hidden
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${enErreur ? "bg-[#ff5f57]" : executee ? "bg-[#3ddbb0]" : "bg-white/15"}`}
            title={executee ? "déjà exécutée" : "pas encore exécutée"}
          />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1 self-stretch py-1" style={retrait}>
        <ContenuLigne ligne={ligne} />
      </div>
      {!verrouille && ligne.sorte === "bloc" && <OutilsLigne ligne={ligne} />}
    </div>
  );
}

function Mot({ children }: { children: ReactNode }) {
  return <span className="text-[#c4a7ff]">{children}</span>;
}

function ContenuLigne({ ligne }: { ligne: Ligne }) {
  const { modifier, inserer, verrouille } = useEditeur();
  if (ligne.sorte === "fin") return <Mot>{ligne.texte}</Mot>;
  if (ligne.sorte === "sinon") return <Mot>sinon</Mot>;
  if (ligne.sorte === "vide") {
    if (verrouille) return <span className="text-white/25">…</span>;
    return (
      <button
        type="button"
        data-editeur-bulle
        onClick={() => inserer({ chemin: ligne.chemin, position: 0 })}
        className="rounded-md px-1.5 text-left text-white/35 transition-colors hover:bg-white/5 hover:text-[#f062b8]"
      >
        {ligne.chemin.length === 0 ? "+ ta première instruction" : "+ ajouter ici"}
      </button>
    );
  }
  if (ligne.sorte === "menu") return <MenuInsertion chemin={ligne.chemin} position={ligne.position} />;

  const { bloc, chemin, index } = ligne;
  const id = (champ: string) => `${cle(chemin)}:${index}:${champ}`;
  const remplacer = (nouveau: Bloc) => modifier(chemin, (seq) => seq.map((x, j) => (j === index ? nouveau : x)));

  switch (bloc.type) {
    case "affectation":
      return (
        <>
          <span className="flex items-center">
            <TrouVariable id={id("variable")} valeur={bloc.variable} onChange={(variable) => remplacer({ ...bloc, variable })} />
            {bloc.index !== undefined && (
              <>
                <span>[</span>
                <TrouExpression id={id("index")} valeur={bloc.index} sorte="calcul" vide="i" onChange={(i) => remplacer({ ...bloc, index: i })} />
                <span>]</span>
              </>
            )}
          </span>
          <span className="text-[#f062b8]">←</span>
          <TrouExpression id={id("valeur")} valeur={bloc.valeur} sorte="calcul" onChange={(valeur) => remplacer({ ...bloc, valeur })} />
        </>
      );
    case "ecrire":
      return (
        <span className="flex flex-wrap items-center">
          <Mot>écrire(</Mot>
          {bloc.valeurs.map((v, k) => (
            <span key={k} className="flex items-center">
              {k > 0 && <span className="mr-1 text-white/60">,</span>}
              <TrouExpression
                id={id(`valeur${k}`)}
                valeur={v}
                sorte="calcul"
                onChange={(nv) => remplacer({ ...bloc, valeurs: bloc.valeurs.map((x, j) => (j === k ? nv : x)) })}
                onRetirer={bloc.valeurs.length > 1 ? () => remplacer({ ...bloc, valeurs: bloc.valeurs.filter((_, j) => j !== k) }) : undefined}
              />
            </span>
          ))}
          <Mot>)</Mot>
        </span>
      );
    case "si":
      return (
        <>
          <Mot>si</Mot>
          <TrouExpression id={id("condition")} valeur={bloc.condition} sorte="condition" onChange={(condition) => remplacer({ ...bloc, condition })} />
          <Mot>alors</Mot>
        </>
      );
    case "tant_que":
      return (
        <>
          <Mot>tant que</Mot>
          <TrouExpression id={id("condition")} valeur={bloc.condition} sorte="condition" onChange={(condition) => remplacer({ ...bloc, condition })} />
          <Mot>faire</Mot>
        </>
      );
    case "pour":
      return (
        <>
          <Mot>pour</Mot>
          <TrouVariable id={id("variable")} valeur={bloc.variable} onChange={(variable) => remplacer({ ...bloc, variable })} />
          <Mot>de</Mot>
          <TrouExpression id={id("debut")} valeur={bloc.debut} sorte="calcul" onChange={(debut) => remplacer({ ...bloc, debut })} />
          <Mot>à</Mot>
          <TrouExpression id={id("fin")} valeur={bloc.fin} sorte="calcul" onChange={(fin) => remplacer({ ...bloc, fin })} />
          <Mot>faire</Mot>
        </>
      );
  }
}

/** Monter, descendre, supprimer, et l'option propre à chaque instruction : visibles au survol seulement. */
function OutilsLigne({ ligne }: { ligne: Extract<Ligne, { sorte: "bloc" }> }) {
  const { modifier, inserer } = useEditeur();
  const { bloc, chemin, index, taille } = ligne;
  const remplacer = (nouveau: Bloc) => modifier(chemin, (seq) => seq.map((x, j) => (j === index ? nouveau : x)));
  const deplacer = (delta: number) =>
    modifier(chemin, (seq) => {
      const copie = [...seq];
      [copie[index], copie[index + delta]] = [copie[index + delta], copie[index]];
      return copie;
    });

  const option =
    bloc.type === "si" ? (
      bloc.sinon.length ? (
        <Outil onClick={() => remplacer({ ...bloc, sinon: [] })}>− sinon</Outil>
      ) : (
        <Outil onClick={() => inserer({ chemin: [...chemin, index, "sinon"], position: 0 })}>+ sinon</Outil>
      )
    ) : bloc.type === "ecrire" ? (
      <Outil onClick={() => remplacer({ ...bloc, valeurs: [...bloc.valeurs, ""] })}>+ valeur</Outil>
    ) : bloc.type === "affectation" ? (
      bloc.index !== undefined ? (
        <Outil onClick={() => remplacer({ type: "affectation", variable: bloc.variable, valeur: bloc.valeur })}>− case</Outil>
      ) : (
        <Outil onClick={() => remplacer({ ...bloc, index: "" })}>une case [ ]</Outil>
      )
    ) : null;

  return (
    <span
      data-editeur-bulle
      className="pointer-events-none absolute right-1.5 top-1 flex items-center gap-0.5 rounded-lg bg-[#161a45]/95 px-1 font-sans text-white/55 opacity-0 shadow-lg transition-opacity focus-within:pointer-events-auto focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
    >
      {option}
      <Outil onClick={() => deplacer(-1)} desactive={index === 0} etiquette="Monter la ligne">
        <ArrowUp size={14} />
      </Outil>
      <Outil onClick={() => deplacer(1)} desactive={index === taille - 1} etiquette="Descendre la ligne">
        <ArrowDown size={14} />
      </Outil>
      <Outil onClick={() => modifier(chemin, (seq) => seq.filter((_, j) => j !== index))} etiquette="Supprimer la ligne" danger>
        <Trash2 size={14} />
      </Outil>
    </span>
  );
}

function Outil({
  onClick,
  children,
  desactive = false,
  etiquette,
  danger = false,
}: {
  onClick: () => void;
  children: ReactNode;
  desactive?: boolean;
  etiquette?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactive}
      aria-label={etiquette}
      title={etiquette}
      className={`rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-white/10 disabled:opacity-25 ${danger ? "hover:text-[#ff7a66]" : "hover:text-white"}`}
    >
      {children}
    </button>
  );
}

const MODELES: { type: TypeBloc; apercu: string }[] = [
  { type: "affectation", apercu: "x ← …" },
  { type: "ecrire", apercu: "écrire(…)" },
  { type: "si", apercu: "si … alors" },
  { type: "pour", apercu: "pour … faire" },
  { type: "tant_que", apercu: "tant que … faire" },
];

const PREMIER_TROU: Record<TypeBloc, string> = {
  affectation: "variable",
  ecrire: "valeur0",
  si: "condition",
  pour: "variable",
  tant_que: "condition",
};

/** Le choix de l'instruction à insérer, montré comme le code qu'elle produira. */
function MenuInsertion({ chemin, position }: { chemin: Chemin; position: number }) {
  const { modifier, inserer, ouvrir } = useEditeur();
  return (
    <span data-editeur-bulle className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#f062b8]/40 bg-[#f062b8]/5 p-1.5 font-sans">
      {MODELES.map((m) => (
        <button
          key={m.type}
          type="button"
          autoFocus={m.type === "affectation"}
          onClick={() => {
            modifier(chemin, (seq) => [...seq.slice(0, position), blocVide(m.type), ...seq.slice(position)]);
            inserer(null);
            ouvrir(`${cle(chemin)}:${position}:${PREMIER_TROU[m.type]}`);
          }}
          className="rounded-lg border border-white/10 bg-[#111338] px-2.5 py-1 font-mono text-[13px] transition-colors hover:border-[#8b7bff] focus:border-[#8b7bff] focus:outline-none"
        >
          {colorer(m.apercu)}
        </button>
      ))}
      <button type="button" onClick={() => inserer(null)} aria-label="Annuler l'insertion" className="rounded-md p-1 text-white/40 hover:text-white">
        <X size={14} />
      </button>
    </span>
  );
}

// --------------------------------------------------------------------------
// Les trous : un nom de variable, ou une expression composée jeton par jeton
// --------------------------------------------------------------------------

const NOM_VALIDE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function Trou({
  id,
  rempli,
  vide,
  children,
  bulle,
}: {
  id: string;
  rempli: boolean;
  vide: string;
  children: ReactNode;
  bulle: ReactNode;
}) {
  const { ouvert, ouvrir, verrouille } = useEditeur();
  const actif = ouvert === id;
  if (verrouille) return <span>{rempli ? children : <span className="text-white/30">{vide}</span>}</span>;
  return (
    <span data-editeur-bulle className="relative inline-flex">
      <button
        type="button"
        onClick={() => ouvrir(actif ? null : id)}
        aria-expanded={actif}
        aria-label={rempli ? undefined : `Compléter : ${vide}`}
        className={`rounded-md px-1 transition-colors ${
          actif
            ? "bg-[#6c5cfc]/30 ring-1 ring-[#8b7bff]"
            : rempli
              ? "hover:bg-white/10"
              : "border-b-2 border-dashed border-[#f062b8]/70 px-2 text-[#f062b8]/80 hover:bg-[#f062b8]/10"
        }`}
      >
        {rempli ? children : vide}
      </button>
      {actif && (
        <span className="absolute left-0 top-full z-40 mt-1.5 flex w-[min(19rem,calc(100vw-2.5rem))] flex-col gap-2.5 rounded-xl border border-[#4b43b8]/80 bg-[#161a45] p-3 font-sans text-sm shadow-[0_20px_50px_-15px_rgb(0_0_0/0.8)]">
          {bulle}
        </span>
      )}
    </span>
  );
}

function Pastille({ children, onClick, accent = false }: { children: ReactNode; onClick: () => void; accent?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2 py-0.5 font-mono text-[13px] transition-colors ${
        accent ? "border-[#8fd8ff]/30 bg-[#8fd8ff]/10 text-[#8fd8ff] hover:border-[#8fd8ff]" : "border-white/10 bg-white/5 hover:border-[#8b7bff]"
      }`}
    >
      {children}
    </button>
  );
}

function TrouVariable({ id, valeur, onChange }: { id: string; valeur: string; onChange: (v: string) => void }) {
  const { variables, ouvrir } = useEditeur();
  const [saisie, setSaisie] = useState("");
  const valide = NOM_VALIDE.test(saisie);
  const choisir = (v: string) => {
    onChange(v);
    setSaisie("");
    ouvrir(null);
  };
  return (
    <Trou
      id={id}
      rempli={!!valeur}
      vide="variable"
      bulle={
        <>
          {variables.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <Pastille key={v} onClick={() => choisir(v)} accent>
                  {v}
                </Pastille>
              ))}
            </span>
          )}
          <input
            autoFocus
            value={saisie}
            onChange={(e) => setSaisie(e.target.value.replace(/\s/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && valide) {
                e.preventDefault();
                choisir(saisie);
              }
            }}
            placeholder="nouveau nom, puis Entrée"
            aria-label="Nom de la nouvelle variable"
            className="rounded-lg border border-white/15 bg-[#0b0d29] px-2.5 py-1.5 font-mono text-[13px] outline-none placeholder:text-white/30 focus:border-[#8b7bff]"
          />
        </>
      }
    >
      <span className="text-[#8fd8ff]">{valeur}</span>
    </Trou>
  );
}

const OPERATEURS = {
  calcul: ["+", "-", "*", "/", "div", "mod", "(", ")"],
  condition: ["=", "≠", "<", "≤", ">", "≥", "et", "ou", "non"],
};
const AUTRES = ["vrai", "faux", "[", "]", ",", "longueur("];

function TrouExpression({
  id,
  valeur,
  sorte,
  vide = "…",
  onChange,
  onRetirer,
}: {
  id: string;
  valeur: string;
  sorte: "calcul" | "condition";
  vide?: string;
  onChange: (v: string) => void;
  onRetirer?: () => void;
}) {
  const { variables, ouvrir } = useEditeur();
  const [nombre, setNombre] = useState("");
  const [texte, setTexte] = useState("");
  const [plus, setPlus] = useState(false);
  const jetons = enJetons(valeur);
  const poser = (nouveaux: string[]) => onChange(depuisJetons(nouveaux));
  const ajouter = (j: string) => poser([...jetons, j]);
  const operateurs = [...OPERATEURS[sorte], ...(plus ? OPERATEURS[sorte === "calcul" ? "condition" : "calcul"] : [])];

  return (
    <Trou
      id={id}
      rempli={jetons.length > 0}
      vide={vide}
      bulle={
        <>
          <span className="flex min-h-8 flex-wrap items-center gap-1 rounded-lg bg-[#0b0d29] px-2 py-1 font-mono text-[13px]">
            {jetons.length === 0 && <span className="text-white/30">compose ta valeur…</span>}
            {jetons.map((j, k) => (
              <button
                key={k}
                type="button"
                onClick={() => poser(jetons.filter((_, x) => x !== k))}
                title="Retirer"
                className="rounded px-0.5 hover:bg-[#ff7a66]/20 hover:line-through"
              >
                {colorer(j)}
              </button>
            ))}
            {jetons.length > 0 && (
              <button type="button" onClick={() => poser(jetons.slice(0, -1))} aria-label="Effacer le dernier" className="ml-auto text-white/40 hover:text-white">
                <Delete size={14} />
              </button>
            )}
          </span>
          {variables.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <Pastille key={v} onClick={() => ajouter(v)} accent>
                  {v}
                </Pastille>
              ))}
            </span>
          )}
          <span className="flex flex-wrap gap-1.5">
            {operateurs.map((o) => (
              <Pastille key={o} onClick={() => ajouter(o)}>
                {o}
              </Pastille>
            ))}
            {plus && AUTRES.map((o) => (
              <Pastille key={o} onClick={() => ajouter(o)}>
                {o}
              </Pastille>
            ))}
          </span>
          <span className="flex items-center gap-1.5">
            <input
              autoFocus
              value={nombre}
              inputMode="decimal"
              onChange={(e) => setNombre(e.target.value.replace(/[^\d.,]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nombre) {
                  e.preventDefault();
                  ajouter(nombre.replace(",", "."));
                  setNombre("");
                }
              }}
              placeholder="nombre ↵"
              aria-label="Nombre"
              className="w-24 rounded-lg border border-white/15 bg-[#0b0d29] px-2 py-1 font-mono text-[13px] outline-none placeholder:text-white/30 focus:border-[#8b7bff]"
            />
            {plus && (
              <input
                value={texte}
                onChange={(e) => setTexte(e.target.value.replace(/"/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    ajouter(`"${texte}"`);
                    setTexte("");
                  }
                }}
                placeholder="texte ↵"
                aria-label="Texte"
                className="w-24 rounded-lg border border-white/15 bg-[#0b0d29] px-2 py-1 text-[13px] outline-none placeholder:text-white/30 focus:border-[#8b7bff]"
              />
            )}
            <button type="button" onClick={() => setPlus((x) => !x)} className="text-xs text-white/50 underline-offset-2 hover:text-white hover:underline">
              {plus ? "moins" : "plus…"}
            </button>
          </span>
          <span className="flex items-center gap-2 border-t border-white/10 pt-2.5">
            {onRetirer && (
              <button
                type="button"
                onClick={() => {
                  onRetirer();
                  ouvrir(null);
                }}
                className="text-xs text-white/50 hover:text-[#ff7a66]"
              >
                retirer cette valeur
              </button>
            )}
            <button
              type="button"
              onClick={() => ouvrir(null)}
              className="ml-auto rounded-lg bg-[#6c5cfc] px-3 py-1 text-xs font-semibold text-white hover:bg-[#8577ff]"
            >
              OK
            </button>
          </span>
        </>
      }
    >
      {colorer(valeur)}
    </Trou>
  );
}
