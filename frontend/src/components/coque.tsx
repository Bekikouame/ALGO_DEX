"use client";

import { useState, type ReactNode } from "react";
import { BarreLaterale, BoutonMenu, MenuMobile } from "./barre-laterale";
import { Avatar, Marque } from "./marque";
import { BasculeTheme } from "./theme";

/**
 * La coque de l'espace apprenant : barre latérale rétractable (menu coulissant sur téléphone),
 * contenu sur fond ivoire qui prend toute la largeur laissée par la barre.
 * `enTeteFlottant` : sur grand écran, thème et avatar flottent dans le coin au lieu d'occuper une bande.
 */
export function Coque({
  pseudo,
  titre,
  enTeteFlottant = false,
  children,
}: {
  pseudo?: string;
  titre?: ReactNode;
  enTeteFlottant?: boolean;
  children: ReactNode;
}) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    // Sur grand écran, la barre latérale reste fixe et la zone principale défile seule ; sur téléphone, la page défile.
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
      <BarreLaterale pseudo={pseudo} />
      <MenuMobile ouvert={menuOuvert} onFermer={() => setMenuOuvert(false)} pseudo={pseudo} />

      <div className="relative flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-y-auto lg:scroll-smooth motion-reduce:scroll-auto">
        <header
          className={`flex items-center gap-3 px-4 py-4 sm:px-8 ${enTeteFlottant ? "lg:absolute lg:right-0 lg:top-0 lg:z-30 lg:pt-5" : "lg:pt-6"}`}
        >
          <BoutonMenu onOuvrir={() => setMenuOuvert(true)} />
          <span className="md:hidden">
            <Marque sousTitre={false} />
          </span>
          <div className="hidden min-w-0 flex-1 text-sm text-muted md:block">{titre}</div>
          <div className="ml-auto flex items-center gap-3">
            <BasculeTheme />
            {pseudo && <Avatar pseudo={pseudo} taille={40} />}
          </div>
        </header>
        <main className={`mx-auto w-full max-w-[88rem] flex-1 px-4 pb-12 pt-2 sm:px-8 ${enTeteFlottant ? "lg:pb-4 lg:pt-4" : ""}`}>{children}</main>
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
