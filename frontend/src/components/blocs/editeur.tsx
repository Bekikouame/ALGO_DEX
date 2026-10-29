"use client";

import { ArrowDown, ArrowUp, Delete, Lock, Plus, Trash2, X } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";
import {
  blocVide,
  depuisJetons,
  enJetons,
  LIBELLES_BLOC,
  modifierSequence,
  type Bloc,
  type Chemin,
  type TypeBloc,
} from "@/lib/blocs";

interface ContexteEditeur {
  variables: string[];
  verrouille: boolean;
  modifier: (chemin: Chemin, f: (seq: Bloc[]) => Bloc[]) => void;
}

const Contexte = createContext<ContexteEditeur | null>(null);
const useEditeur = () => useContext(Contexte)!;

const COULEURS: Record<TypeBloc, string> = {
  affectation: "border-l-[#2156e0]",
  si: "border-l-[#d97706]",
  tant_que: "border-l-[#7c3aed]",
  pour: "border-l-[#7c3aed]",
  ecrire: "border-l-[#16884a]",
};

/** Éditeur de blocs (F3) : affectation, si/sinon, tant que, pour, écrire — aucune syntaxe à taper. */
export function EditeurBlocs({
  blocs,
  onChange,
  variables,
  verrouille = false,
}: {
  blocs: Bloc[];
  onChange: (b: Bloc[]) => void;
  variables: string[];
  verrouille?: boolean;
}) {
  const modifier = (chemin: Chemin, f: (seq: Bloc[]) => Bloc[]) => onChange(modifierSequence(blocs, chemin, f));
  return (
    <Contexte.Provider value={{ variables, verrouille, modifier }}>
      {verrouille && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-primary-soft px-4 py-2.5 text-sm text-primary">
          <Lock size={16} /> Ton algorithme est figé tant que tu n&apos;as pas comparé ta prédiction à la réalité.
        </div>
      )}
      <fieldset disabled={verrouille} className={verrouille ? "opacity-70" : ""}>
        <Sequence blocs={blocs} chemin={[]} />
      </fieldset>
    </Contexte.Provider>
  );
}

function Sequence({ blocs, chemin }: { blocs: Bloc[]; chemin: Chemin }) {
  const { modifier, verrouille } = useEditeur();
  return (
    <div className="flex flex-col gap-2">
      {blocs.map((b, k) => (
        <CarteBloc
          key={k}
          bloc={b}
          premier={k === 0}
          dernier={k === blocs.length - 1}
          chemin={chemin}
          index={k}
          remplacer={(nouveau) => modifier(chemin, (seq) => seq.map((x, j) => (j === k ? nouveau : x)))}
        />
      ))}
      {!verrouille && <AjoutBloc onAjouter={(t) => modifier(chemin, (seq) => [...seq, blocVide(t)])} vide={blocs.length === 0} />}
    </div>
  );
}

function AjoutBloc({ onAjouter, vide }: { onAjouter: (t: TypeBloc) => void; vide: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={`flex items-center gap-2 self-start rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted hover:border-primary hover:text-primary ${vide ? "w-full justify-center py-3" : ""}`}
      >
        <Plus size={14} /> Ajouter un bloc
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-primary bg-primary-soft/50 p-2">
      {(Object.keys(LIBELLES_BLOC) as TypeBloc[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => {
            onAjouter(t);
            setOuvert(false);
          }}
          className={`rounded-lg border border-border border-l-4 bg-surface px-3 py-1.5 text-xs font-semibold ${COULEURS[t]}`}
        >
          {LIBELLES_BLOC[t]}
        </button>
      ))}
      <button type="button" onClick={() => setOuvert(false)} className="ml-auto p-1 text-muted" aria-label="Fermer">
        <X size={14} />
      </button>
    </div>
  );
}

function MotCle({ children }: { children: ReactNode }) {
  return <span className="font-mono text-sm font-semibold text-primary">{children}</span>;
}

function CarteBloc({
  bloc,
  chemin,
  index,
  premier,
  dernier,
  remplacer,
}: {
  bloc: Bloc;
  chemin: Chemin;
  index: number;
  premier: boolean;
  dernier: boolean;
  remplacer: (b: Bloc) => void;
}) {
  const { modifier, verrouille } = useEditeur();
  const deplacer = (delta: number) =>
    modifier(chemin, (seq) => {
      const copie = [...seq];
      [copie[index], copie[index + delta]] = [copie[index + delta], copie[index]];
      return copie;
    });

  const outils = !verrouille && (
    <div className="ml-auto flex shrink-0 items-center gap-0.5 text-muted">
      <button type="button" disabled={premier} onClick={() => deplacer(-1)} className="rounded p-1 hover:text-text disabled:opacity-30" aria-label="Monter">
        <ArrowUp size={14} />
      </button>
      <button type="button" disabled={dernier} onClick={() => deplacer(1)} className="rounded p-1 hover:text-text disabled:opacity-30" aria-label="Descendre">
        <ArrowDown size={14} />
      </button>
      <button
        type="button"
        onClick={() => modifier(chemin, (seq) => seq.filter((_, j) => j !== index))}
        className="rounded p-1 hover:text-danger"
        aria-label="Supprimer le bloc"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  const cadre = `rounded-xl border border-border border-l-4 bg-surface p-3 shadow-card ${COULEURS[bloc.type]}`;

  switch (bloc.type) {
    case "affectation":
      return (
        <div className={cadre}>
          <div className="flex flex-wrap items-center gap-2">
            <ChoixVariable valeur={bloc.variable} onChange={(variable) => remplacer({ ...bloc, variable })} />
            {bloc.index !== undefined ? (
              <>
                <MotCle>[</MotCle>
                <ChampExpression valeur={bloc.index} onChange={(index) => remplacer({ ...bloc, index })} court />
                <MotCle>]</MotCle>
                <BoutonTexte onClick={() => remplacer({ type: "affectation", variable: bloc.variable, valeur: bloc.valeur })}>
                  toute la variable
                </BoutonTexte>
              </>
            ) : (
              <BoutonTexte onClick={() => remplacer({ ...bloc, index: "" })}>une case [ ]</BoutonTexte>
            )}
            <MotCle>←</MotCle>
            <ChampExpression valeur={bloc.valeur} onChange={(valeur) => remplacer({ ...bloc, valeur })} />
            {outils}
          </div>
        </div>
      );
    case "ecrire":
      return (
        <div className={cadre}>
          <div className="flex flex-wrap items-center gap-2">
            <MotCle>écrire(</MotCle>
            {bloc.valeurs.map((v, k) => (
              <span key={k} className="flex items-center gap-1">
                {k > 0 && <MotCle>,</MotCle>}
                <ChampExpression
                  valeur={v}
                  onChange={(nv) => remplacer({ ...bloc, valeurs: bloc.valeurs.map((x, j) => (j === k ? nv : x)) })}
                />
                {bloc.valeurs.length > 1 && !verrouille && (
                  <button
                    type="button"
                    onClick={() => remplacer({ ...bloc, valeurs: bloc.valeurs.filter((_, j) => j !== k) })}
                    className="p-0.5 text-muted hover:text-danger"
                    aria-label="Retirer cette valeur"
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}
            {!verrouille && <BoutonTexte onClick={() => remplacer({ ...bloc, valeurs: [...bloc.valeurs, ""] })}>+ valeur</BoutonTexte>}
            <MotCle>)</MotCle>
            {outils}
          </div>
        </div>
      );
    case "si":
      return (
        <div className={cadre}>
          <div className="flex flex-wrap items-center gap-2">
            <MotCle>si</MotCle>
            <ChampExpression valeur={bloc.condition} onChange={(condition) => remplacer({ ...bloc, condition })} />
            <MotCle>alors</MotCle>
            {outils}
          </div>
          <Corps>
            <Sequence blocs={bloc.alors} chemin={[...chemin, index, "alors"]} />
          </Corps>
          {bloc.sinon.length > 0 ? (
            <>
              <div className="mt-2 flex items-center gap-2">
                <MotCle>sinon</MotCle>
                {!verrouille && (
                  <BoutonTexte onClick={() => remplacer({ ...bloc, sinon: [] })}>retirer le sinon</BoutonTexte>
                )}
              </div>
              <Corps>
                <Sequence blocs={bloc.sinon} chemin={[...chemin, index, "sinon"]} />
              </Corps>
            </>
          ) : (
            !verrouille && (
              <div className="mt-2">
                <BoutonTexte onClick={() => remplacer({ ...bloc, sinon: [blocVide("affectation")] })}>+ sinon</BoutonTexte>
              </div>
            )
          )}
          <div className="mt-2">
            <MotCle>fin si</MotCle>
          </div>
        </div>
      );
    case "tant_que":
      return (
        <div className={cadre}>
          <div className="flex flex-wrap items-center gap-2">
            <MotCle>tant que</MotCle>
            <ChampExpression valeur={bloc.condition} onChange={(condition) => remplacer({ ...bloc, condition })} />
            <MotCle>faire</MotCle>
            {outils}
          </div>
          <Corps>
            <Sequence blocs={bloc.corps} chemin={[...chemin, index, "corps"]} />
          </Corps>
          <div className="mt-2">
            <MotCle>fin tant que</MotCle>
          </div>
        </div>
      );
    case "pour":
      return (
        <div className={cadre}>
          <div className="flex flex-wrap items-center gap-2">
            <MotCle>pour</MotCle>
            <ChoixVariable valeur={bloc.variable} onChange={(variable) => remplacer({ ...bloc, variable })} />
            <MotCle>de</MotCle>
            <ChampExpression valeur={bloc.debut} onChange={(debut) => remplacer({ ...bloc, debut })} court />
            <MotCle>à</MotCle>
            <ChampExpression valeur={bloc.fin} onChange={(fin) => remplacer({ ...bloc, fin })} />
            <MotCle>faire</MotCle>
            {outils}
          </div>
          <Corps>
            <Sequence blocs={bloc.corps} chemin={[...chemin, index, "corps"]} />
          </Corps>
          <div className="mt-2">
            <MotCle>fin pour</MotCle>
          </div>
        </div>
      );
  }
}

function Corps({ children }: { children: ReactNode }) {
  return <div className="mt-2 border-l-2 border-dashed border-border pl-4 sm:pl-6">{children}</div>;
}

function BoutonTexte({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="rounded-md px-1.5 py-0.5 text-xs text-muted underline-offset-2 hover:text-primary hover:underline">
      {children}
    </button>
  );
}

const NOM_VALIDE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function ChoixVariable({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  const { variables, verrouille } = useEditeur();
  const [nouveau, setNouveau] = useState(false);
  const [saisie, setSaisie] = useState("");

  if (nouveau) {
    const valide = NOM_VALIDE.test(saisie);
    return (
      <span className="flex items-center gap-1">
        <input
          autoFocus
          value={saisie}
          onChange={(e) => setSaisie(e.target.value.replace(/\s/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && valide) {
              e.preventDefault();
              onChange(saisie);
              setNouveau(false);
            }
            if (e.key === "Escape") setNouveau(false);
          }}
          placeholder="nom"
          aria-label="Nom de la nouvelle variable"
          className="w-24 rounded-lg border border-primary bg-bg px-2 py-1 font-mono text-sm outline-none"
        />
        <button
          type="button"
          disabled={!valide}
          onClick={() => {
            onChange(saisie);
            setNouveau(false);
          }}
          className="rounded-lg bg-primary px-2 py-1 text-xs text-on-primary disabled:opacity-40"
        >
          OK
        </button>
      </span>
    );
  }

  const options = [...new Set([...variables, ...(valeur ? [valeur] : [])])];
  return (
    <select
      value={valeur}
      disabled={verrouille}
      onChange={(e) => {
        if (e.target.value === "__nouvelle__") {
          setSaisie("");
          setNouveau(true);
        } else onChange(e.target.value);
      }}
      aria-label="Variable"
      className={`rounded-lg border bg-bg px-2 py-1 font-mono text-sm font-semibold outline-none focus:border-primary ${valeur ? "border-border" : "border-dashed border-accent text-muted"}`}
    >
      <option value="">variable…</option>
      {options.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
      <option value="__nouvelle__">+ nouvelle variable</option>
    </select>
  );
}

const OPERATEURS = [
  { titre: "Calcul", jetons: ["+", "-", "*", "/", "div", "mod"] },
  { titre: "Comparer", jetons: ["=", "≠", "<", "≤", ">", "≥"] },
  { titre: "Logique", jetons: ["et", "ou", "non", "vrai", "faux"] },
  { titre: "Tableaux", jetons: ["[", "]", ",", "longueur(", "(", ")"] },
];

/** Une expression composée jeton par jeton : variables, nombres, opérateurs. */
function ChampExpression({ valeur, onChange, court = false }: { valeur: string; onChange: (v: string) => void; court?: boolean }) {
  const { variables, verrouille } = useEditeur();
  const [ouvert, setOuvert] = useState(false);
  const [nombre, setNombre] = useState("");
  const [texte, setTexte] = useState("");
  const jetons = enJetons(valeur);
  const poser = (nouveaux: string[]) => onChange(depuisJetons(nouveaux));
  const ajouter = (j: string) => poser([...jetons, j]);

  return (
    <span className="relative inline-flex flex-col">
      <span
        className={`flex min-h-8 flex-wrap items-center gap-1 rounded-lg border px-1.5 py-1 ${court ? "min-w-12" : "min-w-28"} ${
          ouvert ? "border-primary bg-primary-soft/40" : jetons.length ? "border-border bg-bg" : "border-dashed border-accent bg-bg"
        }`}
      >
        {jetons.map((j, k) => (
          <button
            key={k}
            type="button"
            disabled={verrouille}
            onClick={() => poser(jetons.filter((_, x) => x !== k))}
            title="Retirer ce jeton"
            className={`rounded-md px-1.5 py-0.5 font-mono text-sm ${
              variables.includes(j) ? "bg-primary-soft font-semibold text-primary" : j.startsWith('"') ? "bg-success-soft text-success" : "bg-surface-2"
            } ${verrouille ? "" : "hover:line-through"}`}
          >
            {j}
          </button>
        ))}
        {!verrouille && (
          <button
            type="button"
            onClick={() => setOuvert((o) => !o)}
            aria-expanded={ouvert}
            aria-label="Composer l'expression"
            className="rounded-md p-1 text-muted hover:text-primary"
          >
            {ouvert ? <X size={14} /> : <Plus size={14} />}
          </button>
        )}
      </span>

      {ouvert && !verrouille && (
        <span className="absolute left-0 top-full z-30 mt-2 flex w-[min(22rem,85vw)] flex-col gap-3 rounded-xl border border-border bg-surface p-3 shadow-card">
          <Palette titre="Variables">
            {variables.length === 0 && <span className="text-xs text-muted">Aucune variable encore.</span>}
            {variables.map((v) => (
              <Jeton key={v} onClick={() => ajouter(v)} accent>
                {v}
              </Jeton>
            ))}
          </Palette>
          <Palette titre="Nombre">
            <input
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
              aria-label="Nombre"
              className="w-20 rounded-md border border-border bg-bg px-2 py-1 font-mono text-sm"
            />
            <Jeton
              onClick={() => {
                if (nombre) ajouter(nombre.replace(",", "."));
                setNombre("");
              }}
            >
              ajouter
            </Jeton>
          </Palette>
          {OPERATEURS.map((g) => (
            <Palette key={g.titre} titre={g.titre}>
              {g.jetons.map((j) => (
                <Jeton key={j} onClick={() => ajouter(j)}>
                  {j}
                </Jeton>
              ))}
            </Palette>
          ))}
          <Palette titre="Texte">
            <input
              value={texte}
              onChange={(e) => setTexte(e.target.value.replace(/"/g, ""))}
              aria-label="Texte à afficher"
              className="w-32 rounded-md border border-border bg-bg px-2 py-1 text-sm"
            />
            <Jeton
              onClick={() => {
                ajouter(`"${texte}"`);
                setTexte("");
              }}
            >
              ajouter
            </Jeton>
          </Palette>
          <div className="flex gap-2 border-t border-border pt-3">
            <button type="button" onClick={() => poser(jetons.slice(0, -1))} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:text-text">
              <Delete size={14} /> dernier
            </button>
            <button type="button" onClick={() => poser([])} className="rounded-md px-2 py-1 text-xs text-muted hover:text-danger">
              tout effacer
            </button>
            <button type="button" onClick={() => setOuvert(false)} className="ml-auto rounded-md bg-primary px-3 py-1 text-xs font-medium text-on-primary">
              OK
            </button>
          </div>
        </span>
      )}
    </span>
  );
}

function Palette({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <span className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{titre}</span>
      <span className="flex flex-wrap items-center gap-1.5">{children}</span>
    </span>
  );
}

function Jeton({ children, onClick, accent = false }: { children: ReactNode; onClick: () => void; accent?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2 py-0.5 font-mono text-sm ${
        accent ? "border-primary/30 bg-primary-soft text-primary" : "border-border bg-surface-2 hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}
