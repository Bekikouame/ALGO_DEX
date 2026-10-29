from django.contrib import admin

from .models import CarteMaitrise, Exercice, Profil, Tentative


class CarteInline(admin.TabularInline):
    model = CarteMaitrise
    extra = 0


@admin.register(Profil)
class ProfilAdmin(admin.ModelAdmin):
    list_display = ["pseudo", "date_creation", "derniere_visite"]
    search_fields = ["pseudo"]
    inlines = [CarteInline]


@admin.register(Exercice)
class ExerciceAdmin(admin.ModelAdmin):
    list_display = ["titre", "notion", "type", "ordre", "actif"]
    list_filter = ["notion", "type", "actif"]


@admin.register(Tentative)
class TentativeAdmin(admin.ModelAdmin):
    list_display = ["profil", "exercice", "etape_atteinte", "comparaison_vue", "sortie_correcte", "terminee"]
    list_filter = ["type", "etape_atteinte", "terminee"]
