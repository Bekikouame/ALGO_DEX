"""Charge 12 exercices de DÉMONSTRATION (1 cœur + 2 express par notion).

Ils servent à tester l'API de bout en bout ; ils ne remplacent pas les douze
exercices actés du porteur, à saisir via le back-office (/api/exercices).
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
        "notion": "variables", "type": "express", "ordre": 1,
        "titre": "Échanger sans perdre",
        "enonce": "Lis l'algorithme et prédis les valeurs de a et b.",
        "blocs": [aff("a", "3"), aff("b", "7"), aff("a", "a + b"), aff("b", "a - b"), aff("a", "a - b"),
                  ecrire("a", "b")],
        "points_controle": [
            point("p1", "Que vaut a juste après sa 2e affectation ?", "a", "affectation", 2),
            point("p2", "Que vaut b juste après sa 2e affectation ?", "b", "affectation", 2),
        ],
        "indices": ["Regarde la valeur de a ligne par ligne : chaque affectation écrase l'ancienne valeur."],
        "sorties_langages": {"python": "a = 3\nb = 7\na = a + b\nb = a - b\na = a - b\nprint(a, b)"},
    },
    {
        "notion": "variables", "type": "express", "ordre": 2,
        "titre": "Le double et le reste",
        "enonce": "Lis l'algorithme et prédis les valeurs de x et y.",
        "blocs": [aff("x", "5"), aff("y", "x * 2"), aff("x", "y - x"), ecrire("x", "y")],
        "points_controle": [
            point("p1", "Que vaut y à la fin ?", "y"),
            point("p2", "Que vaut x à la fin ?", "x"),
        ],
        "indices": ["Quand y est calculé, quelle est la valeur de x à ce moment précis ?"],
        "sorties_langages": {"python": "x = 5\ny = x * 2\nx = y - x\nprint(x, y)"},
    },
    {
        "notion": "variables", "type": "coeur", "ordre": 1,
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
        "notion": "conditions", "type": "express", "ordre": 1,
        "titre": "Pair ou impair",
        "enonce": "Lis l'algorithme et prédis les valeurs de r et msg.",
        "blocs": [aff("x", "7"), aff("r", "x mod 2"),
                  si("r = 0", [aff("msg", '"pair"')], [aff("msg", '"impair"')]),
                  ecrire("x", '"est"', "msg")],
        "points_controle": [
            point("p1", "Que vaut r ?", "r"),
            point("p2", "Que vaut msg ?", "msg"),
        ],
        "indices": ["mod donne le reste de la division entière. Quel est le reste de 7 divisé par 2 ?"],
        "sorties_langages": {"python": "x = 7\nr = x % 2\nif r == 0:\n    msg = \"pair\"\nelse:\n    msg = \"impair\"\nprint(x, \"est\", msg)"},
    },
    {
        "notion": "conditions", "type": "express", "ordre": 2,
        "titre": "Le tarif du cinéma",
        "enonce": "Lis l'algorithme et prédis les valeurs de tarif et prix.",
        "blocs": [aff("age", "15"),
                  si("age ≥ 18", [aff("tarif", "10")], [si("age ≥ 12", [aff("tarif", "7")], [aff("tarif", "5")])]),
                  aff("prix", "tarif * 2"), ecrire("prix")],
        "points_controle": [
            point("p1", "Que vaut tarif ?", "tarif"),
            point("p2", "Que vaut prix ?", "prix"),
        ],
        "indices": ["Évalue la première condition avec age = 15. Si elle est fausse, où va l'exécution ?"],
        "sorties_langages": {"python": "age = 15\nif age >= 18:\n    tarif = 10\nelif age >= 12:\n    tarif = 7\nelse:\n    tarif = 5\nprix = tarif * 2\nprint(prix)"},
    },
    {
        "notion": "conditions", "type": "coeur", "ordre": 1,
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
        "notion": "boucles", "type": "express", "ordre": 1,
        "titre": "Additionner pas à pas",
        "enonce": "Lis l'algorithme et prédis l'évolution de s.",
        "blocs": [aff("s", "0"), pour("i", "1", "4", [aff("s", "s + i")]), ecrire("s")],
        "points_controle": [
            point("p1", "Que vaut s à la fin du 2e tour ?", "s", "iteration", 2),
            point("p2", "Que vaut s à la fin ?", "s"),
        ],
        "indices": ["Fais un petit tableau : une ligne par tour, une colonne pour i, une pour s."],
        "sorties_langages": {"python": "s = 0\nfor i in range(1, 5):\n    s = s + i\nprint(s)"},
    },
    {
        "notion": "boucles", "type": "express", "ordre": 2,
        "titre": "Diviser jusqu'à 1",
        "enonce": "Lis l'algorithme et prédis les valeurs de n et c.",
        "blocs": [aff("n", "20"), aff("c", "0"),
                  tant_que("n > 1", [aff("n", "n div 2"), aff("c", "c + 1")]), ecrire("c")],
        "points_controle": [
            point("p1", "Que vaut n à la fin du 1er tour ?", "n", "iteration", 1),
            point("p2", "Que vaut c à la fin ?", "c"),
        ],
        "indices": ["div donne le quotient entier : 5 div 2 vaut 2. Combien de tours avant que n ne vaille 1 ?"],
        "sorties_langages": {"python": "n = 20\nc = 0\nwhile n > 1:\n    n = n // 2\n    c = c + 1\nprint(c)"},
    },
    {
        "notion": "boucles", "type": "coeur", "ordre": 1,
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
        "notion": "tableaux", "type": "express", "ordre": 1,
        "titre": "Une case qui change",
        "enonce": "Lis l'algorithme et prédis x et le contenu de t. Les cases sont numérotées à partir de 0.",
        "blocs": [aff("t", "[4, 8, 15]"), aff("x", "t[2] - t[0]"), aff("t", "x * 2", index="1"), ecrire("t")],
        "points_controle": [
            point("p1", "Que vaut x ?", "x"),
            point("p2", "Que contient t à la fin ?", "t"),
        ],
        "indices": ["t[0] est la première case. Que contient t[2] ?"],
        "sorties_langages": {"python": "t = [4, 8, 15]\nx = t[2] - t[0]\nt[1] = x * 2\nprint(t)"},
    },
    {
        "notion": "tableaux", "type": "express", "ordre": 2,
        "titre": "Chercher le maximum",
        "enonce": "Lis l'algorithme et prédis l'évolution de m.",
        "blocs": [aff("t", "[3, 7, 2, 9]"), aff("m", "t[0]"),
                  pour("i", "1", "longueur(t) - 1", [si("t[i] > m", [aff("m", "t[i]")])]), ecrire("m")],
        "points_controle": [
            point("p1", "Que vaut m à la fin du 1er tour ?", "m", "iteration", 1),
            point("p2", "Que vaut m à la fin ?", "m"),
        ],
        "indices": ["Au premier tour, i vaut 1 : compare t[1] à m."],
        "sorties_langages": {"python": "t = [3, 7, 2, 9]\nm = t[0]\nfor i in range(1, len(t)):\n    if t[i] > m:\n        m = t[i]\nprint(m)"},
    },
    {
        "notion": "tableaux", "type": "coeur", "ordre": 1,
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
    help = "Charge 12 exercices de démonstration (idempotent : met à jour par titre)."

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
        self.stdout.write(self.style.SUCCESS(f"{len(EXERCICES)} exercices de démonstration prêts."))
