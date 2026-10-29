import type { Metadata } from "next";
import { Caveat, DM_Serif_Display, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const dmSerif = DM_Serif_Display({ variable: "--font-dm-serif", subsets: ["latin"], weight: "400" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ALGO_DEX",
  description: "Apprendre à dérouler un algorithme : écrire, prédire, visualiser, comparer.",
};

// Le sombre est l'identité validée ; le clair reste à un clic et le choix est mémorisé.
const SCRIPT_THEME = `(function(){try{var t=localStorage.getItem("algodex.theme");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
