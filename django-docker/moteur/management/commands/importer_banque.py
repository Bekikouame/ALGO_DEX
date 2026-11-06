"""Importe la banque d'exercices (moteur/banque) dans la base. Réexécutable : mise à jour par clé.

- Exercices jouables : créés ou mis à jour comme cœurs du laboratoire (validation complète du moteur),
  puis reliés à leur fiche, avec la correction issue de la solution exécutée.
- Exercices existants (démonstration, bibliothèque) : fiche reliée par titre.
- Catalogue : fiches seules (hors de ce que le moteur V1 exécute).
Aucune donnée n'est supprimée ; une fiche absente des fichiers est laissée telle quelle.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from moteur import interpreteur, regles
from moteur.banque.catalogue_autres import CATALOGUE as AUTRES
from moteur.banque.catalogue_bouchiha import CATALOGUE as BOUCHIHA
from moteur.banque.catalogue_lecture import CATALOGUE as LECTURE
from moteur.banque.existants import EXISTANTS
from moteur.banque.jouables import JOUABLES
from moteur.models import Exercice, ExerciceBanque
from moteur.serializers import ExerciceSerializer

# Fiches d'exercices qui n'existent plus sous ce nom (question de démonstration remplacée, titre changé).
CLES_RETIREES = {
    "algodex-echanger-sans-perdre", "algodex-le-double-et-le-reste", "algodex-pair-ou-impair", "algodex-le-tarif-du-cinema",
    "algodex-additionner-pas-a-pas", "algodex-diviser-jusqu-a-1", "algodex-une-case-qui-change",
    "algodex-chercher-le-maximum",
}

# Les cœurs de la banque viennent après ceux du parcours et de la bibliothèque (le cockpit garde l'ordre 1).
ORDRE_DEPART = 100


def pseudo_code(blocs):
    return "\n".join(l["texte"] for l in interpreteur.Programme(blocs).lignes)


def textes(indices):
    return [i if isinstance(i, str) else i["texte"] for i in indices]


class Command(BaseCommand):
    help = "Importe la banque d'exercices tirée des documents pédagogiques (idempotent)."

    def handle(self, *args, **options):
        cles = [j["fiche"]["cle"] for j in JOUABLES] + [e["fiche"]["cle"] for e in EXISTANTS] + \
               [f["cle"] for f in BOUCHIHA + AUTRES + LECTURE]
        doublons = {c for c in cles if cles.count(c) > 1}
        if doublons:
            raise CommandError(f"Clés en double : {sorted(doublons)}")

        compte = {"créées": 0, "mises à jour": 0, "exercices jouables créés": 0}
        with transaction.atomic():
            ExerciceBanque.objects.filter(cle__in=CLES_RETIREES).delete()
            # Le titre de cette fiche a changé : on libère son exercice avant de relier la nouvelle.
            ExerciceBanque.objects.filter(cle="algodex-la-mention", exercice__type="coeur").delete()
            for n, j in enumerate(JOUABLES):
                exercice = self._exercice(j["exercice"], ORDRE_DEPART + n, compte)
                self._fiche(j["fiche"], exercice, compte)
            for e in EXISTANTS:
                exercice = Exercice.objects.filter(titre=e["titre_exercice"]).first()
                f = dict(e["fiche"])
                if exercice is None:
                    self.stdout.write(self.style.WARNING(f"exercice introuvable, fiche ignorée : {e['titre_exercice']}"))
                    continue
                f["enonce"] = exercice.enonce
                f["description"] = exercice.enonce.split(". ")[0].rstrip(".")[:239] + "."
                f["indices"] = textes(exercice.indices)
                self._fiche(f, exercice, compte)
            for f in BOUCHIHA + AUTRES + LECTURE:
                self._fiche(f, None, compte)
        self.stdout.write(self.style.SUCCESS(
            f"Banque : {compte['créées']} fiches créées, {compte['mises à jour']} mises à jour, "
            f"{compte['exercices jouables créés']} exercices jouables créés. "
            f"Total en base : {ExerciceBanque.objects.count()} fiches."
        ))

    def _exercice(self, donnees, ordre, compte):
        donnees = {"type": "coeur", "ordre": ordre, **donnees}
        instance = Exercice.objects.filter(titre=donnees["titre"]).first()
        serializer = ExerciceSerializer(instance, data=donnees)
        if not serializer.is_valid():
            raise CommandError(f"{donnees['titre']} : {serializer.errors}")
        if instance is None:
            compte["exercices jouables créés"] += 1
        return serializer.save()

    def _fiche(self, f, exercice, compte):
        try:
            regles.valider_fiche(f)
        except ValueError as e:
            raise CommandError(str(e))
        champs = {k: v for k, v in f.items() if k != "cle"}
        if exercice is not None:
            champs.update(exercice=exercice, solution=pseudo_code(exercice.blocs), solution_verifiee=True)
        else:
            champs.update(exercice=None, solution=f.get("solution", ""), solution_verifiee=False)
        _, cree = ExerciceBanque.objects.update_or_create(cle=f["cle"], defaults=champs)
        compte["créées" if cree else "mises à jour"] += 1
