// Client de l'API du moteur. Le cockpit n'affiche que ce que le serveur renvoie :
// aucun état (carte, verdict, plan de cascade) n'est calculé ici.

export type Notion = "variables" | "conditions" | "boucles" | "tableaux";
export type Etat = "demontree" | "validee" | "en_cours" | "a_faire";
export type Etape = "ecrit" | "predite" | "visualisee" | "comparee" | "corrigee" | "reussie";
export type Valeur = number | string | boolean | Valeur[] | null;

export const NOTIONS: Notion[] = ["variables", "conditions", "boucles", "tableaux"];
export const LIBELLES_NOTION: Record<Notion, string> = {
  variables: "Variables",
  conditions: "Conditions",
  boucles: "Boucles",
  tableaux: "Tableaux",
};

export interface Profil {
  id: string;
  pseudo: string;
  date_creation: string;
  derniere_visite: string;
}

export interface LigneCarte {
  notion: Notion;
  etat: Etat;
  date_maj: string | null;
}

export interface PlanCascade {
  statut: "a_commencer" | "en_cours" | "terminee";
  prochain_exercice_id: string | null;
  arret: Notion | null;
  notions: {
    notion: Notion;
    statut: "non_testee" | "en_cours" | "echec" | "demontree";
    express: { id: string; titre: string; resultat: "juste" | "faux" | null }[];
  }[];
}

export interface Cockpit {
  profil: { id: string; pseudo: string; derniere_visite: string };
  carte: LigneCarte[];
  notions_debloquees: Notion[];
  prochaine_notion: Notion | null;
  calibrage: PlanCascade;
  exercices: {
    id: string;
    notion: Notion;
    titre: string;
    accessible: boolean;
    tentative_en_cours: string | null;
    reussi: boolean;
  }[];
  recompenses: { notion: Notion; titre: string; langages: Partial<Record<Langage, string>> }[];
}

export type Langage = "python" | "javascript" | "java" | "c";

export interface Moment {
  type: "fin" | "iteration" | "affectation";
  numero?: number;
  boucle?: number;
}

export interface PointControle {
  id: string;
  question: string;
  variable: string;
  moment: Moment;
}

export interface LignePseudo {
  ligne: number;
  texte: string;
}

export interface ExercicePublic {
  id: string;
  notion: Notion;
  type: "coeur" | "express";
  titre: string;
  enonce: string;
  entrees: Record<string, Valeur>;
  points_controle: PointControle[];
  nb_indices: number;
  algorithme?: string;
  lignes?: LignePseudo[];
}

export interface Prediction {
  points: Record<string, Valeur | string>;
  sortie: string[];
}

export interface Tentative {
  id: string;
  profil_id: string;
  exercice_id: string;
  type: "coeur" | "express";
  prediction: Prediction | null;
  etape_atteinte: Etape;
  comparaison_vue: boolean;
  sortie_correcte: boolean;
  terminee: boolean;
}

export interface Progression<R = unknown> {
  tentative: Tentative;
  carte: LigneCarte[];
  notions_debloquees: Notion[];
  calibrage?: PlanCascade;
  resultat?: R;
  exercice?: ExercicePublic;
}

export interface PasTrace {
  pas: number;
  ligne: number;
  description: string;
  variables: Record<string, Valeur>;
  ecrit: string | null;
}

export interface Execution {
  lignes: LignePseudo[];
  trace: PasTrace[];
  console: string[];
  variables_finales: Record<string, Valeur>;
  points: Record<string, { atteint: boolean; valeur: Valeur }>;
  erreur: { message: string; ligne: number | null } | null;
  tentative: Tentative;
}

export interface Comparaison {
  points: {
    id: string;
    question: string;
    variable: string;
    predit: Valeur;
    reel: Valeur;
    atteint: boolean;
    juste: boolean;
  }[];
  console: { numero: number; predite: string | null; reelle: string | null; juste: boolean }[];
  sortie_juste: boolean;
  tout_juste: boolean;
  erreur: { message: string; ligne: number | null } | null;
}

export interface Indice {
  marche: number;
  indice: { texte: string; blocs?: unknown[] };
  derniere: boolean;
  suivante: number | "deroulement_guide";
}

export type Soumission =
  | { prediction_juste: boolean }
  | { valide: false; message: string; console: string[] }
  | {
      valide: true;
      recompense: { notion: Notion; python: string | null };
      nouvelles_notions: Notion[];
    };

export class ErreurApi extends Error {
  constructor(
    message: string,
    public statut: number,
    public code?: string,
  ) {
    super(message);
  }
}

async function appel<T>(chemin: string, options: RequestInit = {}): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(`/api/${chemin}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      cache: "no-store",
    });
  } catch {
    throw new ErreurApi("Le moteur ne répond pas. Vérifie que le serveur Django est lancé.", 0);
  }
  const corps = await reponse.json().catch(() => null);
  if (!reponse.ok) {
    const detail =
      corps?.detail ??
      (corps && typeof corps === "object" ? Object.values(corps).flat().join(" ") : null) ??
      `Erreur ${reponse.status}`;
    throw new ErreurApi(String(detail), reponse.status, corps?.code);
  }
  return corps as T;
}

const json = (corps: unknown) => JSON.stringify(corps);

export const api = {
  profils: (ids: string[]) => appel<Profil[]>(`profil?ids=${ids.join(",")}`),
  creerProfil: (pseudo: string) => appel<Profil>("profil", { method: "POST", body: json({ pseudo }) }),
  cockpit: (profilId: string) => appel<Cockpit>(`cockpit?profil_id=${profilId}`),
  ouvrirTentative: (profilId: string, exerciceId: string) =>
    appel<Progression>("tentative", {
      method: "POST",
      body: json({ profil_id: profilId, exercice_id: exerciceId }),
    }),
  tentative: (id: string) => appel<Progression>(`tentative/${id}`),
  predire: (id: string, prediction: Prediction, blocs?: unknown[]) =>
    appel<Progression>(`tentative/${id}`, {
      method: "PATCH",
      body: json({ action: "predire", prediction, blocs }),
    }),
  executer: (tentativeId: string, blocs?: unknown[]) =>
    appel<Execution>("executer", { method: "POST", body: json({ tentative_id: tentativeId, blocs }) }),
  comparer: (id: string, blocs?: unknown[]) =>
    appel<Progression<Comparaison>>(`tentative/${id}`, {
      method: "PATCH",
      body: json({ action: "comparer", blocs }),
    }),
  indice: (id: string, marche: number) =>
    appel<Progression<Indice>>(`tentative/${id}`, {
      method: "PATCH",
      body: json({ action: "indice", marche }),
    }),
  soumettre: (id: string, blocs?: unknown[]) =>
    appel<Progression<Soumission>>(`tentative/${id}`, {
      method: "PATCH",
      body: json({ action: "soumettre", blocs }),
    }),
  appliquerCalibrage: (profilId: string) =>
    appel<{
      calibrage: PlanCascade;
      changements: { notion: Notion; avant: Etat; apres: Etat }[];
      carte: LigneCarte[];
      notions_debloquees: Notion[];
      prochaine_notion: Notion | null;
    }>("calibrage", { method: "POST", body: json({ profil_id: profilId }) }),
};
