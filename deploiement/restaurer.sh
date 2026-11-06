#!/bin/sh
# Remplace TOUTE la base par une sauvegarde. Usage : ./deploiement/restaurer.sh deploiement/sauvegardes/algodex-XXXX.dump
set -e
cd "$(dirname "$0")/.."
if [ ! -f "$1" ]; then
  echo "Usage : $0 deploiement/sauvegardes/algodex-XXXX.dump" >&2
  exit 1
fi
nom=$(basename "$1")
printf "Remplacer toute la base par %s ? Écris OUI : " "$nom"
read -r reponse
[ "$reponse" = "OUI" ] || { echo "Annulé."; exit 1; }
docker compose stop moteur site
docker compose exec -T sauvegarde sh -c "pg_restore --clean --if-exists --no-owner --dbname=\"\$PGDATABASE\" \"/sauvegardes/$nom\""
docker compose start moteur site
echo "Base restaurée depuis $nom."
