"""Les quatre tables de la V1 (dossier v1.0, section 10, tableaux 4 à 7).

Miroir de ALGO_DEX_schema_v1.sql : noms de tables, champs, valeurs contrôlées
(CHECK), unicités, CASCADE/RESTRICT et les trois index de service.
"""

import uuid

from django.db import models
from django.db.models import Q

NOTIONS = ["variables", "conditions", "boucles", "tableaux"]
ETATS = ["demontree", "validee", "en_cours", "a_faire"]
TYPES_EXERCICE = ["coeur", "express"]
ETAPES = ["ecrit", "predite", "visualisee", "comparee", "corrigee", "reussie"]

# États « au vert » : deux façons d'y être, aucune hiérarchie entre elles.
ETATS_VERTS = {"demontree", "validee"}


def _choix(valeurs):
    return [(v, v) for v in valeurs]


class Profil(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pseudo = models.CharField(max_length=40, unique=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    derniere_visite = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "profil"
        constraints = [
            models.CheckConstraint(
                condition=Q(pseudo__regex=r"^.{2,40}$"), name="profil_pseudo_longueur"
            ),
        ]

    def __str__(self):
        return self.pseudo


class CarteMaitrise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profil = models.ForeignKey(
        Profil, on_delete=models.CASCADE, related_name="cartes", db_column="profil_id"
    )
    notion = models.CharField(max_length=20, choices=_choix(NOTIONS))
    etat = models.CharField(max_length=12, choices=_choix(ETATS), default="a_faire")
    date_maj = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "carte_maitrise"
        constraints = [
            models.UniqueConstraint(fields=["profil", "notion"], name="carte_profil_notion_unique"),
            models.CheckConstraint(condition=Q(notion__in=NOTIONS), name="carte_notion_valide"),
            models.CheckConstraint(condition=Q(etat__in=ETATS), name="carte_etat_valide"),
        ]
        indexes = [models.Index(fields=["profil"], name="idx_carte_profil")]

    def __str__(self):
        return f"{self.profil} · {self.notion} · {self.etat}"


class Exercice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notion = models.CharField(max_length=20, choices=_choix(NOTIONS))
    type = models.CharField(max_length=10, choices=_choix(TYPES_EXERCICE))
    titre = models.CharField(max_length=120)
    enonce = models.TextField()
    algorithme = models.TextField(blank=True, default="")
    blocs = models.JSONField(default=list)
    points_controle = models.JSONField(default=list)
    indices = models.JSONField(default=list)
    sorties_langages = models.JSONField(default=dict)
    entrees = models.JSONField(default=dict)
    ordre = models.IntegerField(default=1)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "exercice"
        ordering = ["notion", "type", "ordre"]
        constraints = [
            models.CheckConstraint(condition=Q(notion__in=NOTIONS), name="exercice_notion_valide"),
            models.CheckConstraint(
                condition=Q(type__in=TYPES_EXERCICE), name="exercice_type_valide"
            ),
        ]
        indexes = [
            models.Index(fields=["notion", "type", "actif"], name="idx_exercice_notion_type"),
        ]

    def __str__(self):
        return f"[{self.notion}/{self.type}] {self.titre}"


class Tentative(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profil = models.ForeignKey(
        Profil, on_delete=models.CASCADE, related_name="tentatives", db_column="profil_id"
    )
    exercice = models.ForeignKey(
        Exercice, on_delete=models.RESTRICT, related_name="tentatives", db_column="exercice_id"
    )
    type = models.CharField(max_length=10, choices=_choix(TYPES_EXERCICE))
    prediction = models.JSONField(null=True, blank=True)
    etape_atteinte = models.CharField(max_length=12, choices=_choix(ETAPES), default="ecrit")
    comparaison_vue = models.BooleanField(default=False)
    sortie_correcte = models.BooleanField(default=False)
    terminee = models.BooleanField(default=False)
    date_debut = models.DateTimeField(auto_now_add=True)
    date_maj = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tentative"
        ordering = ["date_debut"]
        constraints = [
            models.CheckConstraint(
                condition=Q(type__in=TYPES_EXERCICE), name="tentative_type_valide"
            ),
            models.CheckConstraint(
                condition=Q(etape_atteinte__in=ETAPES), name="tentative_etape_valide"
            ),
        ]
        indexes = [
            models.Index(fields=["profil", "exercice"], name="idx_tentative_profil_exo"),
        ]

    def __str__(self):
        return f"{self.profil} · {self.exercice.titre} · {self.etape_atteinte}"
