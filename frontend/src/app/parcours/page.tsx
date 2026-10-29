"use client";

import { ArrowRight, BookOpenCheck, CheckCircle2, Gauge, Languages, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CarteMaitrise, LegendeCarte } from "@/components/carte";
import { Chargement, Coque, MessageErreur } from "@/components/coque";
import { Mascotte } from "@/components/marque";
import { api, LIBELLES_NOTION, type Cockpit } from "@/lib/api";
import { useProfilActif } from "@/lib/profils";

export default function Parcours() {
  const profilId = useProfilActif();
  const [cockpit, setCockpit] = useState<Cockpit | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!profilId) return;
    api.cockpit(profilId).then(setCockpit).catch((e) => setErreur(e.message));
  }, [profilId]);

  if (erreur) {
    return (
      <Coque>
        <MessageErreur message={erreur} />
      </Coque>
    );
  }
  if (!cockpit) return <Coque><Chargement /></Coque>;

  const liens = Object.fromEntries(cockpit.exercices.map((e) => [e.notion, `/exercice/${e.id}`]));
  const prochain = cockpit.exercices.find((e) => e.notion === cockpit.prochaine_notion);
  const calibrageAFaire = cockpit.calibrage.statut !== "terminee";

  return (
    <Coque pseudo={cockpit.profil.pseudo} titre="Parcours">
      <section className="hero relative overflow-hidden rounded-3xl p-6 text-white shadow-card sm:p-10">
        <Mascotte taille={120} className="absolute -bottom-2 right-6 hidden sm:block" />
        <p className="text-sm text-white/75">Bonjour {cockpit.profil.pseudo}</p>
        <h1 className="mt-1 max-w-xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
          Maîtrise la logique, progresse à ton rythme.
        </h1>
        <div className="mt-6 flex flex-wrap gap-3">
          {calibrageAFaire ? (
            <Link href="/calibrage" className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1d3fb8]">
              <Gauge size={18} /> {cockpit.calibrage.statut === "a_commencer" ? "Passer le test de niveau" : "Reprendre le test de niveau"}
            </Link>
          ) : prochain ? (
            <Link href={`/exercice/${prochain.id}`} className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1d3fb8]">
              Continuer : {LIBELLES_NOTION[prochain.notion]} <ArrowRight size={18} />
            </Link>
          ) : (
            <span className="flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold">
              <CheckCircle2 size={18} /> Les quatre notions sont au vert
            </span>
          )}
        </div>
        <p className="mt-6 hidden max-w-[16rem] -rotate-2 font-hand text-2xl leading-6 text-white/90 md:block">
          La prochaine étape est toujours la première notion pas encore au vert.
        </p>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">Ta carte de maîtrise</h2>
          <LegendeCarte />
        </div>
        <CarteMaitrise
          carte={cockpit.carte}
          debloquees={cockpit.notions_debloquees}
          liens={liens}
          prochaine={cockpit.prochaine_notion}
        />
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-4 font-display text-2xl font-semibold">Les exercices cœur</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {cockpit.exercices.map((e) => (
              <li key={e.id}>
                {e.accessible ? (
                  <Link href={`/exercice/${e.id}`} className="card flex items-center gap-4 p-4 transition-colors hover:border-primary">
                    <IconeExercice reussi={e.reussi} />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block font-semibold">{e.titre}</span>
                      <span className="block text-xs text-muted">
                        {LIBELLES_NOTION[e.notion]}
                        {e.tentative_en_cours ? " · en cours" : e.reussi ? " · réussi" : ""}
                      </span>
                    </span>
                    <ArrowRight size={16} className="text-muted" />
                  </Link>
                ) : (
                  <div className="card flex items-center gap-4 p-4 opacity-55">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-muted">
                      <Lock size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block font-semibold">{e.titre}</span>
                      <span className="block text-xs text-muted">{LIBELLES_NOTION[e.notion]} · verrouillé</span>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 font-display text-2xl font-semibold">Récompenses</h2>
          <div className="card p-5">
            {cockpit.recompenses.length === 0 ? (
              <p className="text-sm text-muted">
                Chaque notion au vert débloque son algorithme écrit en Python, puis en quatre langages côte à côte.
              </p>
            ) : (
              <>
                <ul className="flex flex-wrap gap-2">
                  {cockpit.recompenses.map((r) => (
                    <li key={r.notion} className="rounded-full bg-success-soft px-3 py-1 text-sm font-medium text-success">
                      {LIBELLES_NOTION[r.notion]}
                    </li>
                  ))}
                </ul>
                <Link href="/langages" className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Languages size={16} /> Voir les quatre langages <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </Coque>
  );
}

function IconeExercice({ reussi }: { reussi: boolean }) {
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
        reussi ? "bg-success-soft text-success" : "bg-primary-soft text-primary"
      }`}
    >
      {reussi ? <CheckCircle2 size={20} /> : <BookOpenCheck size={20} />}
    </span>
  );
}
