"""L'API REST du moteur (dossier v1.0, section 13, tableau 9).

Les vues ne portent aucune règle : elles lisent la requête, appellent `regles`
et renvoient ce que le moteur a calculé.
"""

import uuid

from django.db.models import RestrictedError
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView, exception_handler

from . import interpreteur, regles
from .interpreteur import BlocInvalide
from .models import Exercice, Profil, Tentative
from .regles import ErreurRegle
from .serializers import (
    ExecuterSerializer,
    ExerciceSerializer,
    ProfilCreationSerializer,
    ProfilRefSerializer,
    ProfilSerializer,
    TentativeActionSerializer,
    TentativeOuvertureSerializer,
    TesterSerializer,
)


def gestionnaire_erreurs(exc, context):
    if isinstance(exc, ErreurRegle):
        return Response({"detail": exc.message, "code": exc.code}, status=exc.statut)
    if isinstance(exc, BlocInvalide):
        return Response(
            {"detail": exc.message, "chemin": exc.chemin, "code": "bloc_invalide"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return exception_handler(exc, context)


class VueApprenant(APIView):
    """Le cockpit appelle ces routes sans compte : le pseudo suffit (ARCH-1)."""

    authentication_classes = []
    permission_classes = [AllowAny]


def _valider(serializer_class, data):
    serializer = serializer_class(data=data)
    serializer.is_valid(raise_exception=True)
    return serializer.validated_data


# --------------------------------------------------------------------------
# /api/profil
# --------------------------------------------------------------------------


class ProfilView(VueApprenant):
    @extend_schema(
        tags=["profil"],
        summary="Profils de l'appareil",
        description="Le navigateur garde les identifiants de ses profils et les envoie ici, séparés par des virgules.",
        parameters=[OpenApiParameter("ids", str, description="UUID des profils, séparés par des virgules")],
        responses=ProfilSerializer(many=True),
    )
    def get(self, request):
        ids = []
        for brut in filter(None, (s.strip() for s in request.query_params.get("ids", "").split(","))):
            try:
                ids.append(uuid.UUID(brut))
            except ValueError:
                return Response({"detail": f"Identifiant invalide : {brut}"}, status=400)
        profils = Profil.objects.filter(id__in=ids).order_by("-derniere_visite")
        return Response(ProfilSerializer(profils, many=True).data)

    @extend_schema(
        tags=["profil"],
        summary="Créer un profil par pseudo",
        description="Crée le profil et initialise sa carte à « a_faire » sur les quatre notions.",
        request=ProfilCreationSerializer,
        responses={201: ProfilSerializer},
        examples=[OpenApiExample("Alex", value={"pseudo": "Alex"}, request_only=True)],
    )
    def post(self, request):
        donnees = _valider(ProfilCreationSerializer, request.data)
        profil = regles.creer_profil(donnees["pseudo"])
        return Response(ProfilSerializer(profil).data, status=201)


# --------------------------------------------------------------------------
# /api/cockpit
# --------------------------------------------------------------------------


class CockpitView(VueApprenant):
    @extend_schema(
        tags=["cockpit"],
        summary="État complet d'un profil",
        description="Carte, notions débloquées, plan de cascade recalculé, cœurs disponibles, récompenses. "
                    "Le serveur recompose tout à chaque appel.",
        parameters=[OpenApiParameter("profil_id", OpenApiTypes.UUID, required=True)],
        responses=OpenApiTypes.OBJECT,
    )
    def get(self, request):
        donnees = _valider(ProfilRefSerializer, request.query_params)
        profil = get_object_or_404(Profil, pk=donnees["profil_id"])
        return Response(regles.cockpit(profil))


# --------------------------------------------------------------------------
# /api/executer
# --------------------------------------------------------------------------

EXEMPLE_BLOCS = [
    {"type": "affectation", "variable": "s", "valeur": "0"},
    {"type": "pour", "variable": "i", "debut": "1", "fin": "n", "corps": [
        {"type": "affectation", "variable": "s", "valeur": "s + i"},
    ]},
    {"type": "ecrire", "valeurs": ["s"]},
]


class ExecuterView(VueApprenant):
    @extend_schema(
        tags=["executer"],
        summary="Exécuter pas à pas",
        description="Trace pas à pas (ligne, variables, affichage), console, valeurs réelles aux points de contrôle. "
                    "Exige une prédiction engagée. La sortie de référence n'est jamais renvoyée.",
        request=ExecuterSerializer,
        responses=OpenApiTypes.OBJECT,
        examples=[
            OpenApiExample("Cœur", value={"tentative_id": "00000000-0000-0000-0000-000000000000",
                                          "blocs": EXEMPLE_BLOCS}, request_only=True),
            OpenApiExample("Express", value={"tentative_id": "00000000-0000-0000-0000-000000000000"},
                           request_only=True),
        ],
    )
    def post(self, request):
        donnees = _valider(ExecuterSerializer, request.data)
        tentative = get_object_or_404(Tentative.objects.select_related("exercice"), pk=donnees["tentative_id"])
        resultat = regles.executer(tentative, donnees.get("blocs"))
        return Response({**resultat, "tentative": regles.tentative_vue(tentative)})


# --------------------------------------------------------------------------
# /api/tentative
# --------------------------------------------------------------------------


class TentativeView(VueApprenant):
    @extend_schema(
        tags=["tentative"],
        summary="Ouvrir ou reprendre une tentative",
        description="Express : seulement le prochain de la cascade. Cœur : seulement si la notion est débloquée "
                    "(démarrer un cœur passe la notion de « a_faire » à « en_cours »).",
        request=TentativeOuvertureSerializer,
        responses={200: OpenApiTypes.OBJECT, 201: OpenApiTypes.OBJECT},
    )
    def post(self, request):
        donnees = _valider(TentativeOuvertureSerializer, request.data)
        profil = get_object_or_404(Profil, pk=donnees["profil_id"])
        exercice = get_object_or_404(Exercice, pk=donnees["exercice_id"])
        tentative, cree = regles.ouvrir_tentative(profil, exercice)
        reponse = regles.progression(tentative)
        reponse["exercice"] = regles.exercice_public(exercice)
        return Response(reponse, status=201 if cree else 200)


class TentativeDetailView(VueApprenant):
    @extend_schema(
        tags=["tentative"],
        summary="Lire une tentative",
        responses=OpenApiTypes.OBJECT,
    )
    def get(self, request, pk):
        tentative = get_object_or_404(Tentative.objects.select_related("exercice", "profil"), pk=pk)
        reponse = regles.progression(tentative)
        reponse["exercice"] = regles.exercice_public(tentative.exercice)
        return Response(reponse)

    @extend_schema(
        tags=["tentative"],
        summary="Faire progresser le cycle",
        description="predire → (POST /api/executer) → comparer → corriger (POST /api/executer) → soumettre. "
                    "La soumission revalide tout le cycle CDC-2 côté serveur.",
        request=TentativeActionSerializer,
        responses=OpenApiTypes.OBJECT,
        examples=[
            OpenApiExample("Prédire (express)", request_only=True, value={
                "action": "predire",
                "prediction": {"points": {"p1": 3, "p2": 6}, "sortie": ["6"]},
            }),
            OpenApiExample("Prédire (cœur)", request_only=True, value={
                "action": "predire",
                "prediction": {"points": {"p1": 1, "p2": 10}, "sortie": ["10"]},
                "blocs": EXEMPLE_BLOCS,
            }),
            OpenApiExample("Comparer (cœur)", request_only=True, value={"action": "comparer", "blocs": EXEMPLE_BLOCS}),
            OpenApiExample("Comparer (express)", request_only=True, value={"action": "comparer"}),
            OpenApiExample("Indice", request_only=True, value={"action": "indice", "marche": 1}),
            OpenApiExample("Soumettre (cœur)", request_only=True, value={"action": "soumettre", "blocs": EXEMPLE_BLOCS}),
            OpenApiExample("Soumettre (express)", request_only=True, value={"action": "soumettre"}),
        ],
    )
    def patch(self, request, pk):
        donnees = _valider(TentativeActionSerializer, request.data)
        tentative = get_object_or_404(Tentative.objects.select_related("exercice", "profil"), pk=pk)
        action_ = donnees["action"]
        blocs = donnees.get("blocs")
        if action_ == "predire":
            resultat = regles.predire(tentative, donnees["prediction"], blocs)
        elif action_ == "comparer":
            resultat = regles.comparer(tentative, blocs)
        elif action_ == "indice":
            resultat = regles.indice(tentative, donnees["marche"])
        else:
            resultat = regles.soumettre(tentative, blocs)
        return Response(regles.progression(tentative, resultat))


# --------------------------------------------------------------------------
# /api/calibrage
# --------------------------------------------------------------------------


class CalibrageView(VueApprenant):
    @extend_schema(
        tags=["calibrage"],
        summary="Appliquer la cascade sur la carte",
        description="Recalculé depuis les tentatives réelles : 2/2 = démontrée, arrêt au premier échec. "
                    "Idempotent ; ne régresse jamais un état au vert.",
        request=ProfilRefSerializer,
        responses=OpenApiTypes.OBJECT,
    )
    def post(self, request):
        donnees = _valider(ProfilRefSerializer, request.data)
        profil = get_object_or_404(Profil, pk=donnees["profil_id"])
        plan, changements = regles.appliquer_calibrage(profil)
        etats = regles.etats_carte(profil)
        return Response({
            "calibrage": plan,
            "changements": changements,
            "carte": regles.carte(profil),
            "notions_debloquees": regles.notions_debloquees(etats),
            "prochaine_notion": regles.prochaine_notion(etats),
        })


# --------------------------------------------------------------------------
# /api/exercices — back-office (administrateurs uniquement)
# --------------------------------------------------------------------------


@extend_schema_view(
    list=extend_schema(summary="Lister tous les exercices (actifs et inactifs)"),
    create=extend_schema(summary="Créer un exercice (validation de forme + exécution de la référence)"),
    retrieve=extend_schema(summary="Lire un exercice complet"),
    update=extend_schema(summary="Remplacer un exercice"),
    partial_update=extend_schema(summary="Modifier un exercice (ex. bascule actif)"),
    destroy=extend_schema(summary="Supprimer — refusé s'il a des tentatives (RESTRICT)"),
)
@extend_schema(tags=["exercices (back-office)"])
class ExerciceViewSet(viewsets.ModelViewSet):
    queryset = Exercice.objects.all()
    serializer_class = ExerciceSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        for champ in ("notion", "type"):
            if valeur := self.request.query_params.get(champ):
                qs = qs.filter(**{champ: valeur})
        return qs

    def perform_destroy(self, instance):
        try:
            regles.supprimer_exercice(instance)
        except RestrictedError:
            raise ErreurRegle("Cet exercice a des tentatives : désactive-le au lieu de le supprimer.",
                              409, "suppression_interdite")

    @extend_schema(
        summary="Tester une exécution sans sauvegarder",
        request=TesterSerializer,
        responses=OpenApiTypes.OBJECT,
        examples=[OpenApiExample("Somme 1..n", request_only=True, value={
            "blocs": EXEMPLE_BLOCS,
            "entrees": {"n": 4},
            "points_controle": [
                {"id": "p1", "question": "s après le 1er tour ?", "variable": "s",
                 "moment": {"type": "iteration", "numero": 1}},
                {"id": "p2", "question": "s à la fin ?", "variable": "s", "moment": {"type": "fin"}},
            ],
        })],
    )
    @action(detail=False, methods=["post"])
    def tester(self, request):
        donnees = _valider(TesterSerializer, request.data)
        if donnees["points_controle"]:
            interpreteur.valider_points_controle(donnees["points_controle"])
        return Response(interpreteur.executer(donnees["blocs"], donnees["entrees"], donnees["points_controle"]))
