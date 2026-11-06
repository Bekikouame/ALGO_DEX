from django.contrib import admin

from .models import CarteMaitrise, Exercice, ExerciceBanque, Profil, Tentative


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


@admin.register(ExerciceBanque)
class ExerciceBanqueAdmin(admin.ModelAdmin):
    list_display = ["titre", "notion", "niveau", "difficulte", "jouable", "solution_verifiee", "actif"]
    list_filter = ["notion", "niveau", "difficulte", "solution_verifiee", "actif"]
    search_fields = ["titre", "enonce", "cle"]
    readonly_fields = ["date_creation", "date_maj"]

    @admin.display(boolean=True, description="Jouable")
    def jouable(self, obj):
        return obj.exercice_id is not None
