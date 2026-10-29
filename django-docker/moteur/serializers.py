from rest_framework import serializers

from . import regles
from .interpreteur import BlocInvalide
from .models import Exercice, Profil


class ProfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profil
        fields = ["id", "pseudo", "date_creation", "derniere_visite"]


class ProfilCreationSerializer(serializers.Serializer):
    pseudo = serializers.CharField(help_text="2 à 40 caractères après nettoyage. Seul identifiant de la V1.")


class ProfilRefSerializer(serializers.Serializer):
    profil_id = serializers.UUIDField()


class TentativeOuvertureSerializer(serializers.Serializer):
    profil_id = serializers.UUIDField()
    exercice_id = serializers.UUIDField()


class TentativeActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        choices=["predire", "comparer", "indice", "soumettre"],
        help_text="predire → comparer → soumettre ; indice à tout moment. "
                  "La visualisation passe par POST /api/executer.",
    )
    prediction = serializers.JSONField(
        required=False, help_text="predire : {\"points\": {id: valeur}, \"sortie\": [lignes]}"
    )
    blocs = serializers.JSONField(
        required=False, help_text="Cœur uniquement : les blocs de l'élève (predire, comparer, soumettre)."
    )
    marche = serializers.IntegerField(required=False, min_value=1, help_text="indice : numéro de marche (1 à 4).")

    def validate(self, attrs):
        if attrs["action"] == "predire" and "prediction" not in attrs:
            raise serializers.ValidationError({"prediction": "Obligatoire pour l'action predire."})
        if attrs["action"] == "indice" and "marche" not in attrs:
            raise serializers.ValidationError({"marche": "Obligatoire pour l'action indice."})
        return attrs


class ExecuterSerializer(serializers.Serializer):
    tentative_id = serializers.UUIDField()
    blocs = serializers.JSONField(
        required=False, help_text="Cœur : les blocs de l'élève. Express : ignoré, l'algorithme fourni est exécuté."
    )


class TesterSerializer(serializers.Serializer):
    blocs = serializers.JSONField()
    entrees = serializers.JSONField(required=False, default=dict)
    points_controle = serializers.JSONField(required=False, default=list)


class ExerciceSerializer(serializers.ModelSerializer):
    ordre = serializers.IntegerField(min_value=1, required=False)

    class Meta:
        model = Exercice
        fields = [
            "id", "notion", "type", "titre", "enonce", "algorithme", "blocs", "points_controle",
            "indices", "sorties_langages", "entrees", "ordre", "actif", "date_creation",
        ]
        read_only_fields = ["id", "date_creation"]

    def validate(self, attrs):
        donnees = {}
        if self.instance is not None:
            donnees = {f: getattr(self.instance, f) for f in self.Meta.fields}
        donnees.update(attrs)
        try:
            regles.valider_exercice(donnees)
        except BlocInvalide as e:
            champ = e.chemin.split("[")[0].split(".")[0] or "blocs"
            raise serializers.ValidationError({champ: f"{e.message} ({e.chemin})" if e.chemin else e.message})
        return attrs
