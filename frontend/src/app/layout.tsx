import type { Metadata } from "next";
import { Caveat, DM_Serif_Display, JetBrains_Mono, Manrope } from "next/font/google";
import { Suspense } from "react";
import { ThemeSelonPage } from "@/components/theme-selon-page";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const dmSerif = DM_Serif_Display({ variable: "--font-dm-serif", subsets: ["latin"], weight: "400" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ALGO_DEX",
  description: "Apprendre à dérouler un algorithme : écrire, prédire, visualiser, comparer.",
};

// Sans choix mémorisé : accueil public sombre, espace apprenant clair (maquettes validées).
const SCRIPT_THEME = `(function(){try{var t=localStorage.getItem("algodex.theme")||(location.pathname==="/"?"dark":"light");document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      data-theme="dark"
      suppressHydrationWarning
      className={`${manrope.variable} ${dmSerif.variable} ${jetbrains.variable} ${caveat.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
      </head>
      <body className="min-h-full">
        {/* Lit le chemin de la page : sous Suspense pour ne pas bloquer le pré-rendu des routes dynamiques. */}
        <Suspense fallback={null}>
          <ThemeSelonPage />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
