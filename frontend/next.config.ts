import type { NextConfig } from "next";

// Le moteur Django (API REST). Le navigateur ne l'appelle jamais directement :
// /api/* est relayé par Next, ce qui évite toute configuration CORS.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

// En-têtes de sécurité sur toutes les pages : pas d'affichage dans une iframe d'un autre site,
// pas de devinette de type de fichier, pas de fuite de l'adresse complète vers les autres sites.
const ENTETES_SECURITE = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  // Serveur autonome pour l'image Docker (.next/standalone) ; sans effet sur « next dev ».
  output: "standalone",
  async headers() {
    return [{ source: "/:path*", headers: ENTETES_SECURITE }];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
