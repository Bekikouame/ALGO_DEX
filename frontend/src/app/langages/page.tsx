"use client";

import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Chargement, MessageErreur } from "@/components/coque";
import { CoqueRessources } from "@/components/ressources/coque-ressources";
import { api, LIBELLES_NOTION, NOTIONS, type Cockpit, type Langage, type Notion } from "@/lib/api";
import { useProfilActif } from "@/lib/profils";

const LANGAGES: { cle: Langage; nom: string }[] = [
  { cle: "python", nom: "Python" },
  { cle: "javascript", nom: "JavaScript" },
  { cle: "java", nom: "Java" },
  { cle: "c", nom: "C" },
];

/** Page bonus (F9) : un algorithme, quatre syntaxes — débloquée notion par notion. */
export default function Langages() {
  const profilId = useProfilActif();
  const [cockpit, setCockpit] = useState<Cockpit | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [choisie, setChoisie] = useState<Notion | null>(null);

  useEffect(() => {
    if (!profilId) return;
    api
      .cockpit(profilId)
      .then((c) => {
        setCockpit(c);
        setChoisie(c.recompenses[0]?.notion ?? null);
      })
      .catch((e) => setErreur(e.message));
  }, [profilId]);

  if (erreur) return <CoqueRessources><MessageErreur message={erreur} /></CoqueRessources>;
  if (!cockpit) return <CoqueRessources><Chargement /></CoqueRessources>;

  const recompense = cockpit.recompenses.find((r) => r.notion === choisie);

  return (
    // Même habillage que les autres pages Ressources : palette ivoire, recherche, retour à la rubrique.
    <CoqueRessources pseudo={cockpit.profil.pseudo}>
      <Link href="/ressources" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-primary">
        <ArrowLeft size={16} /> Retour aux ressources
      </Link>
      <span className="mt-5 block w-fit rounded-lg bg-primary-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">
        Documentation
      </span>
      <h1 className="mt-4 font-display text-[2.6rem] leading-[1.05] tracking-tight sm:text-5xl">Un algorithme, quatre langages</h1>
      <p className="mt-titre max-w-2xl text-[17px] leading-relaxed text-text/75">
        Le raisonnement ne change pas : seule la syntaxe change. Chaque notion au vert débloque ici son exercice cœur,
        écrit côte à côte en Python, JavaScript, Java et C.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist">
        {NOTIONS.map((n) => {
          const ouverte = cockpit.recompenses.some((r) => r.notion === n);
          return (
            <button
              key={n}
              type="button"
              role="tab"
              aria-selected={choisie === n}
              disabled={!ouverte}
              onClick={() => setChoisie(n)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                choisie === n ? "bg-primary text-on-primary" : "border border-border bg-surface"
              }`}
            >
              {!ouverte && <Lock size={14} />}
              {LIBELLES_NOTION[n]}
            </button>
          );
        })}
      </div>

      {!recompense ? (
        <div className="card mt-6 p-8 text-center text-muted">Valide une notion pour débloquer sa page.</div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted">{recompense.titre}</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {LANGAGES.map(({ cle, nom }) => (
              <div key={cle} className="overflow-hidden rounded-2xl bg-code-bg text-code-text">
                <div className="border-b border-white/10 px-4 py-2.5 text-sm font-semibold">{nom}</div>
                <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6">
                  {recompense.langages[cle] ?? <span className="opacity-40">(pas encore écrit)</span>}
                </pre>
              </div>
            ))}
          </div>
        </>
      )}
    </CoqueRessources>
  );
}
