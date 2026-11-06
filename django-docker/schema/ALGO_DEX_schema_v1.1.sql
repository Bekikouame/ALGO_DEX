-- ============================================================
-- ALGO_DEX V1 — Schéma de la base de données (référence du modèle)
-- Séance base de données — 26 octobre 2026
-- Décisions actées : BDD-1 (contenu riche en JSONB validé par Django)
--                   BDD-2 (table tentative : trace de chaque passage)
-- Version 1.1 — 6 novembre 2026 : code de reprise, chapitres lus, banque d'exercices (voir la fin du fichier).
-- NOTE : en pratique, ce DDL sera généré par les migrations Django ;
-- ce script fait foi sur la structure à obtenir.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- ------------------------------------------------------------
-- profil : un apprenant. Créé au premier lancement avec un pseudo
-- seul, sans email ni mot de passe (ARCH-1, friction zéro).
-- Les comptes réels (email, mot de passe) s'ajouteront en V2
-- au moment des matchs, sans modifier cette table.
-- ------------------------------------------------------------
CREATE TABLE profil (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    pseudo          VARCHAR(40)  NOT NULL UNIQUE
                    CHECK (char_length(btrim(pseudo)) BETWEEN 2 AND 40),
    code_reprise    VARCHAR(9)   NOT NULL,  -- avec le pseudo : retrouver le profil sur un autre appareil
    date_creation   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    derniere_visite TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- carte_maitrise : la carte du CDC-6. Quatre notions × quatre
-- états par profil ; une seule ligne par (profil, notion).
-- Les transitions d'état sont calculées par le moteur (Django),
-- jamais par le client.
-- ------------------------------------------------------------
CREATE TABLE carte_maitrise (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    profil_id UUID        NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
    notion    VARCHAR(20) NOT NULL
              CHECK (notion IN ('variables', 'conditions', 'boucles', 'tableaux')),
    etat      VARCHAR(12) NOT NULL DEFAULT 'a_faire'
              CHECK (etat IN ('demontree', 'validee', 'en_cours', 'a_faire')),
    date_maj  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT carte_unique UNIQUE (profil_id, notion)
);

-- ------------------------------------------------------------
-- exercice : le contenu pédagogique entier (4 cœurs + 8 express).
-- Le contenu riche vit en JSONB (BDD-1) ; Django valide la forme
-- avant tout enregistrement (un exercice sans points de contrôle
-- refuse de se sauvegarder). Saisi via le back-office Django (ARCH-4).
-- ------------------------------------------------------------
CREATE TABLE exercice (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    notion           VARCHAR(20) NOT NULL
                     CHECK (notion IN ('variables', 'conditions', 'boucles', 'tableaux')),
    type             VARCHAR(10) NOT NULL CHECK (type IN ('coeur', 'express')),
    titre            VARCHAR(120) NOT NULL,
    enonce           TEXT        NOT NULL,
    algorithme       TEXT        NOT NULL DEFAULT '',
    blocs            JSONB       NOT NULL DEFAULT '[]'::jsonb,
    points_controle  JSONB       NOT NULL DEFAULT '[]'::jsonb
                     CHECK (jsonb_array_length(points_controle) BETWEEN 2 AND 4),
    indices          JSONB       NOT NULL DEFAULT '[]'::jsonb,
    sorties_langages JSONB       NOT NULL DEFAULT '{}'::jsonb,
    entrees          JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- variables initiales (dossier v1.0, tableau 6)
    ordre            INTEGER     NOT NULL DEFAULT 0,
    actif            BOOLEAN     NOT NULL DEFAULT TRUE,
    date_creation    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- tentative : la trace de chaque passage (BDD-2). Rend le critère
-- CDC-2 vérifiable côté serveur : le ✅ exige le cycle complet et
-- la comparaison prédiction/réalité VUE (comparaison_vue = true).
-- La reprise en cours d'exercice et l'historique des matchs V2
-- s'appuient sur cette table.
-- ------------------------------------------------------------
CREATE TABLE tentative (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    profil_id       UUID        NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
    exercice_id     UUID        NOT NULL REFERENCES exercice(id) ON DELETE RESTRICT,
    type            VARCHAR(10) NOT NULL CHECK (type IN ('coeur', 'express')),
    prediction      JSONB,      -- valeurs prédites aux points de contrôle + sortie
    etape_atteinte  VARCHAR(12) NOT NULL DEFAULT 'ecrit'
                    CHECK (etape_atteinte IN
                    ('ecrit', 'predite', 'visualisee', 'comparee', 'corrigee', 'reussie')),
    comparaison_vue BOOLEAN     NOT NULL DEFAULT FALSE,
    sortie_correcte BOOLEAN     NOT NULL DEFAULT FALSE,
    terminee        BOOLEAN     NOT NULL DEFAULT FALSE,
    date_debut      TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_maj        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- chapitre_lu (v1.1) : les chapitres du cours marqués comme terminés.
-- ------------------------------------------------------------
CREATE TABLE chapitre_lu (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    profil_id    UUID        NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
    chapitre     VARCHAR(60) NOT NULL CHECK (chapitre ~ '^[a-z0-9-]{1,60}$'),
    date_lecture TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chapitre_lu_unique UNIQUE (profil_id, chapitre)
);

-- ------------------------------------------------------------
-- exercice_banque (v1.1) : le catalogue pédagogique complet, tiré des documents du porteur.
-- Séparé de exercice : une fiche peut porter sur une notion ou un exercice que le moteur V1
-- n'exécute pas. exercice_id pointe vers sa version jouable quand elle existe.
-- ------------------------------------------------------------
CREATE TABLE exercice_banque (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    cle                 VARCHAR(60)  NOT NULL UNIQUE,  -- identifiant stable de la source, clé de l'import
    titre               VARCHAR(120) NOT NULL,
    description         VARCHAR(240) NOT NULL,
    enonce              TEXT         NOT NULL,
    consignes           TEXT         NOT NULL DEFAULT '',
    niveau              VARCHAR(14)  NOT NULL CHECK (niveau IN ('debutant', 'intermediaire', 'avance')),
    difficulte          SMALLINT     NOT NULL CHECK (difficulte BETWEEN 1 AND 5),
    notion              VARCHAR(20)  NOT NULL CHECK (notion IN (
                            'variables', 'conditions', 'boucles', 'tableaux', 'chaines', 'fonctions', 'recursivite',
                            'tableaux_2d', 'complexite', 'enregistrements', 'fichiers', 'pointeurs', 'listes_chainees',
                            'piles_files', 'arbres', 'graphes', 'hachage', 'objets')),
    notions_secondaires JSONB        NOT NULL DEFAULT '[]'::jsonb,
    objectifs           JSONB        NOT NULL DEFAULT '[]'::jsonb,
    prerequis           JSONB        NOT NULL DEFAULT '[]'::jsonb,
    exemples            JSONB        NOT NULL DEFAULT '[]'::jsonb,
    indices             JSONB        NOT NULL DEFAULT '[]'::jsonb,
    solution            TEXT         NOT NULL DEFAULT '',  -- jamais renvoyée au client
    solution_verifiee   BOOLEAN      NOT NULL DEFAULT FALSE,  -- vrai si exécutée par le moteur
    complexite          JSONB        NOT NULL DEFAULT '{}'::jsonb,
    source              JSONB        NOT NULL,
    tags                JSONB        NOT NULL DEFAULT '[]'::jsonb,
    remarques           TEXT         NOT NULL DEFAULT '',
    exercice_id         UUID         UNIQUE REFERENCES exercice(id) ON DELETE SET NULL,
    actif               BOOLEAN      NOT NULL DEFAULT TRUE,
    date_creation       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    date_maj            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Index de service (le volume V1 est faible ; ces index suffisent)
-- ------------------------------------------------------------
CREATE INDEX idx_carte_profil             ON carte_maitrise(profil_id);
CREATE INDEX idx_exercice_recherche       ON exercice(notion, type, actif);
CREATE INDEX idx_tentative_profil_exo     ON tentative(profil_id, exercice_id);
CREATE INDEX idx_banque_filtres           ON exercice_banque(notion, niveau, difficulte);

-- Règles d'intégrité choisies :
--   profil supprimé       → ses cartes et tentatives suivent (CASCADE)
--   exercice supprimé     → interdit s'il a des tentatives (RESTRICT) :
--                           on le désactive (actif = false), on ne l'efface pas
--   suppression directe   → réservée au back-office, jamais au client
--
-- Écart assumé avec les migrations Django : les CASCADE, RESTRICT et SET NULL y sont appliqués par Django,
-- pas par des contraintes ON DELETE en base. Le comportement vu par l'application est le même.
