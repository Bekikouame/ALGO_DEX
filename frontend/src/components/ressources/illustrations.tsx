"use client";

// Illustrations du cours d'algorithmique : volumes doux, bleu #3047F5 et violet #7052F5 sur ivoire.
// Décoratives (aria-hidden) : le texte voisin porte toujours le sens.
import { useId } from "react";

const BLEU = "#3047f5";
const VIOLET = "#7052f5";
const MARINE = "#141c4d";

function useDegrades() {
  const id = useId();
  return (n: string) => `${id}-${n}`;
}

/** Le bureau du héros : ordinateur ouvert sur un organigramme, livres, plantes et formes qui flottent. */
export function SceneCours({ className = "" }: { className?: string }) {
  const g = useDegrades();
  const url = (n: string) => `url(#${g(n)})`;
  return (
    <svg viewBox="0 0 600 400" className={className} aria-hidden>
      <defs>
        <radialGradient id={g("halo")} cx="0.5" cy="0.45" r="0.55">
          <stop offset="0" stopColor="#e3ddff" />
          <stop offset="0.7" stopColor="#efebff" />
          <stop offset="1" stopColor="#efebff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={g("ecran")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f2a72" />
          <stop offset="1" stopColor="#0d1240" />
        </linearGradient>
        <linearGradient id={g("coque")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f3fb" />
          <stop offset="1" stopColor="#c9cbe6" />
        </linearGradient>
        <linearGradient id={g("bleu")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5a6dff" />
          <stop offset="1" stopColor={BLEU} />
        </linearGradient>
        <linearGradient id={g("violet")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9a83ff" />
          <stop offset="1" stopColor={VIOLET} />
        </linearGradient>
        <linearGradient id={g("marine")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2b3478" />
          <stop offset="1" stopColor={MARINE} />
        </linearGradient>
        <linearGradient id={g("feuille")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fd9a8" />
          <stop offset="1" stopColor="#2c8a63" />
        </linearGradient>
        <radialGradient id={g("sphere")} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#c9d1ff" />
          <stop offset="1" stopColor={BLEU} />
        </radialGradient>
        <radialGradient id={g("sphere-v")} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#e2d9ff" />
          <stop offset="1" stopColor={VIOLET} />
        </radialGradient>
        <pattern id={g("points")} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill={VIOLET} opacity=".22" />
        </pattern>
        <filter id={g("flou")} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {/* halo et trame de points */}
      <ellipse cx="330" cy="200" rx="250" ry="185" fill={url("halo")} className="dark:opacity-15" />
      <rect x="455" y="40" width="98" height="84" fill={url("points")} />
      <rect x="40" y="70" width="84" height="70" fill={url("points")} />

      {/* formes qui flottent */}
      <g className="flotte">
        <path d="M120 42l26 -14 26 14 -26 14z" fill="#b9acff" />
        <path d="M120 42v28l26 14V56z" fill={VIOLET} />
        <path d="M172 42v28l-26 14V56z" fill="#5a3fe0" />
      </g>
      <circle cx="520" cy="150" r="20" fill={url("sphere")} className="flotte" style={{ animationDelay: "1.2s" }} />
      <circle cx="92" cy="190" r="11" fill={url("sphere-v")} className="flotte" style={{ animationDelay: ".6s" }} />
      <g className="flotte" style={{ animationDelay: "2s" }}>
        <ellipse cx="470" cy="62" rx="17" ry="17" fill="none" stroke={url("bleu")} strokeWidth="8" />
      </g>
      <path d="M215 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill={VIOLET} className="scintille" />
      <path d="M560 230l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill={BLEU} className="scintille" style={{ animationDelay: ".8s" }} />
      <path d="M58 280l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill={VIOLET} className="scintille" style={{ animationDelay: "1.4s" }} />

      {/* ombre du bureau */}
      <ellipse cx="320" cy="362" rx="270" ry="20" fill={VIOLET} opacity=".12" />

      {/* ordinateur */}
      <rect x="226" y="96" width="256" height="172" rx="14" fill={MARINE} filter={url("flou")} opacity=".3" />
      <rect x="220" y="84" width="256" height="172" rx="14" fill={url("coque")} />
      <rect x="230" y="94" width="236" height="152" rx="8" fill={url("ecran")} />
      <circle cx="242" cy="104" r="2.6" fill="#ff5f57" />
      <circle cx="251" cy="104" r="2.6" fill="#febc2e" />
      <circle cx="260" cy="104" r="2.6" fill="#28c840" />
      <g fontFamily="var(--font-manrope), sans-serif" fontWeight="700" textAnchor="middle">
        {/* organigramme : début, lecture, test, deux branches, fin */}
        <rect x="320" y="104" width="56" height="18" rx="9" fill={url("violet")} />
        <text x="348" y="116.5" fontSize="9" fill="#fff">Début</text>
        <path d="M348 122v8" stroke="#8f9bff" strokeWidth="1.6" />
        <path d="M345 127l3 4 3-4" fill="none" stroke="#8f9bff" strokeWidth="1.6" />
        <path d="M322 133h60l-6 16h-60z" fill="none" stroke="#7ee3ff" strokeWidth="1.6" />
        <text x="348" y="144.5" fontSize="8.5" fill="#d6f6ff" fontFamily="var(--font-jetbrains), monospace">lire(x)</text>
        <path d="M348 149v7" stroke="#8f9bff" strokeWidth="1.6" />
        <path d="M348 157l30 14-30 14-30-14z" fill={url("bleu")} />
        <text x="348" y="174" fontSize="8" fill="#fff" fontFamily="var(--font-jetbrains), monospace">x {">"} 0 ?</text>
        <path d="M318 171h-38v16M378 171h38v16" fill="none" stroke="#8f9bff" strokeWidth="1.6" />
        <text x="298" y="167" fontSize="7" fill="#b9c3ff">oui</text>
        <text x="398" y="167" fontSize="7" fill="#b9c3ff">non</text>
        <rect x="253" y="188" width="54" height="16" rx="3" fill="#2a3590" stroke="#7ee3ff" strokeWidth="1.2" />
        <text x="280" y="199" fontSize="7.5" fill="#d6f6ff" fontFamily="var(--font-jetbrains), monospace">écrire(x)</text>
        <rect x="389" y="188" width="54" height="16" rx="3" fill="#2a3590" stroke="#7ee3ff" strokeWidth="1.2" />
        <text x="416" y="199" fontSize="7.5" fill="#d6f6ff" fontFamily="var(--font-jetbrains), monospace">x ← -x</text>
        <path d="M280 204v12h136v-12M348 216v7" fill="none" stroke="#8f9bff" strokeWidth="1.6" />
        <rect x="326" y="224" width="44" height="16" rx="8" fill={url("violet")} />
        <text x="348" y="235" fontSize="8.5" fill="#fff">Fin</text>
      </g>
      <path d="M196 262h308l-16 16H212z" fill={url("coque")} />
      <rect x="196" y="256" width="308" height="8" rx="4" fill="#e6e6f4" />
      <rect x="324" y="257" width="52" height="4" rx="2" fill="#bfc1dd" />

      {/* livres empilés, tranches lisibles */}
      <g fontFamily="var(--font-manrope), sans-serif" fontWeight="800">
        <rect x="58" y="320" width="196" height="30" rx="5" fill={url("bleu")} />
        <rect x="246" y="322" width="6" height="26" rx="2" fill="#fff" opacity=".85" />
        <text x="72" y="340" fontSize="11.5" fill="#fff">Résolution de problèmes</text>
        <rect x="70" y="290" width="176" height="30" rx="5" fill={url("violet")} />
        <rect x="238" y="292" width="6" height="26" rx="2" fill="#fff" opacity=".85" />
        <text x="84" y="310" fontSize="12" fill="#fff">Logique</text>
        <rect x="64" y="260" width="164" height="30" rx="5" fill={url("marine")} />
        <rect x="220" y="262" width="6" height="26" rx="2" fill="#fff" opacity=".85" />
        <text x="78" y="280" fontSize="12" fill="#fff">Algorithme</text>
      </g>
      {/* tasse sur les livres */}
      <path d="M150 230h34l-4 30h-26z" fill="#fffdf8" stroke="#e2dccd" />
      <path d="M184 238c10 0 10 14 0 14" fill="none" stroke="#e2dccd" strokeWidth="3" />
      <path d="M160 222c-3-6 3-8 0-14M172 222c-3-6 3-8 0-14" stroke={VIOLET} strokeOpacity=".35" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* plante en pot, devant à droite */}
      <path d="M548 314c-8-30-34-44-44-74 22 6 40 30 46 58M552 314c2-34 18-62 40-76-4 30-18 56-36 74M550 314c-16-22-16-50-6-72 10 20 12 48 6 72" fill={url("feuille")} />
      <path d="M526 312h50l-7 40h-36z" fill="#fffdf8" stroke="#e2dccd" />
      <rect x="526" y="312" width="50" height="8" rx="3" fill="#ece3d3" />
      {/* petite plante derrière l'ordinateur */}
      <path d="M190 120c-4-16-20-22-26-36 14 2 24 14 28 30M194 120c0-18 10-30 22-36-2 16-10 28-20 36" fill={url("feuille")} opacity=".9" />
      <path d="M178 118h30l-4 22h-22z" fill="#ffffff" stroke="#e2dccd" />
    </svg>
  );
}

/** Une scène par chapitre : jamais la même image pour deux chapitres. */
export function VisuelChapitre({ numero, className = "" }: { numero: number; className?: string }) {
  const g = useDegrades();
  const url = (n: string) => `url(#${g(n)})`;
  const defs = (
    <defs>
      <linearGradient id={g("bleu")} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6577ff" />
        <stop offset="1" stopColor={BLEU} />
      </linearGradient>
      <linearGradient id={g("violet")} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#a08cff" />
        <stop offset="1" stopColor={VIOLET} />
      </linearGradient>
      <radialGradient id={g("lueur")} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff3b8" />
        <stop offset="1" stopColor="#fff3b8" stopOpacity="0" />
      </radialGradient>
    </defs>
  );

  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden>
      {defs}
      <ellipse cx="100" cy="108" rx="70" ry="7" fill={VIOLET} opacity=".1" />
      {numero === 1 && (
        <g>
          {/* l'idée qui devient étapes */}
          <circle cx="62" cy="52" r="34" fill={url("lueur")} />
          <path d="M62 24c-15 0-25 11-25 24 0 9 5 15 10 20 3 3 4 6 4 10h22c0-4 1-7 4-10 5-5 10-11 10-20 0-13-10-24-25-24z" fill="#ffd65c" />
          <path d="M51 82h22v6a4 4 0 0 1-4 4h-14a4 4 0 0 1-4-4z" fill="#8e94b8" />
          <path d="M56 70V58l6 6 6-6v12" fill="none" stroke="#c98a00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M98 50h12" stroke={VIOLET} strokeWidth="2" strokeDasharray="3 3" />
          {[0, 1, 2].map((n) => (
            <g key={n} className="flotte" style={{ animationDelay: `${n * 0.5}s` }}>
              <rect x="114" y={22 + n * 26} width="62" height="18" rx="6" fill={n === 1 ? url("bleu") : "#fff"} stroke={n === 1 ? "none" : "#ddd6f7"} />
              <text x="124" y={34.5 + n * 26} fontSize="9" fontWeight="700" fill={n === 1 ? "#fff" : MARINE} fontFamily="var(--font-manrope), sans-serif">
                {["1. Lire", "2. Calculer", "3. Écrire"][n]}
              </text>
            </g>
          ))}
        </g>
      )}
      {numero === 2 && (
        <g fontFamily="var(--font-jetbrains), monospace" textAnchor="middle">
          {/* trois cases mémoire nommées */}
          {[
            { x: 22, nom: "age", val: "12", c: url("bleu") },
            { x: 80, nom: "note", val: "15,5", c: url("violet") },
            { x: 138, nom: "nom", val: '"Léa"', c: "#141c4d" },
          ].map((v, n) => (
            <g key={v.nom} className="flotte" style={{ animationDelay: `${n * 0.4}s` }}>
              <rect x={v.x} y="36" width="44" height="50" rx="9" fill="#fff" stroke="#ddd6f7" />
              <path d={`M${v.x} 46a9 9 0 0 1 9-10h26a9 9 0 0 1 9 10z`} fill={v.c} />
              <text x={v.x + 22} y="44" fontSize="8" fontWeight="700" fill="#fff">
                {v.nom}
              </text>
              <text x={v.x + 22} y="70" fontSize="11" fontWeight="700" fill={MARINE}>
                {v.val}
              </text>
            </g>
          ))}
          <text x="100" y="24" fontSize="10" fontWeight="700" fill={VIOLET}>
            age ← 12
          </text>
        </g>
      )}
      {numero === 3 && (
        <g fontFamily="var(--font-manrope), sans-serif" fontWeight="700" textAnchor="middle">
          {/* une décision et une boucle */}
          <path d="M70 20l26 22-26 22-26-22z" fill={url("bleu")} />
          <text x="70" y="46" fontSize="13" fill="#fff">?</text>
          <path d="M44 42H26v30M96 42h18v30" fill="none" stroke="#9aa3d8" strokeWidth="2" />
          <path d="M22 68l4 6 4-6M110 68l4 6 4-6" fill="none" stroke="#9aa3d8" strokeWidth="2" />
          <rect x="8" y="78" width="38" height="16" rx="5" fill="#fff" stroke="#ddd6f7" />
          <text x="27" y="89.5" fontSize="8" fill={MARINE}>oui</text>
          <rect x="95" y="78" width="38" height="16" rx="5" fill="#fff" stroke="#ddd6f7" />
          <text x="114" y="89.5" fontSize="8" fill={MARINE}>non</text>
          <g className="tourne-lent">
            <path d="M176 56a20 20 0 1 1-8-16" fill="none" stroke={url("violet")} strokeWidth="6" strokeLinecap="round" />
            <path d="M162 32l8 8-10 4" fill="none" stroke={VIOLET} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <text x="158" y="60" fontSize="9" fill={VIOLET}>×n</text>
        </g>
      )}
      {numero === 4 && (
        <g fontFamily="var(--font-jetbrains), monospace" textAnchor="middle">
          {/* un tableau indexé et une fonction */}
          {[4, 8, 15, 16, 23].map((v, n) => (
            <g key={n}>
              <rect x={14 + n * 28} y="30" width="26" height="26" rx="5" fill={n === 2 ? url("bleu") : "#fff"} stroke="#ddd6f7" />
              <text x={27 + n * 28} y="47" fontSize="10" fontWeight="700" fill={n === 2 ? "#fff" : MARINE}>
                {v}
              </text>
              <text x={27 + n * 28} y="68" fontSize="7.5" fill="#9aa0bf">
                {n + 1}
              </text>
            </g>
          ))}
          <g className="flotte">
            <rect x="140" y="70" width="52" height="28" rx="9" fill={url("violet")} />
            <text x="166" y="88" fontSize="11" fontWeight="700" fill="#fff">
              f(x)
            </text>
          </g>
          <path d="M83 58c4 22 30 28 54 26" fill="none" stroke={VIOLET} strokeWidth="1.8" strokeDasharray="3 3" />
        </g>
      )}
    </svg>
  );
}

/** La montagne du cours : un sentier à quatre étapes vers le drapeau ; `atteintes` étapes sont allumées. */
export function MontagneObjectif({ atteintes, className = "" }: { atteintes: number; className?: string }) {
  const g = useDegrades();
  const url = (n: string) => `url(#${g(n)})`;
  const etapes = [
    [70, 132],
    [128, 112],
    [112, 84],
    [150, 62],
  ];
  return (
    <svg viewBox="0 0 280 150" className={className} aria-hidden>
      <defs>
        <linearGradient id={g("ciel")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ece8ff" />
          <stop offset="1" stopColor="#faf7f0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={g("mont")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a75ff" />
          <stop offset="1" stopColor={VIOLET} />
        </linearGradient>
        <linearGradient id={g("mont2")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6d7dff" />
          <stop offset="1" stopColor={BLEU} />
        </linearGradient>
      </defs>
      <rect width="280" height="150" fill={url("ciel")} className="dark:opacity-15" />
      <circle cx="226" cy="34" r="12" fill="#ffd65c" opacity=".8" />
      <path d="M40 32c6-6 16-6 20 0 6-2 12 2 10 8H34c-4-4 0-10 6-8z" fill="#fff" />
      <path d="M180 58l58 92H118z" fill={url("mont2")} opacity=".75" />
      <path d="M150 34l82 116H40z" fill={url("mont")} />
      <path d="M150 34l18 26-8-4-10 8-8-8-10 6z" fill="#fff" />
      {/* sentier */}
      <path d="M40 148C70 136 76 132 70 132s46-8 58-20-28-20-16-28 38-14 38-22" fill="none" stroke="#fff" strokeWidth="2.2" strokeDasharray="4 5" strokeLinecap="round" />
      {etapes.map(([x, y], n) => (
        <circle key={n} cx={x} cy={y} r="5" fill={n < atteintes ? "#ffd65c" : "#fff"} stroke={n < atteintes ? "#c98a00" : "#c9c0f5"} strokeWidth="1.6" />
      ))}
      {/* drapeau */}
      <path d="M150 34V8" stroke={MARINE} strokeWidth="2" strokeLinecap="round" />
      <path d="M151 9h22l-6 6 6 6h-22z" fill={atteintes >= 4 ? "#ffd65c" : BLEU} />
    </svg>
  );
}
