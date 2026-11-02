"use client";

// Illustrations de l'espace apprenant : volumes doux, lumière bleue et violette.
// Décoratives (aria-hidden) : le texte voisin porte toujours le sens.
import { useId } from "react";
import type { Notion } from "@/lib/api";

/** Le robot ALGO_DEX en volume : même silhouette que la mascotte de l'accueil, ombrée et lumineuse. */
export function RobotAlgo({ taille = 140, className = "", tablette = false }: { taille?: number; className?: string; tablette?: boolean }) {
  const id = useId();
  const g = (n: string) => `${id}-${n}`;
  return (
    <svg width={taille} height={taille * 1.1} viewBox="0 0 120 132" className={className} aria-hidden>
      <defs>
        <linearGradient id={g("coque")} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9defa" />
        </linearGradient>
        <linearGradient id={g("visiere")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#232a66" />
          <stop offset="1" stopColor="#0b0e2b" />
        </linearGradient>
        <radialGradient id={g("oeil")} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#c9fbff" />
          <stop offset="0.5" stopColor="#5fe3ff" />
          <stop offset="1" stopColor="#2a8cff" />
        </radialGradient>
        <linearGradient id={g("violet")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b7bff" />
          <stop offset="1" stopColor="#4b3fd6" />
        </linearGradient>
        <radialGradient id={g("boule")} cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffd3e6" />
          <stop offset="1" stopColor="#f0569e" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="126" rx="30" ry="4.5" fill="#4b3fd6" opacity=".15" />
      {/* antenne */}
      <path d="M60 22V11" stroke="#b9bfe6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="9" r="5.5" fill={`url(#${g("boule")})`} />
      <circle cx="58" cy="7" r="1.6" fill="#fff" opacity=".8" />
      {/* corps */}
      <rect x="34" y="78" width="52" height="40" rx="18" fill={`url(#${g("coque")})`} stroke="#c8cef5" />
      <circle cx="60" cy="96" r="5" fill={`url(#${g("oeil")})`} />
      {/* bras */}
      <rect x="20" y="82" width="14" height="28" rx="7" fill={`url(#${g("coque")})`} stroke="#c8cef5" transform="rotate(14 27 96)" />
      <rect x="86" y="80" width="14" height="28" rx="7" fill={`url(#${g("coque")})`} stroke="#c8cef5" transform={tablette ? "rotate(-50 93 92)" : "rotate(-14 93 94)"} />
      {tablette && (
        <g transform="rotate(-12 100 86)">
          <rect x="88" y="66" width="30" height="38" rx="5" fill={`url(#${g("violet")})`} opacity=".9" />
          <path d="M94 76h18M94 82h12M94 88h15" stroke="#e4e0ff" strokeWidth="2" strokeLinecap="round" opacity=".8" />
        </g>
      )}
      {/* tête */}
      <circle cx="16" cy="52" r="8" fill={`url(#${g("violet")})`} />
      <circle cx="104" cy="52" r="8" fill={`url(#${g("violet")})`} />
      <rect x="16" y="22" width="88" height="60" rx="28" fill={`url(#${g("coque")})`} stroke="#c8cef5" />
      <path d="M28 34c10-8 40-10 60-2" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".9" />
      <rect x="26" y="34" width="68" height="38" rx="19" fill={`url(#${g("visiere")})`} />
      <ellipse cx="46" cy="52" rx="7" ry="8.5" fill={`url(#${g("oeil")})`} />
      <ellipse cx="74" cy="52" rx="7" ry="8.5" fill={`url(#${g("oeil")})`} />
      <circle cx="48" cy="49" r="2.2" fill="#fff" />
      <circle cx="76" cy="49" r="2.2" fill="#fff" />
      <path d="M53 63c4 3 10 3 14 0" stroke="#5fe3ff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** L'atelier algorithmique de l'accueil personnalisé : écran de code, variables qui flottent, plantes. */
export function AtelierAlgo({ className = "" }: { className?: string }) {
  const id = useId();
  const g = (n: string) => `${id}-${n}`;
  return (
    <svg viewBox="0 0 480 300" className={className} aria-hidden>
      <defs>
        <linearGradient id={g("arche")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9e4ff" />
          <stop offset="0.55" stopColor="#c7bcff" />
          <stop offset="1" stopColor="#8f7bff" />
        </linearGradient>
        <radialGradient id={g("halo")} cx="0.6" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g("ecran")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2363" />
          <stop offset="1" stopColor="#0b0e2b" />
        </linearGradient>
        <linearGradient id={g("bureau")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3f0ff" />
          <stop offset="1" stopColor="#d8d2fb" />
        </linearGradient>
        <linearGradient id={g("feuille")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6fd3a0" />
          <stop offset="1" stopColor="#2f8f6a" />
        </linearGradient>
        <linearGradient id={g("puce")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4d7cff" />
          <stop offset="1" stopColor="#6c4dff" />
        </linearGradient>
        <filter id={g("lueur")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {/* arche lumineuse */}
      <path d="M150 268V120C150 52 222 14 300 14s150 38 150 106v148z" fill={`url(#${g("arche")})`} />
      <path d="M190 268V132c0-48 50-80 110-80s110 32 110 80v136z" fill={`url(#${g("halo")})`} opacity=".7" />
      <path d="M232 70h40M300 52v34M340 70h30" stroke="#ffffff" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" />
      {/* étagère */}
      <rect x="350" y="150" width="78" height="6" rx="3" fill="#a99cf5" />
      <rect x="360" y="128" width="12" height="22" rx="2" fill="#6c5cfc" />
      <rect x="374" y="122" width="10" height="28" rx="2" fill="#f062b8" opacity=".8" />
      <rect x="386" y="132" width="14" height="18" rx="2" fill="#4d7cff" />
      {/* bureau */}
      <ellipse cx="300" cy="276" rx="190" ry="14" fill="#6c5cfc" opacity=".12" />
      <rect x="120" y="226" width="350" height="16" rx="8" fill={`url(#${g("bureau")})`} />
      <rect x="138" y="242" width="10" height="34" rx="4" fill="#cfc7f7" />
      <rect x="440" y="242" width="10" height="34" rx="4" fill="#cfc7f7" />
      {/* écran */}
      <rect x="238" y="98" width="172" height="118" rx="14" fill="#0b0e2b" filter={`url(#${g("lueur")})`} opacity=".35" />
      <rect x="236" y="92" width="172" height="118" rx="14" fill={`url(#${g("ecran")})`} />
      <rect x="236" y="92" width="172" height="118" rx="14" fill="none" stroke="#8b7bff" strokeOpacity=".6" />
      <circle cx="252" cy="106" r="3" fill="#ff5f57" />
      <circle cx="262" cy="106" r="3" fill="#febc2e" />
      <circle cx="272" cy="106" r="3" fill="#28c840" />
      <text x="250" y="136" className="font-mono" fontSize="11" fill="#c4a7ff">
        pour <tspan fill="#8fd8ff">i</tspan> de <tspan fill="#f5b06b">0</tspan> à <tspan fill="#f5b06b">4</tspan> faire
      </text>
      <text x="262" y="156" className="font-mono" fontSize="11" fill="#c4a7ff">
        écrire(<tspan fill="#8fd8ff">i</tspan>)
      </text>
      <text x="250" y="176" className="font-mono" fontSize="11" fill="#c4a7ff">
        fin pour
      </text>
      <rect x="250" y="188" width="54" height="6" rx="3" fill="#3ddbb0" opacity=".7" />
      <rect x="308" y="216" width="28" height="12" rx="3" fill="#cfc7f7" />
      {/* variables qui flottent */}
      {["i = 0", "i = 1", "i = 2"].map((t, n) => (
        <g key={t} className="flotte" style={{ animationDelay: `${n * 0.6}s` }}>
          <rect x="176" y={104 + n * 34} width="50" height="24" rx="7" fill={`url(#${g("puce")})`} opacity={n === 1 ? 1 : 0.85} />
          <text x="201" y={120 + n * 34} textAnchor="middle" className="font-mono" fontSize="11" fill="#fff">
            {t}
          </text>
        </g>
      ))}
      {/* plante */}
      <path d="M178 226c-6-18-30-26-40-48 18 4 34 18 40 34M182 226c2-22 14-40 34-50-4 20-16 36-32 48M180 226c-12-14-12-34-4-48 8 14 10 32 4 48" fill={`url(#${g("feuille")})`} />
      <path d="M160 226h44l-6 24h-32z" fill="#f4f1ff" stroke="#d6cff9" />
      {/* pot rose */}
      <path d="M424 226h28l-4 18h-20z" fill="#f062b8" opacity=".8" />
      <path d="M438 226c-2-12 4-22 12-26-2 10-6 18-12 26M436 226c-8-8-8-18-4-26 4 8 6 16 4 26" fill={`url(#${g("feuille")})`} />
      {/* étincelles */}
      <path d="M126 70l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#8b7bff" opacity=".7" className="scintille" />
      <path d="M452 40l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#f062b8" opacity=".7" className="scintille" />
    </svg>
  );
}

/** Une petite scène par notion : jamais la même image pour deux notions. */
export function SceneNotion({ notion, className = "" }: { notion: Notion; className?: string }) {
  const id = useId();
  const g = (n: string) => `${id}-${n}`;
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden>
      <defs>
        <radialGradient id={g("nuage")} cx="0.5" cy="0.55" r="0.55">
          <stop offset="0" stopColor="#e4ddff" />
          <stop offset="1" stopColor="#e4ddff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g("bleu")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4d7cff" />
          <stop offset="1" stopColor="#7a4dff" />
        </linearGradient>
        <linearGradient id={g("nuit")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#252b70" />
          <stop offset="1" stopColor="#0f1240" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="64" rx="96" ry="54" fill={`url(#${g("nuage")})`} />
      {notion === "variables" && (
        <g>
          <rect x="42" y="30" width="48" height="40" rx="10" fill="#fff" stroke="#c8bfff" />
          <text x="54" y="46" className="font-mono" fontSize="10" fill="#6c5cfc">x</text>
          <text x="74" y="62" className="font-mono" fontSize="16" fill="#252b70" textAnchor="middle">3</text>
          <path d="M98 50h18" stroke={`url(#${g("bleu")})`} strokeWidth="3" strokeLinecap="round" />
          <path d="M112 44l6 6-6 6" fill="none" stroke="#7a4dff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="124" y="30" width="48" height="40" rx="10" fill={`url(#${g("bleu")})`} />
          <text x="136" y="46" className="font-mono" fontSize="10" fill="#dcd6ff">x</text>
          <text x="156" y="62" className="font-mono" fontSize="16" fill="#fff" textAnchor="middle">5</text>
          <path d="M30 92h60M110 92h40" stroke="#c8bfff" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {notion === "conditions" && (
        <g>
          <rect x="22" y="26" width="72" height="50" rx="9" fill={`url(#${g("nuit")})`} />
          <circle cx="31" cy="34" r="2" fill="#ff5f57" />
          <circle cx="38" cy="34" r="2" fill="#febc2e" />
          <path d="M30 46h40M30 55h28M36 64h32" stroke="#8fd8ff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
          <path d="M94 52h16c10 0 10-22 22-22h10M110 52c10 0 10 24 22 24h10" fill="none" stroke={`url(#${g("bleu")})`} strokeWidth="3" strokeLinecap="round" />
          <path d="M110 46l6 6-6 6-6-6z" fill="#f062b8" />
          <rect x="144" y="20" width="34" height="20" rx="6" fill="#3ddbb0" />
          <path d="M154 30l4 4 8-8" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="144" y="66" width="34" height="20" rx="6" fill="#fff" stroke="#f9a8cf" />
          <path d="M156 72l10 8M166 72l-10 8" stroke="#f062b8" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
      {notion === "boucles" && (
        <g>
          <path d="M100 60m-34 0a34 34 0 1 1 34 34" fill="none" stroke={`url(#${g("bleu")})`} strokeWidth="8" strokeLinecap="round" />
          <path d="M100 60m-20 0a20 20 0 1 1 20 20" fill="none" stroke="#a99cf5" strokeWidth="6" strokeLinecap="round" />
          <path d="M100 60m-7 0a7 7 0 1 1 7 7" fill="none" stroke="#f062b8" strokeWidth="4" strokeLinecap="round" />
          <path d="M92 90l10 4-6 9" fill="none" stroke="#7a4dff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M150 28l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#f5b06b" className="scintille" />
          <path d="M44 90l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#8b7bff" />
        </g>
      )}
      {notion === "tableaux" && (
        <g>
          <path d="M34 36h-8v48h8M166 36h8v48h-8" fill="none" stroke="#6c5cfc" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {["1", "2", "3", "4"].map((v, n) => (
            <g key={v}>
              <rect x={40 + n * 31} y="42" width="26" height="34" rx="7" fill={n === 2 ? `url(#${g("bleu")})` : "#fff"} stroke="#c8bfff" />
              <text x={53 + n * 31} y="65" textAnchor="middle" className="font-mono" fontSize="15" fill={n === 2 ? "#fff" : "#252b70"}>
                {v}
              </text>
              <text x={53 + n * 31} y="92" textAnchor="middle" className="font-mono" fontSize="8" fill="#8c86b8">
                {n}
              </text>
            </g>
          ))}
          <path d="M180 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#f062b8" className="scintille" />
        </g>
      )}
    </svg>
  );
}
