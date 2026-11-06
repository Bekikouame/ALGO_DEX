"""Charge le contenu pédagogique au tout premier démarrage d'une base vide.

Sur une base qui a déjà des exercices, ne fait rien : les corrections faites dans le back-office
ne sont jamais écrasées par un redémarrage. Pour mettre à jour le contenu, lancer à la main
charger_demo, charger_bibliotheque ou importer_banque.
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand

from moteur.models import Exercice


class Command(BaseCommand):
    help = "Charge les exercices seulement si la base n'en contient aucun."

    def handle(self, *args, **options):
        if Exercice.objects.exists():
            self.stdout.write("Contenu déjà présent : rien à charger.")
            return
        for commande in ("charger_actes", "charger_demo", "charger_bibliotheque", "importer_banque"):
            call_command(commande, stdout=self.stdout)
