"""Charge 4 exercices cœur d'entraînement (un par notion), écrits pour les premiers tests de l'API.

Les exercices du parcours et du test de niveau sont les exercices actés : voir charger_actes.
Chaque exercice passe par la même validation que le back-office.
"""

from django.core.management.base import BaseCommand, CommandError

from moteur.models import Exercice
from moteur.serializers import ExerciceSerializer


def aff(variable, valeur, index=None):
    bloc = {"type": "affectation", "variable": variable, "valeur": valeur}
    if index is not None:
        bloc["index"] = index
    return bloc


def ecrire(*valeurs):
    return {"type": "ecrire", "valeurs": list(valeurs)}


def si(condition, alors, sinon=None):
    return {"type": "si", "condition": condition, "alors": alors, "sinon": sinon or []}


def pour(variable, debut, fin, corps):
    return {"type": "pour", "variable": variable, "debut": debut, "fin": fin, "corps": corps}


def tant_que(condition, corps):
    return {"type": "tant_que", "condition": condition, "corps": corps}


def point(pid, question, variable, moment="fin", numero=None):
    m = {"type": moment}
    if numero is not None:
        m["numero"] = numero
    return {"id": pid, "question": question, "variable": variable, "moment": m}


EXERCICES = [
    # ---------------------------------------------------------------- variables
    {
        "notion": "variables", "type": "coeur", "ordre": 50,
        "titre": "La moyenne de deux notes",
        "enonce": "Les notes note1 et note2 sont fournies. Range leur somme dans une variable somme, "
                  "puis leur moyenne dans une variable moyenne, et affiche moyenne.",
        "entrees": {"note1": 12, "note2": 15},
        "blocs": [aff("somme", "note1 + note2"), aff("moyenne", "somme / 2"), ecrire("moyenne")],
        "points_controle": [
            point("p1", "Que vaut somme à la fin ?", "somme"),
            point("p2", "Que vaut moyenne à la fin ?", "moyenne"),
        ],
        "indices": [
            "Que faut-il connaître avant de pouvoir calculer une moyenne ?",
            "Deux étapes : d'abord la somme, ensuite la division.",
            {"texte": "Commence par ce bloc :", "blocs": [aff("somme", "note1 + note2")]},
        ],
        "sorties_langages": {
            "python": "note1 = 12\nnote2 = 15\nsomme = note1 + note2\nmoyenne = somme / 2\nprint(moyenne)",
            "javascript": "let note1 = 12;\nlet note2 = 15;\nlet somme = note1 + note2;\nlet moyenne = somme / 2;\nconsole.log(moyenne);",
            "java": "double note1 = 12, note2 = 15;\ndouble somme = note1 + note2;\ndouble moyenne = somme / 2;\nSystem.out.println(moyenne);",
            "c": "double note1 = 12, note2 = 15;\ndouble somme = note1 + note2;\ndouble moyenne = somme / 2;\nprintf(\"%g\\n\", moyenne);",
        },
    },
    # --------------------------------------------------------------- conditions
    {
        "notion": "conditions", "type": "coeur", "ordre": 50,
        "titre": "Le plus grand des deux",
        "enonce": "Les nombres a et b sont fournis. Range le plus grand dans une variable grand, le plus petit "
                  "dans une variable petit, puis affiche grand, puis petit (une ligne chacun).",
        "entrees": {"a": 8, "b": 13},
        "blocs": [si("a > b", [aff("grand", "a"), aff("petit", "b")], [aff("grand", "b"), aff("petit", "a")]),
                  ecrire("grand"), ecrire("petit")],
        "points_controle": [
            point("p1", "Que vaut grand à la fin ?", "grand"),
            point("p2", "Que vaut petit à la fin ?", "petit"),
        ],
        "indices": [
            "Une seule question à poser : lequel des deux est le plus grand ?",
            "Un bloc si/sinon suffit ; chaque branche remplit grand ET petit.",
            {"texte": "Commence par ce bloc :", "blocs": [si("a > b", [aff("grand", "a")], [])]},
        ],
        "sorties_langages": {
            "python": "a = 8\nb = 13\nif a > b:\n    grand, petit = a, b\nelse:\n    grand, petit = b, a\nprint(grand)\nprint(petit)",
            "javascript": "let a = 8, b = 13, grand, petit;\nif (a > b) { grand = a; petit = b; }\nelse { grand = b; petit = a; }\nconsole.log(grand);\nconsole.log(petit);",
            "java": "int a = 8, b = 13, grand, petit;\nif (a > b) { grand = a; petit = b; }\nelse { grand = b; petit = a; }\nSystem.out.println(grand);\nSystem.out.println(petit);",
            "c": "int a = 8, b = 13, grand, petit;\nif (a > b) { grand = a; petit = b; }\nelse { grand = b; petit = a; }\nprintf(\"%d\\n%d\\n\", grand, petit);",
        },
    },
    # ------------------------------------------------------------------ boucles
    {
        "notion": "boucles", "type": "coeur", "ordre": 50,
        "titre": "La factorielle",
        "enonce": "Le nombre n est fourni. Calcule dans une variable f le produit 1 × 2 × … × n à l'aide "
                  "d'une boucle, puis affiche f.",
        "entrees": {"n": 5},
        "blocs": [aff("f", "1"), pour("i", "1", "n", [aff("f", "f * i")]), ecrire("f")],
        "points_controle": [
            point("p1", "Que vaut f à la fin du 3e tour ?", "f", "iteration", 3),
            point("p2", "Que vaut f à la fin ?", "f"),
        ],
        "indices": [
            "Par quelle valeur f doit-il commencer pour qu'une multiplication ne l'écrase pas ?",
            "À chaque tour, f est multiplié par le numéro du tour.",
            {"texte": "Commence par ces blocs :", "blocs": [aff("f", "1"), pour("i", "1", "n", [])]},
        ],
        "sorties_langages": {
            "python": "n = 5\nf = 1\nfor i in range(1, n + 1):\n    f = f * i\nprint(f)",
            "javascript": "let n = 5, f = 1;\nfor (let i = 1; i <= n; i++) {\n  f = f * i;\n}\nconsole.log(f);",
            "java": "int n = 5, f = 1;\nfor (int i = 1; i <= n; i++) {\n    f = f * i;\n}\nSystem.out.println(f);",
            "c": "int n = 5, f = 1;\nfor (int i = 1; i <= n; i++) {\n    f = f * i;\n}\nprintf(\"%d\\n\", f);",
        },
    },
    # ----------------------------------------------------------------- tableaux
    {
        "notion": "tableaux", "type": "coeur", "ordre": 50,
        "titre": "La somme d'un tableau",
        "enonce": "Le tableau t est fourni. Calcule dans une variable s la somme de toutes ses cases, "
                  "puis affiche s.",
        "entrees": {"t": [5, 3, 8, 4]},
        "blocs": [aff("s", "0"), pour("i", "0", "longueur(t) - 1", [aff("s", "s + t[i]")]), ecrire("s")],
        "points_controle": [
            point("p1", "Que vaut s à la fin du 2e tour ?", "s", "iteration", 2),
            point("p2", "Que vaut s à la fin ?", "s"),
        ],
        "indices": [
            "Il faut visiter chaque case une fois : de quelle case à quelle case ?",
            "s commence à 0 et grossit d'une case à chaque tour.",
            {"texte": "Commence par ces blocs :", "blocs": [aff("s", "0"), pour("i", "0", "longueur(t) - 1", [])]},
        ],
        "sorties_langages": {
            "python": "t = [5, 3, 8, 4]\ns = 0\nfor i in range(len(t)):\n    s = s + t[i]\nprint(s)",
            "javascript": "const t = [5, 3, 8, 4];\nlet s = 0;\nfor (let i = 0; i < t.length; i++) {\n  s = s + t[i];\n}\nconsole.log(s);",
            "java": "int[] t = {5, 3, 8, 4};\nint s = 0;\nfor (int i = 0; i < t.length; i++) {\n    s = s + t[i];\n}\nSystem.out.println(s);",
            "c": "int t[] = {5, 3, 8, 4};\nint s = 0;\nfor (int i = 0; i < 4; i++) {\n    s = s + t[i];\n}\nprintf(\"%d\\n\", s);",
        },
    },
]


class Command(BaseCommand):
    help = "Charge 4 exercices cœur d'entraînement (idempotent : met à jour par titre)."

    def handle(self, *args, **options):
        for donnees in EXERCICES:
            donnees = {"entrees": {}, **donnees}
            instance = Exercice.objects.filter(titre=donnees["titre"]).first()
            serializer = ExerciceSerializer(instance, data=donnees)
            if not serializer.is_valid():
                raise CommandError(f"{donnees['titre']} : {serializer.errors}")
            serializer.save()
            self.stdout.write(f"{'mis à jour' if instance else 'créé'} : [{donnees['notion']}/{donnees['type']}] "
                              f"{donnees['titre']}")
        self.stdout.write(self.style.SUCCESS(f"{len(EXERCICES)} exercices d'entraînement prêts."))
