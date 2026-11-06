"""Protections communes à toutes les requêtes : taille du corps et essais de connexion au back-office."""

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse, JsonResponse


class LimiteCorpsRequete:
    """Refuse un corps annoncé trop gros : DRF lit le JSON sans passer par DATA_UPLOAD_MAX_MEMORY_SIZE."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            taille = int(request.META.get("CONTENT_LENGTH") or 0)
        except ValueError:
            taille = 0
        if taille > settings.DATA_UPLOAD_MAX_MEMORY_SIZE:
            return JsonResponse({"detail": "Requête trop volumineuse.", "code": "requete_trop_grosse"}, status=413)
        return self.get_response(request)


def _adresse(request):
    """L'adresse du client : la dernière ajoutée par le relais (Caddy), celles d'avant sont déclaratives."""
    relayees = request.META.get("HTTP_X_FORWARDED_FOR", "")
    return relayees.split(",")[-1].strip() or request.META.get("REMOTE_ADDR", "")


class LimiteConnexionAdmin:
    """Après trop de mots de passe faux depuis une adresse, la connexion au back-office attend."""

    def __init__(self, get_response):
        self.get_response = get_response
        self.chemin = f"/{settings.CHEMIN_ADMIN}login/"

    def __call__(self, request):
        if request.method != "POST" or request.path != self.chemin:
            return self.get_response(request)
        cle = f"admin-echecs:{_adresse(request)}"
        if cache.get(cle, 0) >= settings.ADMIN_MAX_ECHECS:
            minutes = settings.ADMIN_BLOCAGE_SECONDES // 60
            return HttpResponse(
                f"Trop d'essais de connexion. Réessaie dans {minutes} minutes.",
                status=429,
                content_type="text/plain; charset=utf-8",
                headers={"Retry-After": str(settings.ADMIN_BLOCAGE_SECONDES)},
            )
        reponse = self.get_response(request)
        if reponse.status_code == 302:  # connexion réussie
            cache.delete(cle)
        elif reponse.status_code == 200:  # formulaire réaffiché : mot de passe refusé
            cache.set(cle, cache.get(cle, 0) + 1, settings.ADMIN_BLOCAGE_SECONDES)
        return reponse
