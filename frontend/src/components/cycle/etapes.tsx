import { Lock, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface DefEtape<C extends string> {
  cle: C;
  titre: string;
  sousTitre: string;
  icone: LucideIcon;
}

/** Barre d'étapes du bas (maquette 2), étapes verrouillées signalées (maquette 1). */
export function BarreEtapes<C extends string>({
  etapes,
  courante,
  accessibles,
  onChoisir,
  action,
}: {
  etapes: DefEtape<C>[];
  courante: C;
  accessibles: Set<C>;
  onChoisir: (c: C) => void;
  action?: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-4 py-3 sm:px-6">
        <ol className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {etapes.map((e, k) => {
            const active = e.cle === courante;
            const ouverte = accessibles.has(e.cle);
            const Icone = ouverte ? e.icone : Lock;
            return (
              <li key={e.cle} className="shrink-0">
                <button
                  type="button"
                  disabled={!ouverte}
                  onClick={() => onChoisir(e.cle)}
                  aria-current={active ? "step" : undefined}
                  className={`relative flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors disabled:cursor-not-allowed ${
                    active ? "bg-primary-soft text-primary" : ouverte ? "hover:bg-surface-2" : "opacity-45"
                  }`}
                >
                  <Icone size={20} className="shrink-0" />
                  <span className="hidden md:block">
                    <span className="block text-sm font-semibold">
                      <span className="mr-1 text-muted">{k + 1}.</span>
                      {e.titre}
                    </span>
                    <span className="block text-xs text-muted">{e.sousTitre}</span>
                  </span>
                  {active && <span className="absolute inset-x-3 -top-3 h-0.5 rounded-full bg-primary" />}
                </button>
              </li>
            );
          })}
        </ol>
        {action}
      </div>
    </div>
  );
}

export function PointsProgression({ total, courant }: { total: number; courant: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden font-medium sm:inline">
        Étape {courant + 1} sur {total}
      </span>
      <div className="flex items-center">
        {Array.from({ length: total }, (_, k) => (
          <div key={k} className="flex items-center">
            {k > 0 && <span className={`h-0.5 w-5 ${k <= courant ? "bg-primary" : "bg-border"}`} />}
            <span className={`h-3 w-3 rounded-full ${k <= courant ? "bg-primary" : "bg-border"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
