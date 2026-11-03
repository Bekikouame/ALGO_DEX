"""
URL configuration for myapp project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
"""

from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path(settings.CHEMIN_ADMIN, admin.site.urls),
    # Sans barre finale : le site Next la retire avant de relayer /api/*, Django ne doit pas la rajouter.
    path("api/", include("moteur.urls")),
    path("api/schema", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger"),
    path("api/redoc", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
