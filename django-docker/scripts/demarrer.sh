#!/bin/sh
# Démarrage du moteur : migrations, exercices (idempotents), puis gunicorn.
set -e
python manage.py migrate --noinput
python manage.py charger_demo
python manage.py charger_bibliotheque
exec gunicorn myapp.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers "${GUNICORN_WORKERS:-3}" \
  --timeout 30 \
  --access-logfile -
