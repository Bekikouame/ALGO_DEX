// Format d'un pseudo : mêmes règles que le moteur (regles.verifier_pseudo), qui reste seul juge.
// Lettres (accents compris), chiffres, _ et un seul @, sans espace, avec au moins une lettre, 2 à 40 caractères.

/** Caractères de contrôle retirés, espaces du début et de la fin enlevés. */
export const nettoyerPseudo = (pseudo: string) => pseudo.replace(/\p{Cc}/gu, "").trim();

/** Le message d'erreur du pseudo, ou null s'il est valable. */
export function verifierPseudo(pseudo: string): string | null {
  if (pseudo.length < 2 || pseudo.length > 40) return "Le pseudo doit faire entre 2 et 40 caractères.";
  if (/\s/u.test(pseudo)) return "Pas d'espace dans le pseudo : colle les mots ou relie-les avec _ (ex. becca_12).";
  const interdits = [...new Set(pseudo.replace(/[\p{L}\p{N}_@]/gu, ""))].sort();
  if (interdits.length) return `Caractère non autorisé : ${interdits.join(" ")}. Utilise seulement des lettres, des chiffres, _ et @.`;
  if ((pseudo.match(/@/g) ?? []).length > 1) return "Un seul @ par pseudo.";
  if (!/\p{L}/u.test(pseudo)) return "Le pseudo doit contenir au moins une lettre.";
  return null;
}
