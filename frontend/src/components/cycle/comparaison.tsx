import { Check, Scale, X } from "lucide-react";
import type { Comparaison } from "@/lib/api";
import { afficherValeur } from "@/lib/format";

/** Écran de comparaison prédiction / réalité (F6), point par point puis ligne par ligne. */
export function EcranComparaison({ comparaison }: { comparaison: Comparaison }) {
  const justes = comparaison.points.filter((p) => p.juste).length;
  return (
    <div className="flex flex-col gap-4">
      <div className={`card flex items-start gap-3 p-5 ${comparaison.tout_juste ? "border-success/40" : ""}`}>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            comparaison.tout_juste ? "bg-success-soft text-success" : "bg-primary-soft text-primary"
          }`}
        >
          <Scale size={20} />
        </span>
        <div>
          <h2 className="font-display text-2xl font-semibold">
            {comparaison.tout_juste ? "Ta trace colle à la réalité" : "Regarde où ta trace a bifurqué"}
          </h2>
          <p className="text-sm text-muted">
            {justes} point{justes > 1 ? "s" : ""} sur {comparaison.points.length} ·{" "}
            {comparaison.sortie_valeurs_seules ? "valeurs justes" : comparaison.sortie_juste ? "sortie identique" : "la sortie diffère"}
          </p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-3 font-medium">Point de contrôle</th>
              <th className="px-4 py-3 font-medium">Ta prédiction</th>
              <th className="px-4 py-3 font-medium">Réalité</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {comparaison.points.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{p.question}</td>
                <td className="px-4 py-3 font-mono">{afficherValeur(p.predit)}</td>
                <td className="px-4 py-3 font-mono font-semibold">
                  {p.atteint ? afficherValeur(p.reel) : <span className="font-sans font-normal text-muted">jamais atteint</span>}
                </td>
                <td className="px-4 py-3">
                  <Verdict juste={p.juste} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[420px] font-mono text-sm">
          <thead>
            <tr className="border-b border-border text-left font-sans text-muted">
              <th className="w-12 px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Console prédite</th>
              <th className="px-4 py-3 font-medium">Console réelle</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {comparaison.console.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-3 font-sans text-muted">
                  Rien d&apos;affiché, ni prédit.
                </td>
              </tr>
            )}
            {comparaison.console.map((l) => (
              <tr key={l.numero} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 text-muted">{l.numero}</td>
                <td className="px-4 py-2.5">{l.predite ?? "—"}</td>
                <td className="px-4 py-2.5 font-semibold">{l.reelle ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <Verdict juste={l.juste} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {comparaison.erreur && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          L&apos;exécution s&apos;est arrêtée{comparaison.erreur.ligne ? ` ligne ${comparaison.erreur.ligne}` : ""} :{" "}
          {comparaison.erreur.message}
        </p>
      )}
    </div>
  );
}

function Verdict({ juste }: { juste: boolean }) {
  return juste ? (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-success-soft text-success" aria-label="juste">
      <Check size={16} />
    </span>
  ) : (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent" aria-label="différent">
      <X size={16} />
    </span>
  );
}
