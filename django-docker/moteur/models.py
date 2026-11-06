"""Les quatre tables de la V1 (dossier v1.0, section 10, tableaux 4 à 7).

Miroir de ALGO_DEX_schema_v1.sql : noms de tables, champs, valeurs contrôlées
(CHECK), unicités, CASCADE/RESTRICT et les trois index de service.
"""

import secrets
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


# Code de reprise : 8 caractères sans ambiguïté à la lecture (ni 0/O, ni 1/I/L), écrits XXXX-XXXX.
ALPHABET_CODE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def nouveau_code_reprise():
    tirage = "".join(secrets.choice(ALPHABET_CODE) for _ in range(8))
    return f"{tirage[:4]}-{tirage[4:]}"


class Profil(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pseudo = models.CharField(max_length=40, unique=True)
    # Avec le pseudo, il permet de retrouver le profil sur un autre appareil.
    code_reprise = models.CharField(max_length=9, default=nouveau_code_reprise)
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


class ChapitreLu(models.Model):
    """Un chapitre du cours d'algorithmique que l'élève a marqué comme terminé (le contenu du cours vit côté site)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profil = models.ForeignKey(
        Profil, on_delete=models.CASCADE, related_name="chapitres_lus", db_column="profil_id"
    )
    chapitre = models.CharField(max_length=60)
    date_lecture = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chapitre_lu"
        ordering = ["date_lecture"]
        constraints = [
            models.UniqueConstraint(fields=["profil", "chapitre"], name="chapitre_lu_unique"),
            models.CheckConstraint(condition=Q(chapitre__regex=r"^[a-z0-9-]{1,60}$"), name="chapitre_lu_slug"),
        ]

    def __str__(self):
        return f"{self.profil} · {self.chapitre}"


# --------------------------------------------------------------------------
# Banque d'exercices : le catalogue pédagogique complet, au-delà de la V1
# --------------------------------------------------------------------------

NIVEAUX = ["debutant", "intermediaire", "avance"]
# Notions de la banque : les quatre de la V1, puis celles des documents sources (V1.1 et au-delà).
NOTIONS_BANQUE = NOTIONS + [
    "chaines", "fonctions", "recursivite", "tableaux_2d", "complexite", "enregistrements",
    "fichiers", "pointeurs", "listes_chainees", "piles_files", "arbres", "graphes", "hachage", "objets",
]


class ExerciceBanque(models.Model):
    """Une fiche d'exercice tirée des documents pédagogiques.

    Elle existe pour tout exercice retenu, même hors de ce que le moteur sait exécuter.
    Quand l'exercice est jouable dans le laboratoire, `exercice` pointe vers sa version exécutable
    (blocs, points de contrôle, indices validés par le moteur)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cle = models.SlugField(max_length=60, unique=True, help_text="Identifiant stable de la source (ex. bouchiha-3-21).")
    titre = models.CharField(max_length=120)
    description = models.CharField(max_length=240)
    enonce = models.TextField()
    consignes = models.TextField(blank=True, default="")
    niveau = models.CharField(max_length=14, choices=_choix(NIVEAUX))
    difficulte = models.PositiveSmallIntegerField()
    notion = models.CharField(max_length=20, choices=_choix(NOTIONS_BANQUE))
    notions_secondaires = models.JSONField(default=list, blank=True)
    objectifs = models.JSONField(default=list)
    prerequis = models.JSONField(default=list, blank=True)
    exemples = models.JSONField(default=list, blank=True, help_text="[{\"entree\": …, \"sortie\": …}]")
    indices = models.JSONField(default=list, blank=True)
    solution = models.TextField(blank=True, default="", help_text="Pseudo-code de la correction.")
    solution_verifiee = models.BooleanField(default=False, help_text="Vrai si la correction a été exécutée par le moteur.")
    complexite = models.JSONField(default=dict, blank=True, help_text="{\"temps\": \"O(n)\", \"espace\": \"O(1)\"}")
    source = models.JSONField(help_text="{document, auteur, chapitre, numero, nature : reprise | reformulation | variante}")
    tags = models.JSONField(default=list, blank=True)
    remarques = models.TextField(blank=True, default="", help_text="Ambiguïtés de la source et choix retenus.")
    exercice = models.OneToOneField(
        Exercice, null=True, blank=True, on_delete=models.SET_NULL, related_name="fiche", db_column="exercice_id"
    )
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_maj = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exercice_banque"
        ordering = ["notion", "niveau", "difficulte", "titre"]
        constraints = [
            models.CheckConstraint(condition=Q(niveau__in=NIVEAUX), name="banque_niveau_valide"),
            models.CheckConstraint(condition=Q(difficulte__gte=1, difficulte__lte=5), name="banque_difficulte_1_5"),
            models.CheckConstraint(condition=Q(notion__in=NOTIONS_BANQUE), name="banque_notion_valide"),
        ]
        indexes = [models.Index(fields=["notion", "niveau", "difficulte"], name="idx_banque_filtres")]

    def __str__(self):
        return f"[{self.notion}/{self.niveau}/{self.difficulte}] {self.titre}"
