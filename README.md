# ALGO_DEX

Application d'aide à l'apprentissage de l'algorithmique, pour tous les niveaux : on écrit un algorithme en blocs, on prédit son résultat, on l'exécute pas à pas, on compare.

| Partie | Dossier | Technologie |
|---|---|---|
| Moteur (API, règles, exécution des algorithmes) | `django-docker/` | Django 6, Django REST Framework |
| Site (accueil, espace élève, cours, laboratoire) | `frontend/` | Next.js 16, React 19, Tailwind 4 |
| Base de données | — | SQLite en développement, PostgreSQL en production |

Le navigateur ne parle qu'au site : Next relaie `/api/*` vers le moteur.

## Lancer en développement

Prérequis : Python 3.13 avec [uv](https://docs.astral.sh/uv/), Node.js 24.

```bash
# Moteur (terminal 1) : http://127.0.0.1:8000
cd django-docker
uv sync
uv run python manage.py migrate
uv run python manage.py charger_actes          # les 12 exercices actés : test de niveau et parcours
uv run python manage.py charger_demo           # 4 exercices d'entraînement
uv run python manage.py charger_bibliotheque   # bibliothèque d'exercices du cours
uv run python manage.py importer_banque        # banque complète (fiches et exercices jouables)
uv run python manage.py runserver

# Site (terminal 2) : http://localhost:3000
cd frontend
npm install
npm run dev
```

Ces commandes peuvent être relancées sans créer de doublons.

## Base de données et back-office

- En développement, toute la base est le fichier `django-docker/db.sqlite3` (jamais envoyé sur GitHub).
- Back-office : http://127.0.0.1:8000/admin/ (profils, cartes de maîtrise, exercices, tentatives, chapitres lus).
- Créer un compte administrateur : `uv run python manage.py createsuperuser`
- Changer son mot de passe : `uv run python manage.py changepassword <nom>`
- Documentation de l'API (développement seulement) : http://127.0.0.1:8000/api/docs

## Tests

```bash
cd django-docker && uv run python manage.py test moteur
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

## Mettre en production

Sur un serveur avec Docker, et deux noms DNS pointant vers lui (`mon-domaine.fr` et `admin.mon-domaine.fr`) :

```bash
./deploiement/generer-env.sh mon-domaine.fr   # crée .env avec des secrets aléatoires
docker compose up -d --build
docker compose exec moteur python manage.py createsuperuser
```

- `compose.yaml` lance cinq services : **Caddy** (seul exposé, HTTPS automatique), le **site** Next, le **moteur** Django (gunicorn), **PostgreSQL** (données dans un volume Docker) et la **sauvegarde**.
- Le back-office n'existe que sur `admin.mon-domaine.fr`, à l'adresse secrète donnée par `generer-env.sh`. Il est introuvable depuis l'adresse des apprenants.
- Au démarrage, le moteur applique les migrations. Il charge les exercices seulement si la base est vide : un redémarrage n'écrase jamais ce qui a été modifié dans le back-office.
- Pour recharger le contenu à la main (les modifications du back-office sur ces exercices seront écrasées) : `docker compose exec moteur python manage.py importer_banque`.

### Sauvegarder et restaurer

- Un export de la base est écrit chaque jour dans `deploiement/sauvegardes/` et gardé 14 jours. Copie ce dossier hors du serveur : une sauvegarde sur la même machine ne protège pas d'une panne de disque.
- Sauvegarde immédiate : `docker compose exec sauvegarde sh /sauvegarder.sh`
- Restaurer (remplace toute la base, demande confirmation) : `./deploiement/restaurer.sh deploiement/sauvegardes/algodex-XXXX.dump`

## Exercices

- **Parcours et test de niveau** : les 12 exercices actés (`moteur/banque/actes.json`). Les 4 cœurs valident la carte de maîtrise, les 8 express forment le test de niveau.
- **Bibliothèque** : les autres cœurs sont de l'entraînement, sans effet sur la carte.
- **Banque** (`moteur/banque/`, table `exercice_banque`) : toutes les fiches, jouables ou non. Lecture avec filtres : `GET /api/banque?niveau=&notion=&difficulte=&tag=&q=&jouable=`.
- Schéma de référence : `django-docker/schema/ALGO_DEX_schema_v1.1.sql`.

## Sécurité

- Jamais de `.env` ni de `db.sqlite3` dans Git. Modèles : `.env.example`, `django-docker/.env.example`, `frontend/.env.example`.
- Hors développement (`DJANGO_DEBUG=0`), le moteur refuse de démarrer sans une vraie `DJANGO_SECRET_KEY`.
- Les élèves n'ont pas de mot de passe : un pseudo suffit. Pour changer d'appareil, ils utilisent leur **code de reprise** (affiché dans « Mon espace »), essais limités à 10 par heure et par adresse IP.
- Limites par adresse IP sur l'API, en-têtes de sécurité sur le site et le moteur, documentation de l'API réservée aux administrateurs en production.
- Le moteur ne doit jamais être exposé directement sur Internet : seul Caddy l'est.
