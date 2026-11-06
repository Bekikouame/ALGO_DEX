#!/bin/sh
# Démarrage du moteur : migrations, contenu si la base est vide, puis gunicorn.
set -e
python manage.py migrate --noinput
python manage.py initialiser_contenu
exec gunicorn myapp.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers "${GUNICORN_WORKERS:-3}" \
  --timeout 30 \
  --access-logfile -
