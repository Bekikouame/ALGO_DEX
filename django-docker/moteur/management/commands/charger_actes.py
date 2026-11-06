"""Charge les 12 exercices actés du cahier des charges : 8 express (test de niveau) et 4 cœurs (un par notion).

Contenu : moteur/banque/actes.json, repris de la première version du projet.
Une question express existante est mise à jour sur place, par (notion, ordre) : les tentatives déjà faites
restent rattachées et le test d'un élève ne repart pas de zéro. Le cœur acté prend l'ordre 1 de sa notion :
un autre cœur qui l'occupait devient de l'entraînement, avec ses tentatives.
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from moteur import banque
from moteur.models import Exercice
from moteur.serializers import ExerciceSerializer

FICHIER = Path(banque.__file__).parent / "actes.json"
ORDRE_ENTRAINEMENT = 50


class Command(BaseCommand):
    help = "Charge les 12 exercices actés (idempotent)."

    def handle(self, *args, **options):
        exercices = json.loads(FICHIER.read_text())
        # « La mention » est le titre acté : l'exercice de bibliothèque du même nom le lui laisse.
        Exercice.objects.filter(type="coeur", titre="La mention").update(titre="La mention détaillée")
        for e in exercices:
            donnees = {k: v for k, v in e.items() if k != "cle"}
            if e["type"] == "express":
                instance = Exercice.objects.filter(type="express", notion=e["notion"], ordre=e["ordre"]).first()
            else:
                instance = Exercice.objects.filter(type="coeur", titre=e["titre"]).first()
                Exercice.objects.filter(type="coeur", notion=e["notion"], ordre=e["ordre"]).exclude(
                    titre=e["titre"]
                ).update(ordre=ORDRE_ENTRAINEMENT)
            serializer = ExerciceSerializer(instance, data=donnees)
            if not serializer.is_valid():
                raise CommandError(f"{e['titre']} : {serializer.errors}")
            serializer.save()
            self.stdout.write(f"{'mis à jour' if instance else 'créé'} : [{e['notion']}/{e['type']}] {e['titre']}")
        self.stdout.write(self.style.SUCCESS(f"Exercices actés : {len(exercices)} prêts."))
