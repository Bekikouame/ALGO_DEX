from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter(trailing_slash=False)
router.register("exercices", views.ExerciceViewSet)

urlpatterns = [
    path("profil", views.ProfilView.as_view()),
    path("cockpit", views.CockpitView.as_view()),
    path("bibliotheque", views.BibliothequeView.as_view()),
    path("executer", views.ExecuterView.as_view()),
    path("tentative", views.TentativeView.as_view()),
    path("tentative/<uuid:pk>", views.TentativeDetailView.as_view()),
    path("calibrage", views.CalibrageView.as_view()),
    *router.urls,
]
