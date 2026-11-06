#!/bin/sh
# Démarrage du moteur : migrations, contenu si la base est vide, puis gunicorn.
# Journal d'accès sans paramètres d'URL : l'identifiant d'un profil n'y figure jamais.
set -e
python manage.py migrate --noinput
python manage.py initialiser_contenu
exec gunicorn myapp.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers "${GUNICORN_WORKERS:-3}" \
  --timeout 30 \
  --max-requests 1000 \
  --max-requests-jitter 100 \
  --access-logfile - \
  --access-logformat '%(h)s %(t)s "%(m)s %(U)s" %(s)s %(b)s %(D)s'
