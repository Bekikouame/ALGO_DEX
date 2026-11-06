"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";
import { profilActif, quitterProfil } from "@/lib/profils";

/** Avant de quitter : le code est montré une dernière fois, car lui seul permettra de rouvrir le profil. */
export function FenetreQuitterProfil({ pseudo, onRester }: { pseudo: string; onRester: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const id = profilActif();
    if (!id) return;
    api.codeReprise(id).then((r) => setCode(r.code_reprise), (e) => setErreur(e.message));
  }, []);

  useEffect(() => {
    const echap = (e: KeyboardEvent) => {
      if (e.key === "Escape") onRester();
    };
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [onRester]);

  function quitter() {
    quitterProfil(pseudo);
    router.push("/");
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="titre-quitter">
      <div className="card w-full max-w-md p-6">
        <h2 id="titre-quitter" className="font-display text-2xl">
          Quitter ce profil&nbsp;?
        </h2>
        <p className="mt-2 text-sm text-muted">
          Pour rouvrir <strong className="text-text">{pseudo}</strong>, ici ou ailleurs, il te faudra ton pseudo et ce code. Note-le maintenant.
        </p>
        <p className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border bg-bg/70 p-3 font-mono text-xl font-semibold tracking-[0.12em]">
          <KeyRound size={18} className="text-primary" aria-hidden /> {code ?? "…"}
        </p>
        {erreur && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {erreur}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" autoFocus onClick={onRester} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold">
            Rester
          </button>
          <button type="button" disabled={!code} onClick={quitter} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-50">
            J&apos;ai noté mon code, quitter
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
