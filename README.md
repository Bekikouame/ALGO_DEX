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
uv run python manage.py charger_demo           # test de niveau et exercices principaux
uv run python manage.py charger_bibliotheque   # bibliothèque d'exercices du cours
uv run python manage.py runserver

# Site (terminal 2) : http://localhost:3000
cd frontend
npm install
npm run dev
```

Les deux commandes `charger_*` peuvent être relancées sans créer de doublons.

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

Sur un serveur avec Docker et un nom de domaine pointant vers lui :

```bash
./deploiement/generer-env.sh mon-domaine.fr   # crée .env avec des secrets aléatoires
docker compose up -d --build
docker compose exec moteur python manage.py createsuperuser
```

- `compose.yaml` lance quatre services : **Caddy** (seul exposé, HTTPS automatique), le **site** Next, le **moteur** Django (gunicorn) et **PostgreSQL** (données dans un volume Docker).
- Au démarrage, le moteur applique les migrations et charge les exercices.
- L'adresse du back-office est aléatoire et donnée par `generer-env.sh` (variable `DJANGO_CHEMIN_ADMIN`).
- Sauvegarde de la base : `docker compose exec base pg_dump -U algodex algodex > sauvegarde.sql`

## Sécurité

- Jamais de `.env` ni de `db.sqlite3` dans Git. Modèles : `.env.example`, `django-docker/.env.example`, `frontend/.env.example`.
- Hors développement (`DJANGO_DEBUG=0`), le moteur refuse de démarrer sans une vraie `DJANGO_SECRET_KEY`.
- Les élèves n'ont pas de mot de passe : un pseudo suffit. Pour changer d'appareil, ils utilisent leur **code de reprise** (affiché dans « Mon espace »), essais limités à 10 par heure et par adresse IP.
- Limites par adresse IP sur l'API, en-têtes de sécurité sur le site et le moteur, documentation de l'API réservée aux administrateurs en production.
- Le moteur ne doit jamais être exposé directement sur Internet : seul Caddy l'est.
