#!/bin/sh
# Un export de la base, écrit d'abord dans un fichier temporaire : jamais de sauvegarde à moitié écrite.
set -e
fichier="/sauvegardes/algodex-$(date +%Y-%m-%d-%H%M%S).dump"
pg_dump --format=custom --file="$fichier.tmp"
mv "$fichier.tmp" "$fichier"
find /sauvegardes -name 'algodex-*.dump' -mtime +14 -delete
echo "Sauvegarde : $fichier"
