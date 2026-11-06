"use client";

import { Lock, Target } from "lucide-react";
import { useState } from "react";
import type { PointControle, Prediction } from "@/lib/api";
import { afficherValeur, decrireMoment } from "@/lib/format";

/** Ce qu'il faut écrire dans la console prédite, avec un exemple qui n'est pas celui de l'exercice. */
export function AideConsole() {
  return (
    <span className="mb-2 block text-sm text-muted">
      Écris ce que l&apos;ordinateur affichera : <strong className="text-text">une ligne pour chaque « écrire » exécuté</strong>, dans l&apos;ordre.
      Dans une boucle, chaque tour ajoute une ligne. Le texte entre guillemets se recopie, et une variable est remplacée par sa valeur.
      <span className="mt-1.5 block rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs text-text">
        Exemple, si t vaut 5 : écrire(&quot;total :&quot;, t) → total : 5
      </span>
    </span>
  );
}

/** Trace guidée (F4) : 2 à 4 points de contrôle + la sortie finale. */
export function FormulairePrediction({
  points,
  engagee,
  onEngager,
  enCours,
}: {
  points: PointControle[];
  engagee: Prediction | null;
  onEngager: (p: Prediction) => void;
  enCours: boolean;
}) {
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const [sortie, setSortie] = useState("");
  const complet = points.every((p) => (valeurs[p.id] ?? "").trim() !== "") && sortie.trim() !== "";

  if (engagee) {
    return (
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Lock size={16} className="text-primary" /> Ta prédiction est engagée
        </div>
        <ul className="flex flex-col gap-2">
          {points.map((p) => (
            <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-surface-2 px-4 py-2.5 text-sm">
              <span>{p.question}</span>
              <span className="font-mono font-semibold">{afficherValeur(engagee.points[p.id])}</span>
            </li>
          ))}
          <li className="rounded-xl bg-surface-2 px-4 py-2.5 text-sm">
            <div className="mb-1">Sortie prédite</div>
            <pre className="font-mono font-semibold">{engagee.sortie.join("\n") || "—"}</pre>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <form
      className="card flex flex-col gap-5 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!complet) return;
        onEngager({ points: valeurs, sortie: sortie.split("\n") });
      }}
    >
      <div>
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
          <Target size={22} className="text-primary" /> Prédis avant de voir
        </h2>
        <p className="mt-1 text-sm text-muted">
          Déroule l&apos;algorithme dans ta tête, point par point. Prédire faux n&apos;est jamais un échec : c&apos;est là
          que l&apos;apprentissage commence.
        </p>
      </div>

      {points.map((p, k) => (
        <label key={p.id} className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
              {k + 1}
            </span>
            {p.question}
          </span>
          <span className="pl-8 text-xs text-muted">
            <code className="font-mono">{p.variable}</code> {decrireMoment(p.moment, p.variable)}
          </span>
          <input
            value={valeurs[p.id] ?? ""}
            onChange={(e) => setValeurs((v) => ({ ...v, [p.id]: e.target.value }))}
            placeholder="ta valeur (un nombre, un texte, vrai/faux, ou [1, 2, 3])"
            className="ml-8 rounded-xl border border-border bg-bg px-3 py-2 font-mono text-sm outline-none focus:border-primary"
          />
        </label>
      ))}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Et la sortie finale ?</span>
        <AideConsole />
        <textarea
          value={sortie}
          onChange={(e) => setSortie(e.target.value)}
          rows={3}
          placeholder={"1re ligne affichée\n2e ligne affichée"}
          className="rounded-xl border border-border bg-bg px-3 py-2 font-mono text-sm outline-none focus:border-primary"
        />
      </label>

      <button
        type="submit"
        disabled={!complet || enCours}
        className="self-start rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-40"
      >
        {enCours ? "Engagement…" : "Engager ma prédiction"}
      </button>
    </form>
  );
}
