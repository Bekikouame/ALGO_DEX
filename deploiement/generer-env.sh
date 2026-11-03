#!/bin/sh
# Crée le fichier .env de production avec des secrets aléatoires.
# Usage : ./deploiement/generer-env.sh mon-domaine.fr
set -e
cd "$(dirname "$0")/.."
if [ -z "$1" ]; then
  echo "Usage : $0 mon-domaine.fr" >&2
  exit 1
fi
if [ -e .env ]; then
  echo ".env existe déjà : supprime-le d'abord si tu veux le régénérer (les anciens secrets seront perdus)." >&2
  exit 1
fi
aleatoire() { LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c "$1"; }
umask 077
cat > .env <<FIN
DOMAINE=$1
DJANGO_SECRET_KEY=$(aleatoire 64)
DJANGO_CHEMIN_ADMIN=gestion-$(aleatoire 8 | tr 'A-Z' 'a-z')/
POSTGRES_DB=algodex
POSTGRES_USER=algodex
POSTGRES_PASSWORD=$(aleatoire 32)
FIN
echo ".env créé (lisible par toi seul). Adresse du back-office : https://$1/$(grep DJANGO_CHEMIN_ADMIN .env | cut -d= -f2)"
