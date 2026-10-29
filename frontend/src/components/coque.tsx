"use client";

import { Compass, Gauge, Languages, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { quitterProfil } from "@/lib/profils";
import { Avatar, Marque, Mascotte } from "./marque";
import { BasculeTheme } from "./theme";

const NAVIGATION = [
  { href: "/parcours", libelle: "Parcours", icone: Compass },
  { href: "/calibrage", libelle: "Test de niveau", icone: Gauge },
  { href: "/langages", libelle: "Langages", icone: Languages },
];

/** La coque du cockpit : barre latérale (maquette 1), contenu sur papier (maquette 2). */
export function Coque({ pseudo, titre, children }: { pseudo?: string; titre?: ReactNode; children: ReactNode }) {
  const chemin = usePathname();
  const router = useRouter();

  function changerProfil() {
    quitterProfil();
    router.push("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
        <div className="px-2">
          <Marque />
        </div>
        <nav className="mt-10 flex flex-col gap-1" aria-label="Navigation principale">
          {NAVIGATION.map(({ href, libelle, icone: Icone }) => {
            const actif = chemin.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={actif ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  actif ? "bg-primary text-on-primary shadow-card" : "text-muted hover:bg-surface-2 hover:text-text"
                }`}
              >
                <Icone size={18} />
                {libelle}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-2 p-4 pt-14">
            <Mascotte taille={72} className="absolute -top-1 right-3" />
            <p className="font-hand text-2xl leading-6">Un pas à la fois, tu deviens meilleur !</p>
          </div>
          {pseudo && (
            <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
              <Avatar pseudo={pseudo} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{pseudo}</div>
                <div className="text-xs text-muted">Apprenant</div>
              </div>
              <button
                type="button"
                onClick={changerProfil}
                className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-text"
                title="Changer de profil"
                aria-label="Changer de profil"
              >
                <Users size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-bg/85 px-4 py-3 backdrop-blur sm:px-8">
          <div className="lg:hidden">
            <Marque sousTitre={false} />
          </div>
          <div className="hidden min-w-0 flex-1 text-sm text-muted lg:block">{titre}</div>
          <div className="ml-auto flex items-center gap-3">
            <BasculeTheme />
            {pseudo && <Avatar pseudo={pseudo} taille={36} />}
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-4 py-2 lg:hidden" aria-label="Navigation">
          {NAVIGATION.map(({ href, libelle, icone: Icone }) => (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                chemin.startsWith(href) ? "bg-primary text-on-primary" : "text-muted"
              }`}
            >
              <Icone size={16} />
              {libelle}
            </Link>
          ))}
          <button type="button" onClick={changerProfil} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted">
            <Users size={16} /> Profils
          </button>
        </nav>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

export function Chargement({ texte = "Chargement…" }: { texte?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted" role="status">
      {texte}
    </div>
  );
}

export function MessageErreur({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
      {message}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
