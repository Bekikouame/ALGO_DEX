"use client";

import { ArrowRight, CheckCircle2, CircleHelp, Languages } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BarreLaterale } from "@/components/barre-laterale";
import { Chargement, MessageErreur } from "@/components/coque";
import { Laboratoire } from "@/components/labo/laboratoire";
import { PseudoCode } from "@/components/cycle/pseudo-code";
import { api, LIBELLES_NOTION, type Cockpit, type ExercicePublic, type Notion, type Progression, type Soumission } from "@/lib/api";
import { GUIDES } from "@/lib/guides";
import { useProfilActif } from "@/lib/profils";

type Reussite = Extract<Soumission, { valide: true }>;

export function ExerciceCoeur() {
  const { id } = useParams<{ id: string }>();
  const profilId = useProfilActif();
  if (!profilId) return <Chargement />;
  // Une clé par exercice : changer d'exercice repart d'un état neuf.
  return <Exercice key={`${profilId}:${id}`} id={id} profilId={profilId} />;
}

function Exercice({ id, profilId }: { id: string; profilId: string }) {
  const [depart, setDepart] = useState<(Progression & { exercice: ExercicePublic }) | null>(null);
  const [cockpit, setCockpit] = useState<Cockpit | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reussite, setReussite] = useState<Reussite | null>(null);

  useEffect(() => {
    api.cockpit(profilId).then(setCockpit).catch(() => {});
    api
      .ouvrirTentative(profilId, id)
      .then((p) => setDepart(p as Progression & { exercice: ExercicePublic }))
      .catch((e) => setErreur(e.message));
  }, [profilId, id]);

  async function surSoumission(resultat: Soumission) {
    if ("valide" in resultat && resultat.valide) {
      setReussite(resultat);
      setCockpit(await api.cockpit(profilId));
    }
  }

  if (erreur) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <MessageErreur
          message={erreur}
          action={
            <Link href="/parcours" className="font-semibold underline">
              Retour au parcours
            </Link>
          }
        />
      </div>
    );
  }
  if (!depart) return <Chargement />;

  const notion = depart.exercice.notion;
  return (
    // Page de travail : la barre latérale est compacte par défaut, le laboratoire prend la largeur qu'elle libère.
    <div className="flex">
      <BarreLaterale pseudo={cockpit?.profil.pseudo} compacteParDefaut />
      <div className="min-w-0 flex-1">
        <Laboratoire
          key={depart.tentative.id}
          depart={depart}
          pseudo={cockpit?.profil.pseudo}
          aide={<GuideNotion notion={notion} />}
          onSoumis={surSoumission}
        />
      </div>
      {reussite && <Recompense reussite={reussite} cockpit={cockpit} />}
    </div>
  );
}

/** Guide en cage (F10) : un écran, un exemple tracé, jamais le point d'entrée. */
function GuideNotion({ notion }: { notion: Notion }) {
  const guide = GUIDES[notion];
  return (
    <>
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <CircleHelp size={18} className="text-primary" /> Aide & explications
        </div>
        <p className="text-sm">{guide.idee}</p>
        <PseudoCode
          lignes={guide.code.map((texte, k) => ({ ligne: k + 1, texte }))}
          titre={`Exemple · ${LIBELLES_NOTION[notion].toLowerCase()}`}
          className="mt-4"
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-center font-mono text-xs">
            <thead>
              <tr className="text-muted">
                {guide.trace.colonnes.map((c) => (
                  <th key={c} className="border-b border-border px-2 py-1.5 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guide.trace.lignes.map((l, k) => (
                <tr key={k}>
                  {l.map((c, j) => (
                    <td key={j} className="border-b border-border px-2 py-1.5">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-2xl border border-warning/30 bg-warning-soft p-5">
        <div className="mb-1 font-semibold text-warning">Où regarder</div>
        <p className="text-sm">{guide.regarder}</p>
      </div>
    </>
  );
}

/** Récompense sobre de fin de notion (F9) : le même algorithme, en Python, en lecture seule. */
function Recompense({ reussite, cockpit }: { reussite: Reussite; cockpit: Cockpit | null }) {
  const suivant = cockpit?.exercices.find((e) => e.notion === cockpit.prochaine_notion && e.accessible);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="titre-reussite">
      <div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={26} />
          </span>
          <div>
            <h2 id="titre-reussite" className="font-display text-3xl font-semibold">
              {LIBELLES_NOTION[reussite.recompense.notion]} : validée
            </h2>
            <p className="text-sm text-muted">Tu as fait tout le chemin : écrire, prédire, voir, comparer, corriger.</p>
          </div>
        </div>

        {reussite.recompense.python && (
          <div className="mt-6">
            <div className="mb-2 text-sm font-semibold">Ton algorithme, écrit en Python</div>
            <pre className="overflow-x-auto rounded-2xl bg-code-bg p-4 font-mono text-[13px] leading-6 text-code-text">
              {reussite.recompense.python}
            </pre>
            <p className="mt-2 text-xs text-muted">Lecture seule : la logique est la même, seule la syntaxe change.</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {suivant ? (
            <Link href={`/exercice/${suivant.id}`} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary">
              Notion suivante : {LIBELLES_NOTION[suivant.notion]} <ArrowRight size={16} />
            </Link>
          ) : (
            <Link href="/parcours" className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary">
              Retour au parcours <ArrowRight size={16} />
            </Link>
          )}
          <Link href="/langages" className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium">
            <Languages size={16} /> Les quatre langages
          </Link>
        </div>
      </div>
    </div>
  );
}
