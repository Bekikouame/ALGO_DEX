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


