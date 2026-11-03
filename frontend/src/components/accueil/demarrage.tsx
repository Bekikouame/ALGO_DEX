"use client";

import { ArrowRight, KeyRound, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { MessageErreur } from "@/components/coque";
import { Avatar } from "@/components/marque";
import { api, type Profil } from "@/lib/api";
import { idsAppareil, memoriserProfil, oublierProfil } from "@/lib/profils";
import { nettoyerPseudo, verifierPseudo } from "@/lib/pseudo";

export type VueDemarrage = "nouveau" | "reprendre";

/** Le panneau « Prêt à commencer ? » de l'en-tête : un pseudo crée le profil et lance le test de niveau, ou l'on reprend un profil de cet appareil. */
export function Demarrage({
  vue,
  onVue,
  onFermer,
}: {
  vue: VueDemarrage;
  onVue: (v: VueDemarrage) => void;
  onFermer: () => void;
}) {
  const router = useRouter();
  const [profils, setProfils] = useState<Profil[] | null>(null);
  const [pseudo, setPseudo] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  // Le format est vérifié pendant la saisie ; le serveur refait la même vérification.
  const propre = nettoyerPseudo(pseudo);
  const probleme = propre ? verifierPseudo(propre) : null;
  // Une seule lettre tapée : on attend la suite avant de parler de longueur.
  const avertissement = probleme && !(propre.length < 2 && probleme.includes("entre 2 et 40")) ? probleme : null;

  useEffect(() => {
    const ids = idsAppareil();
    (ids.length ? api.profils(ids) : Promise.resolve([]))
      .then(setProfils)
      .catch((e) => {
        setProfils([]);
        setErreur(e.message);
      });
  }, []);

  async function creer(e: FormEvent) {
    e.preventDefault();
    const message = verifierPseudo(propre);
    if (message) {
      setErreur(message);
      return;
    }
    setErreur(null);
    setEnvoi(true);
    try {
      const profil = await api.creerProfil(propre);
      memoriserProfil(profil.id);
      // La page d'accueil reste en mémoire (Cache Components) : on la laisse propre pour le prochain retour.
      setPseudo("");
      setEnvoi(false);
      onFermer();
      router.push("/calibrage");
    } catch (err) {
      setErreur((err as Error).message);
      setEnvoi(false);
    }
  }

  // Reprise sur un autre appareil : pseudo + code de reprise.
  const [repPseudo, setRepPseudo] = useState("");
  const [repCode, setRepCode] = useState("");
  const [repErreur, setRepErreur] = useState<string | null>(null);
  const [repEnvoi, setRepEnvoi] = useState(false);

  async function reprendreParCode(e: FormEvent) {
    e.preventDefault();
    if (!nettoyerPseudo(repPseudo) || repCode.replace(/[^A-Za-z0-9]/g, "").length !== 8) {
      setRepErreur("Indique ton pseudo et ton code de reprise (8 caractères, ex. K7QF-M2XP).");
      return;
    }
    setRepErreur(null);
    setRepEnvoi(true);
    try {
      const profil = await api.reprendreProfil(nettoyerPseudo(repPseudo), repCode);
      setRepEnvoi(false);
      choisir(profil);
    } catch (err) {
      setRepErreur((err as Error).message);
      setRepEnvoi(false);
    }
  }

  function choisir(p: Profil) {
    memoriserProfil(p.id);
    onFermer();
    router.push("/parcours");
  }

  return (
    <div
      id="commencer"
      className="relative rounded-3xl border border-primary/55 bg-surface p-6 shadow-[0_24px_70px_-20px_var(--primary)] sm:p-7"
    >
      <button
        type="button"
        onClick={onFermer}
        aria-label="Fermer"
        className="absolute right-4 top-4 rounded-lg p-1.5 text-muted transition-colors hover:text-text"
      >
        <X size={18} />
      </button>

      {vue === "nouveau" ? (
        <form onSubmit={creer} noValidate>
          <h2 id="titre-nouveau" tabIndex={-1} className="pr-8 font-display text-3xl leading-tight outline-none">
            Prêt à commencer&nbsp;?
          </h2>
          <p className="mt-2 text-sm text-muted">Choisis ton pseudo pour rejoindre l&apos;aventure ALGO_DEX.</p>
          <label htmlFor="pseudo" className="sr-only">
            Ton pseudo
          </label>
          <div className="relative mt-6">
            <UserRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id="pseudo"
              value={pseudo}
              onChange={(e) => {
                setPseudo(e.target.value);
                setErreur(null);
              }}
              maxLength={60}
              placeholder="Ex. becca_12"
              autoComplete="off"
              aria-describedby="pseudo-aide"
              aria-invalid={!!(erreur || avertissement) || undefined}
              className={`w-full rounded-xl border bg-bg/70 py-3.5 pl-11 pr-4 outline-none transition-colors ${
                avertissement ? "border-danger focus:border-danger" : "border-border focus:border-primary"
              }`}
            />
          </div>
          <p id="pseudo-aide" className={`mt-2 text-xs ${avertissement && !erreur ? "text-danger" : "text-muted"}`} aria-live="polite">
            {avertissement && !erreur ? avertissement : "2 à 40 caractères : lettres, chiffres, _ et @, sans espace."}
          </p>
          {erreur && (
            <div className="mt-3">
              <MessageErreur message={erreur} />
            </div>
          )}
          <button
            type="submit"
            disabled={envoi}
            className="bouton-lumineux mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-semibold text-white transition-opacity disabled:opacity-60"
          >
            {envoi ? "Création du profil…" : "Commencer"} <ArrowRight size={18} />
          </button>
          <p className="mt-5 text-center text-sm text-muted">
            Déjà un profil&nbsp;?{" "}
            <button type="button" onClick={() => onVue("reprendre")} className="font-semibold text-text underline underline-offset-4 hover:text-primary">
              Le reprendre
            </button>
          </p>
        </form>
      ) : (
        <div>
          <h2 id="titre-reprendre" tabIndex={-1} className="pr-8 font-display text-3xl leading-tight outline-none">
            Reprendre mon profil
          </h2>
          <p className="mt-2 text-sm text-muted">Les profils créés sur cet appareil.</p>
          {profils === null ? (
            <p className="mt-6 text-sm text-muted">Chargement…</p>
          ) : profils.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-border p-4 text-sm text-muted">
              Aucun profil n&apos;est enregistré sur cet appareil.
            </p>
          ) : (
            <ul className="mt-6 flex flex-col gap-2">
              {profils.map((p) => (
                <li key={p.id} className="group flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => choisir(p)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-border bg-bg/70 p-3 text-left transition-colors hover:border-primary"
                  >
                    <Avatar pseudo={p.pseudo} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{p.pseudo}</span>
                      <span className="block text-xs text-muted">
                        Dernière visite le {new Date(p.derniere_visite).toLocaleDateString("fr-FR")}
                      </span>
                    </span>
                    <ArrowRight size={18} className="text-muted group-hover:text-primary" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      oublierProfil(p.id);
                      setProfils((l) => l?.filter((x) => x.id !== p.id) ?? null);
                    }}
                    className="rounded-lg p-2 text-muted hover:text-danger"
                    title="Retirer de cet appareil (le profil reste en base)"
                    aria-label={`Retirer ${p.pseudo} de cet appareil`}
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {erreur && (
            <div className="mt-3">
              <MessageErreur message={erreur} />
            </div>
          )}
          <form onSubmit={reprendreParCode} noValidate className="mt-6 border-t border-border pt-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound size={16} className="text-primary" aria-hidden /> Sur un autre appareil&nbsp;?
            </p>
            <p className="mt-1 text-xs text-muted">Ton pseudo et ton code de reprise, affiché dans Mon espace.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem]">
              <label className="sr-only" htmlFor="reprise-pseudo">
                Pseudo
              </label>
              <input
                id="reprise-pseudo"
                value={repPseudo}
                onChange={(e) => {
                  setRepPseudo(e.target.value);
                  setRepErreur(null);
                }}
                placeholder="Pseudo"
                autoComplete="off"
                maxLength={60}
                className="min-w-0 rounded-xl border border-border bg-bg/70 px-3.5 py-2.5 text-sm outline-none focus:border-primary"
              />
              <label className="sr-only" htmlFor="reprise-code">
                Code de reprise
              </label>
              <input
                id="reprise-code"
                value={repCode}
                onChange={(e) => {
                  setRepCode(e.target.value.toUpperCase());
                  setRepErreur(null);
                }}
                placeholder="XXXX-XXXX"
                autoComplete="off"
                spellCheck={false}
                maxLength={12}
                className="min-w-0 rounded-xl border border-border bg-bg/70 px-3.5 py-2.5 font-mono text-sm tracking-wider outline-none focus:border-primary"
              />
            </div>
            {repErreur && (
              <div className="mt-3">
                <MessageErreur message={repErreur} />
              </div>
            )}
            <button
              type="submit"
              disabled={repEnvoi}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/60 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
            >
              {repEnvoi ? "Recherche…" : "Retrouver mon profil"} <ArrowRight size={16} />
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-muted">
            Nouveau ici&nbsp;?{" "}
            <button type="button" onClick={() => onVue("nouveau")} className="font-semibold text-text underline underline-offset-4 hover:text-primary">
              Choisir un pseudo
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
