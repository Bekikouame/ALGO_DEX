"""Interpréteur de blocs du moteur — sûr, pas à pas, pédagogique.

Aucun code arbitraire n'est évalué : les expressions sont analysées par `ast`
puis parcourues par un évaluateur qui n'accepte qu'une liste blanche de nœuds.

Format des blocs (JSON) :
    {"type": "affectation", "variable": "x", "valeur": "x + 1"}
    {"type": "affectation", "variable": "t", "index": "i", "valeur": "0"}   # t[i] ← 0
    {"type": "si", "condition": "x > 3", "alors": [...], "sinon": [...]}
    {"type": "tant_que", "condition": "i < n", "corps": [...]}
    {"type": "pour", "variable": "i", "debut": "0", "fin": "n - 1", "pas": "1", "corps": [...]}
    {"type": "ecrire", "valeurs": ["\"Somme :\"", "s"]}

Une expression est une chaîne (opérateurs + - * / div mod, comparaisons
= ≠ < ≤ > ≥, et/ou/non, vrai/faux, t[i], longueur(t)) ou un littéral JSON
(nombre, booléen, tableau). Les tableaux sont indicés à partir de 0, comme en
Python, langage de sortie de la récompense de fin de notion.

Points de contrôle (définis par l'auteur de l'exercice) :
    {"id": "p1", "question": "...", "variable": "s", "moment": {"type": "fin"}}
    moment = {"type": "fin"}
           | {"type": "iteration", "numero": 2, "boucle": 1}   # fin du 2e tour de la 1re boucle
           | {"type": "affectation", "numero": 3}              # juste après la 3e affectation
"""

import ast
import copy
import json
import keyword
import math
import re

MAX_PAS = 5000
MAX_LIGNES_CONSOLE = 200
MAX_NOMBRE = 10**15
MAX_TEXTE = 1000
# Bornes contre les programmes démesurés : une exécution reste petite en mémoire et en réponse.
MAX_TAILLE_TABLEAU = 1000
MAX_LONGUEUR_EXPRESSION = 2000
MAX_PROFONDEUR_EXPRESSION = 50
MAX_BLOCS = 500
MAX_IMBRICATION = 20
MAX_VOLUME_TRACE = 200_000  # valeurs copiées dans la trace, tous pas confondus
TYPES_BLOCS = ("affectation", "si", "tant_que", "pour", "ecrire")
TYPES_MOMENT = ("fin", "iteration", "affectation")
NOM_VARIABLE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
MOTS_RESERVES = {"et", "ou", "non", "mod", "div", "vrai", "faux", "longueur", *keyword.kwlist}


class BlocInvalide(Exception):
    """Programme mal formé : refusé avant toute exécution (F3)."""

    def __init__(self, message, chemin=""):
        super().__init__(message)
        self.message = message
        self.chemin = chemin


class ErreurExecution(Exception):
    """Erreur survenue pendant l'exécution, rattachée à une ligne."""

    def __init__(self, message, ligne=None):
        super().__init__(message)
        self.message = message
        self.ligne = ligne


# --------------------------------------------------------------------------
# Expressions
# --------------------------------------------------------------------------

_LITTERAL_CHAINE = re.compile(r"(\"[^\"]*\"|'[^']*')")
_REMPLACEMENTS = [
    (re.compile(r"\bet\b"), " and "),
    (re.compile(r"\bou\b"), " or "),
    (re.compile(r"\bnon\b"), " not "),
    (re.compile(r"\bmod\b"), " % "),
    (re.compile(r"\bdiv\b"), " // "),
    (re.compile(r"\bvrai\b"), " True "),
    (re.compile(r"\bfaux\b"), " False "),
    (re.compile(r"≠|<>"), " != "),
    (re.compile(r"≤"), " <= "),
    (re.compile(r"≥"), " >= "),
    (re.compile(r"(?<![<>!=])=(?!=)"), " == "),
]


def _traduire(source):
    """Pseudo-code → syntaxe d'expression Python, hors littéraux de texte."""
    morceaux = _LITTERAL_CHAINE.split(source)
    for i in range(0, len(morceaux), 2):
        for motif, cible in _REMPLACEMENTS:
            morceaux[i] = motif.sub(cible, morceaux[i])
    return "".join(morceaux)


_NOEUDS_AUTORISES = (
    ast.Expression, ast.BoolOp, ast.And, ast.Or, ast.BinOp, ast.Add, ast.Sub, ast.Mult,
    ast.Div, ast.FloorDiv, ast.Mod, ast.UnaryOp, ast.USub, ast.UAdd, ast.Not, ast.Compare,
    ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt, ast.GtE, ast.Name, ast.Load, ast.Constant,
    ast.List, ast.Subscript, ast.Call,
)


def _profondeur(arbre):
    """Profondeur de l'arbre, sans récursion : l'évaluateur, lui, est récursif."""
    maximum = 0
    pile = [(arbre, 1)]
    while pile:
        noeud, niveau = pile.pop()
        maximum = max(maximum, niveau)
        pile.extend((enfant, niveau + 1) for enfant in ast.iter_child_nodes(noeud))
    return maximum


class Expression:
    def __init__(self, brute, chemin):
        self.brute = brute
        if isinstance(brute, bool) or isinstance(brute, (int, float)):
            self.texte = _afficher(brute)
            self.arbre = ast.Expression(body=ast.Constant(brute))
            return
        if isinstance(brute, list):
            if len(brute) > MAX_TAILLE_TABLEAU:
                raise BlocInvalide(f"Tableau trop grand : {MAX_TAILLE_TABLEAU} cases au plus.", chemin)
            self.texte = json.dumps(brute, ensure_ascii=False)
            self.arbre = ast.Expression(
                body=ast.List(elts=[Expression(v, chemin).arbre.body for v in brute], ctx=ast.Load())
            )
            return
        if not isinstance(brute, str) or not brute.strip():
            raise BlocInvalide("Expression manquante : ce bloc attend une valeur.", chemin)
        if len(brute) > MAX_LONGUEUR_EXPRESSION:
            raise BlocInvalide(f"Expression trop longue : {MAX_LONGUEUR_EXPRESSION} caractères au plus.", chemin)
        self.texte = brute.strip()
        try:
            arbre = ast.parse(_traduire(self.texte).strip(), mode="eval")
        except (SyntaxError, ValueError):
            raise BlocInvalide(f"Expression illisible : « {self.texte} ».", chemin)
        except (RecursionError, MemoryError):
            raise BlocInvalide("Expression trop complexe : découpe-la en plusieurs lignes.", chemin)
        if _profondeur(arbre) > MAX_PROFONDEUR_EXPRESSION:
            raise BlocInvalide("Expression trop complexe : découpe-la en plusieurs lignes.", chemin)
        for noeud in ast.walk(arbre):
            if not isinstance(noeud, _NOEUDS_AUTORISES):
                raise BlocInvalide(f"Expression non autorisée : « {self.texte} ».", chemin)
            if isinstance(noeud, ast.Constant) and not isinstance(noeud.value, (int, float, str, bool)):
                raise BlocInvalide(f"Valeur non autorisée dans « {self.texte} ».", chemin)
            if isinstance(noeud, ast.Call) and not (
                isinstance(noeud.func, ast.Name)
                and noeud.func.id == "longueur"
                and len(noeud.args) == 1
                and not noeud.keywords
            ):
                raise BlocInvalide(
                    f"Seule la fonction longueur(tableau) est disponible : « {self.texte} ».", chemin
                )
        self.arbre = arbre


def _nombre(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _evaluer(noeud, variables, ligne):
    if isinstance(noeud, ast.Expression):
        return _evaluer(noeud.body, variables, ligne)
    if isinstance(noeud, ast.Constant):
        return noeud.value
    if isinstance(noeud, ast.Name):
        if noeud.id not in variables:
            raise ErreurExecution(
                f"La variable « {noeud.id} » est utilisée avant d'avoir reçu une valeur.", ligne
            )
        return variables[noeud.id]
    if isinstance(noeud, ast.List):
        elements = [_evaluer(e, variables, ligne) for e in noeud.elts]
        if any(isinstance(e, list) for e in elements):
            raise ErreurExecution("Un tableau ne peut contenir que des valeurs simples, pas d'autres tableaux.", ligne)
        return elements
    if isinstance(noeud, ast.BoolOp):
        resultat = None
        for valeur in noeud.values:
            resultat = _booleen(_evaluer(valeur, variables, ligne), ligne)
            if isinstance(noeud.op, ast.And) and not resultat:
                return False
            if isinstance(noeud.op, ast.Or) and resultat:
                return True
        return resultat
    if isinstance(noeud, ast.UnaryOp):
        v = _evaluer(noeud.operand, variables, ligne)
        if isinstance(noeud.op, ast.Not):
            return not _booleen(v, ligne)
        if not _nombre(v):
            raise ErreurExecution(f"Le signe « - » s'applique à un nombre, pas à {_decrire(v)}.", ligne)
        return -v if isinstance(noeud.op, ast.USub) else v
    if isinstance(noeud, ast.BinOp):
        g = _evaluer(noeud.left, variables, ligne)
        d = _evaluer(noeud.right, variables, ligne)
        return _borner(_operation(noeud.op, g, d, ligne), ligne)
    if isinstance(noeud, ast.Compare):
        gauche = _evaluer(noeud.left, variables, ligne)
        for op, comparateur in zip(noeud.ops, noeud.comparators):
            droite = _evaluer(comparateur, variables, ligne)
            if not _comparer(op, gauche, droite, ligne):
                return False
            gauche = droite
        return True
    if isinstance(noeud, ast.Subscript):
        tableau = _evaluer(noeud.value, variables, ligne)
        position = _evaluer(noeud.slice, variables, ligne)
        return tableau[_position(tableau, position, ligne, _nom(noeud.value))]
    if isinstance(noeud, ast.Call):
        v = _evaluer(noeud.args[0], variables, ligne)
        if not isinstance(v, (list, str)):
            raise ErreurExecution(f"longueur() attend un tableau, pas {_decrire(v)}.", ligne)
        return len(v)
    raise ErreurExecution("Expression non autorisée.", ligne)


def _nom(noeud):
    return noeud.id if isinstance(noeud, ast.Name) else "le tableau"


def _position(tableau, position, ligne, nom):
    if not isinstance(tableau, list):
        raise ErreurExecution(f"« {nom} » n'est pas un tableau : on ne peut pas lire une case.", ligne)
    if isinstance(position, float) and position.is_integer():
        position = int(position)
    if not isinstance(position, int) or isinstance(position, bool):
        raise ErreurExecution(f"Le numéro de case doit être un entier, pas {_decrire(position)}.", ligne)
    if not 0 <= position < len(tableau):
        raise ErreurExecution(
            f"Case {nom}[{position}] inexistante : le tableau a {len(tableau)} cases, "
            f"numérotées de 0 à {len(tableau) - 1}.",
            ligne,
        )
    return position


def _borner(v, ligne):
    if isinstance(v, str) and len(v) > MAX_TEXTE:
        raise ErreurExecution(f"Texte trop long (plus de {MAX_TEXTE} caractères).", ligne)
    if _nombre(v) and ((isinstance(v, float) and not math.isfinite(v)) or abs(v) > MAX_NOMBRE):
        raise ErreurExecution("Nombre trop grand : vérifie que ta variable ne grandit pas sans fin.", ligne)
    return v


def _booleen(v, ligne):
    if not isinstance(v, bool):
        raise ErreurExecution(f"Une condition doit valoir vrai ou faux, pas {_decrire(v)}.", ligne)
    return v


def _operation(op, g, d, ligne):
    if isinstance(op, ast.Add) and isinstance(g, str) and isinstance(d, str):
        return g + d
    if not (_nombre(g) and _nombre(d)):
        symbole = {ast.Add: "+", ast.Sub: "-", ast.Mult: "*", ast.Div: "/", ast.FloorDiv: "div", ast.Mod: "mod"}
        raise ErreurExecution(
            f"Opération « {symbole[type(op)]} » impossible entre {_decrire(g)} et {_decrire(d)}.", ligne
        )
    if isinstance(op, (ast.Div, ast.FloorDiv, ast.Mod)) and d == 0:
        raise ErreurExecution("Division par zéro : le diviseur vaut 0.", ligne)
    if isinstance(op, ast.Add):
        return g + d
    if isinstance(op, ast.Sub):
        return g - d
    if isinstance(op, ast.Mult):
        return g * d
    if isinstance(op, ast.Div):
        return g / d
    if isinstance(op, ast.FloorDiv):
        return g // d
    return g % d


def _comparer(op, g, d, ligne):
    if isinstance(op, ast.Eq):
        return g == d
    if isinstance(op, ast.NotEq):
        return g != d
    if not ((_nombre(g) and _nombre(d)) or (isinstance(g, str) and isinstance(d, str))):
        raise ErreurExecution(f"Impossible de comparer {_decrire(g)} et {_decrire(d)}.", ligne)
    if isinstance(op, ast.Lt):
        return g < d
    if isinstance(op, ast.LtE):
        return g <= d
    if isinstance(op, ast.Gt):
        return g > d
    return g >= d


def _decrire(v):
    if isinstance(v, bool):
        return "un booléen"
    if _nombre(v):
        return "un nombre"
    if isinstance(v, str):
        return "du texte"
    if isinstance(v, list):
        return "un tableau"
    return "une valeur inconnue"


def _afficher(v):
    if isinstance(v, bool):
        return "vrai" if v else "faux"
    if isinstance(v, float):
        if math.isfinite(v) and v.is_integer():
            return str(int(v))
        return repr(round(v, 10))
    if isinstance(v, list):
        return "[" + ", ".join(_afficher(e) for e in v) + "]"
    return str(v)


# --------------------------------------------------------------------------
# Compilation : validation de forme + numérotation des lignes de pseudo-code
# --------------------------------------------------------------------------


class Noeud:
    def __init__(self, **attrs):
        self.__dict__.update(attrs)


class Programme:
    def __init__(self, blocs):
        self.lignes = []  # pseudo-code affiché, une entrée par ligne
        self.nb_boucles = 0
        self.nb_blocs = 0
        if not isinstance(blocs, list):
            raise BlocInvalide("Le programme doit être une liste de blocs.")
        self.corps = self._sequence(blocs, "blocs", 0)

    def _ligne(self, texte, niveau):
        self.lignes.append({"ligne": len(self.lignes) + 1, "texte": "    " * niveau + texte})
        return len(self.lignes)

    def _sequence(self, blocs, chemin, niveau):
        if not isinstance(blocs, list):
            raise BlocInvalide("Un emplacement de blocs doit contenir une liste.", chemin)
        return [self._bloc(b, f"{chemin}[{i}]", niveau) for i, b in enumerate(blocs)]

    def _variable(self, bloc, chemin, libelle):
        nom = bloc.get("variable")
        if not isinstance(nom, str) or not NOM_VARIABLE.match(nom) or nom in MOTS_RESERVES:
            raise BlocInvalide(f"Bloc « {libelle} » : nom de variable manquant ou invalide.", chemin)
        return nom

    def _bloc(self, bloc, chemin, niveau):
        self.nb_blocs += 1
        if self.nb_blocs > MAX_BLOCS:
            raise BlocInvalide(f"Algorithme trop long : {MAX_BLOCS} instructions au plus.", chemin[:200])
        if niveau > MAX_IMBRICATION:
            raise BlocInvalide(f"Trop de blocs imbriqués : {MAX_IMBRICATION} niveaux au plus.", chemin[:200])
        if not isinstance(bloc, dict) or bloc.get("type") not in TYPES_BLOCS:
            raise BlocInvalide(
                "Bloc inconnu : les blocs disponibles sont affectation, si, tant_que, pour et ecrire.",
                chemin,
            )
        genre = bloc["type"]
        if genre == "affectation":
            nom = self._variable(bloc, chemin, "affectation")
            index = Expression(bloc["index"], chemin) if bloc.get("index") is not None else None
            if "valeur" not in bloc:
                raise BlocInvalide("Bloc « affectation » : il manque la valeur à affecter.", chemin)
            valeur = Expression(bloc["valeur"], chemin)
            cible = f"{nom}[{index.texte}]" if index else nom
            ligne = self._ligne(f"{cible} ← {valeur.texte}", niveau)
            return Noeud(genre=genre, ligne=ligne, variable=nom, index=index, valeur=valeur)
        if genre == "ecrire":
            valeurs = bloc.get("valeurs")
            if not isinstance(valeurs, list) or not valeurs:
                raise BlocInvalide("Bloc « écrire » : il faut au moins une valeur à afficher.", chemin)
            expressions = [Expression(v, chemin) for v in valeurs]
            ligne = self._ligne(f"écrire({', '.join(e.texte for e in expressions)})", niveau)
            return Noeud(genre=genre, ligne=ligne, valeurs=expressions)
        if genre == "si":
            if "condition" not in bloc:
                raise BlocInvalide("Bloc « si » : il manque la condition.", chemin)
            condition = Expression(bloc["condition"], chemin)
            ligne = self._ligne(f"si {condition.texte} alors", niveau)
            alors = self._sequence(bloc.get("alors", []), f"{chemin}.alors", niveau + 1)
            sinon = None
            if bloc.get("sinon"):
                self._ligne("sinon", niveau)
                sinon = self._sequence(bloc["sinon"], f"{chemin}.sinon", niveau + 1)
            self._ligne("fin si", niveau)
            return Noeud(genre=genre, ligne=ligne, condition=condition, alors=alors, sinon=sinon or [])
        if genre == "tant_que":
            if "condition" not in bloc:
                raise BlocInvalide("Bloc « tant que » : il manque la condition.", chemin)
            condition = Expression(bloc["condition"], chemin)
            self.nb_boucles += 1
            numero = self.nb_boucles
            ligne = self._ligne(f"tant que {condition.texte} faire", niveau)
            corps = self._sequence(bloc.get("corps", []), f"{chemin}.corps", niveau + 1)
            self._ligne("fin tant que", niveau)
            return Noeud(genre=genre, ligne=ligne, condition=condition, corps=corps, numero=numero)
        # pour
        nom = self._variable(bloc, chemin, "pour")
        for cle in ("debut", "fin"):
            if cle not in bloc:
                raise BlocInvalide(f"Bloc « pour » : il manque la valeur de {cle}.", chemin)
        debut = Expression(bloc["debut"], chemin)
        fin = Expression(bloc["fin"], chemin)
        pas = Expression(bloc.get("pas", 1), chemin)
        self.nb_boucles += 1
        numero = self.nb_boucles
        suffixe = "" if pas.texte == "1" else f" pas {pas.texte}"
        ligne = self._ligne(f"pour {nom} de {debut.texte} à {fin.texte}{suffixe} faire", niveau)
        corps = self._sequence(bloc.get("corps", []), f"{chemin}.corps", niveau + 1)
        self._ligne("fin pour", niveau)
        return Noeud(genre="pour", ligne=ligne, variable=nom, debut=debut, fin=fin, pas=pas,
                     corps=corps, numero=numero)


# --------------------------------------------------------------------------
# Validation des données d'exercice
# --------------------------------------------------------------------------


def valider_entrees(entrees):
    if not isinstance(entrees, dict):
        raise BlocInvalide("Les entrées doivent être un objet {variable: valeur}.", "entrees")
    for nom, valeur in entrees.items():
        if not NOM_VARIABLE.match(nom) or nom in MOTS_RESERVES:
            raise BlocInvalide(f"Nom de variable d'entrée invalide : « {nom} ».", "entrees")
        elements = valeur if isinstance(valeur, list) else [valeur]
        if not all(isinstance(e, (int, float, str, bool)) for e in elements):
            raise BlocInvalide(
                f"L'entrée « {nom} » doit être un nombre, un texte, un booléen ou un tableau.", "entrees"
            )


def valider_points_controle(points):
    if not isinstance(points, list) or not 2 <= len(points) <= 4:
        raise BlocInvalide("Un exercice exige de 2 à 4 points de contrôle.", "points_controle")
    ids = set()
    for i, p in enumerate(points):
        chemin = f"points_controle[{i}]"
        if not isinstance(p, dict):
            raise BlocInvalide("Chaque point de contrôle doit être un objet.", chemin)
        if not isinstance(p.get("id"), str) or not p["id"] or p["id"] in ids:
            raise BlocInvalide("Chaque point de contrôle doit avoir un « id » unique.", chemin)
        ids.add(p["id"])
        if not isinstance(p.get("question"), str) or not p["question"].strip():
            raise BlocInvalide("Chaque point de contrôle doit poser une « question ».", chemin)
        if not isinstance(p.get("variable"), str) or not NOM_VARIABLE.match(p["variable"]):
            raise BlocInvalide("Chaque point de contrôle doit viser une « variable ».", chemin)
        moment = p.get("moment")
        if not isinstance(moment, dict) or moment.get("type") not in TYPES_MOMENT:
            raise BlocInvalide("« moment » doit être de type fin, iteration ou affectation.", chemin)
        if moment["type"] != "fin":
            numero = moment.get("numero")
            if not isinstance(numero, int) or isinstance(numero, bool) or numero < 1:
                raise BlocInvalide("« moment.numero » doit être un entier ≥ 1.", chemin)
        if moment["type"] == "iteration" and "boucle" in moment:
            boucle = moment["boucle"]
            if not isinstance(boucle, int) or isinstance(boucle, bool) or boucle < 1:
                raise BlocInvalide("« moment.boucle » doit être un entier ≥ 1.", chemin)


# --------------------------------------------------------------------------
# Exécution
# --------------------------------------------------------------------------


class _Arret(Exception):
    pass


def _poids(valeur):
    """Place d'une valeur dans la trace : 1 par nombre, davantage pour un long texte, la somme pour un tableau."""
    if isinstance(valeur, list):
        return 1 + sum(_poids(v) for v in valeur)
    if isinstance(valeur, str):
        return 1 + len(valeur) // 16
    return 1


class _Execution:
    def __init__(self, programme, entrees, points):
        self.programme = programme
        self.variables = copy.deepcopy(entrees or {})
        self.points = points or []
        self.trace = []
        self.volume = 0
        self.console = []
        self.valeurs_console = []  # pour chaque ligne affichée : ses valeurs seules, sans le texte fixe
        self.nb_affectations = {}
        self.nb_iterations = {}
        self.valeurs_points = {p["id"]: {"atteint": False, "valeur": None} for p in self.points}

    # -- trace et points de contrôle --

    def _pas(self, ligne, description, ecrit=None):
        if len(self.trace) >= MAX_PAS:
            raise ErreurExecution(
                f"Arrêt après {MAX_PAS} pas : la boucle est probablement infinie. "
                "Regarde comment évolue la variable de ta condition à chaque tour.",
                ligne,
            )
        self.volume += 1 + len(description) // 16 + sum(_poids(v) for v in self.variables.values())
        if self.volume > MAX_VOLUME_TRACE:
            raise ErreurExecution(
                "Exécution trop volumineuse : réduis la taille de tes tableaux ou le nombre de tours de boucle.",
                ligne,
            )
        self.trace.append({
            "pas": len(self.trace) + 1,
            "ligne": ligne,
            "description": description,
            "variables": copy.deepcopy(self.variables),
            "ecrit": ecrit,
        })

    def _capturer(self, moment_type, numero, boucle=None, variable=None):
        for p in self.points:
            m = p["moment"]
            if m["type"] != moment_type or m.get("numero") != numero:
                continue
            if moment_type == "iteration" and m.get("boucle", 1) != boucle:
                continue
            if moment_type == "affectation" and p["variable"] != variable:
                continue
            etat = self.valeurs_points[p["id"]]
            if etat["atteint"] or p["variable"] not in self.variables:
                continue
            etat["atteint"] = True
            etat["valeur"] = copy.deepcopy(self.variables[p["variable"]])

    def _affecter(self, nom, valeur, ligne, description):
        self.variables[nom] = valeur
        self._pas(ligne, description)
        self.nb_affectations[nom] = self.nb_affectations.get(nom, 0) + 1
        self._capturer("affectation", self.nb_affectations[nom], variable=nom)

    # -- blocs --

    def executer(self, noeuds):
        for n in noeuds:
            getattr(self, f"_{n.genre}")(n)

    def _eval(self, expression, ligne):
        return _evaluer(expression.arbre, self.variables, ligne)

    def _affectation(self, n):
        valeur = copy.deepcopy(self._eval(n.valeur, n.ligne))
        if n.index is None:
            self._affecter(n.variable, valeur, n.ligne, f"{n.variable} reçoit {_afficher(valeur)}")
            return
        if n.variable not in self.variables:
            raise ErreurExecution(
                f"Le tableau « {n.variable} » est utilisé avant d'avoir reçu une valeur.", n.ligne
            )
        tableau = self.variables[n.variable]
        position = _position(tableau, self._eval(n.index, n.ligne), n.ligne, n.variable)
        tableau[position] = valeur
        self._affecter(n.variable, tableau, n.ligne,
                       f"{n.variable}[{position}] reçoit {_afficher(valeur)}")

    def _ecrire(self, n):
        morceaux = [(v, _afficher(self._eval(v, n.ligne))) for v in n.valeurs]
        texte = " ".join(m for _, m in morceaux)
        if len(self.console) >= MAX_LIGNES_CONSOLE:
            raise ErreurExecution(
                f"Arrêt après {MAX_LIGNES_CONSOLE} lignes affichées : vérifie que ton « écrire » "
                "n'est pas dans une boucle qui ne s'arrête pas.",
                n.ligne,
            )
        self.console.append(texte)
        calcules = [m for v, m in morceaux if not (isinstance(v.arbre.body, ast.Constant) and isinstance(v.arbre.body.value, str))]
        self.valeurs_console.append(" ".join(calcules) or texte)
        self._pas(n.ligne, f"affiche « {texte} »", ecrit=texte)

    def _si(self, n):
        verdict = _booleen(self._eval(n.condition, n.ligne), n.ligne)
        self._pas(n.ligne, f"condition {n.condition.texte} → {_afficher(verdict)}")
        self.executer(n.alors if verdict else n.sinon)

    def _fin_tour(self, n):
        self.nb_iterations[n.numero] = self.nb_iterations.get(n.numero, 0) + 1
        self._capturer("iteration", self.nb_iterations[n.numero], boucle=n.numero)

    def _tant_que(self, n):
        while True:
            verdict = _booleen(self._eval(n.condition, n.ligne), n.ligne)
            self._pas(n.ligne, f"condition {n.condition.texte} → {_afficher(verdict)}")
            if not verdict:
                return
            self.executer(n.corps)
            self._fin_tour(n)

    def _pour(self, n):
        debut = self._eval(n.debut, n.ligne)
        fin = self._eval(n.fin, n.ligne)
        pas = self._eval(n.pas, n.ligne)
        if not (_nombre(debut) and _nombre(fin) and _nombre(pas)):
            raise ErreurExecution("Les bornes et le pas d'une boucle « pour » doivent être des nombres.", n.ligne)
        if pas == 0:
            raise ErreurExecution("Le pas d'une boucle « pour » ne peut pas valoir 0.", n.ligne)
        i = debut
        while (pas > 0 and i <= fin) or (pas < 0 and i >= fin):
            self._affecter(n.variable, i, n.ligne, f"{n.variable} prend la valeur {_afficher(i)}")
            self.executer(n.corps)
            self._fin_tour(n)
            i += pas
        self._pas(n.ligne, f"fin de la boucle pour : {n.variable} a dépassé {_afficher(fin)}")


def executer(blocs, entrees=None, points_controle=None):
    """Compile puis exécute. Lève BlocInvalide si le programme est mal formé ;
    une erreur d'exécution est renvoyée dans le résultat, trace partielle comprise."""
    programme = blocs if isinstance(blocs, Programme) else Programme(blocs)
    valider_entrees(entrees or {})
    run = _Execution(programme, entrees, points_controle)
    erreur = None
    try:
        run.executer(programme.corps)
    except ErreurExecution as e:
        erreur = {"message": e.message, "ligne": e.ligne}
    except (OverflowError, RecursionError, MemoryError):
        erreur = {"message": "Calcul trop grand : vérifie les valeurs de ton algorithme.", "ligne": None}
    if erreur is None:
        for p in run.points:
            if p["moment"]["type"] == "fin" and p["variable"] in run.variables:
                run.valeurs_points[p["id"]] = {
                    "atteint": True, "valeur": copy.deepcopy(run.variables[p["variable"]])
                }
    return {
        "lignes": programme.lignes,
        "trace": run.trace,
        "console": run.console,
        "console_valeurs": run.valeurs_console,
        "variables_finales": run.variables,
        "points": run.valeurs_points,
        "erreur": erreur,
    }


# --------------------------------------------------------------------------
# Comparaison prédiction / réalité
# --------------------------------------------------------------------------


def _normaliser(v):
    if isinstance(v, str):
        brut = v.strip()
        if brut.lower() in ("vrai", "true"):
            return True
        if brut.lower() in ("faux", "false"):
            return False
        try:
            return _normaliser(json.loads(brut))
        except (ValueError, TypeError):
            pass
        try:
            return float(brut.replace(",", "."))
        except ValueError:
            return brut
    if isinstance(v, list):
        return [_normaliser(e) for e in v]
    return v


def valeurs_egales(predite, reelle):
    a, b = _normaliser(predite), _normaliser(reelle)
    if isinstance(a, bool) or isinstance(b, bool):
        return a is b
    if _nombre(a) and _nombre(b):
        return math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-9)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(valeurs_egales(x, y) for x, y in zip(a, b))
    return a == b


def normaliser_console(lignes):
    if isinstance(lignes, str):
        lignes = lignes.split("\n")
    lignes = [str(l).strip() for l in (lignes or [])]
    while lignes and not lignes[-1]:
        lignes.pop()
    return lignes


def consoles_egales(a, b):
    a, b = normaliser_console(a), normaliser_console(b)
    return len(a) == len(b) and all(x == y or valeurs_egales(x, y) for x, y in zip(a, b))


def _mots(ligne):
    return str(ligne).casefold().split()


def _memes_mots(a, b):
    return len(a) == len(b) and all(x == y or valeurs_egales(x, y) for x, y in zip(a, b))


def comparer(prediction, resultat, points_controle):
    """Écran de comparaison point par point + console prédite vs réelle (F6)."""
    points = []
    for p in points_controle:
        reel = resultat["points"].get(p["id"], {"atteint": False, "valeur": None})
        predit = (prediction.get("points") or {}).get(p["id"])
        points.append({
            "id": p["id"],
            "question": p["question"],
            "variable": p["variable"],
            "predit": predit,
            "reel": reel["valeur"] if reel["atteint"] else None,
            "atteint": reel["atteint"],
            "juste": reel["atteint"] and valeurs_egales(predit, reel["valeur"]),
        })
    console_predite = normaliser_console(prediction.get("sortie"))
    console_reelle = normaliser_console(resultat["console"])
    longueur = max(len(console_predite), len(console_reelle))
    lignes = [
        {
            "numero": i + 1,
            "predite": console_predite[i] if i < len(console_predite) else None,
            "reelle": console_reelle[i] if i < len(console_reelle) else None,
        }
        for i in range(longueur)
    ]
    for l in lignes:
        l["juste"] = l["predite"] is not None and l["reelle"] is not None and (
            l["predite"] == l["reelle"] or valeurs_egales(l["predite"], l["reelle"])
        )
    sortie_exacte = consoles_egales(console_predite, console_reelle)
    # Prédire, c'est trouver les valeurs : « 14 » ou « 14 2 » suffit pour « x vaut 14 » puis « y vaut 2 ».
    # Une ligne faite uniquement de texte fixe (« Décollage ! ») reste à prédire telle quelle.
    valeurs_reelles = (resultat.get("console_valeurs") or console_reelle)[: len(console_reelle)]
    for l in lignes:
        i = l["numero"] - 1
        if not l["juste"] and l["predite"] and i < len(valeurs_reelles):
            l["juste"] = _memes_mots(_mots(l["predite"]), _mots(valeurs_reelles[i]))
    sortie_juste = sortie_exacte or (bool(lignes) and all(l["juste"] for l in lignes))
    tous_predits = [m for ligne in console_predite for m in _mots(ligne)]
    if not sortie_juste and valeurs_reelles and _memes_mots(tous_predits, [m for v in valeurs_reelles for m in _mots(v)]):
        # Les bonnes valeurs dans le bon ordre, écrites sur une seule ligne : on les range sous chaque ligne réelle.
        sortie_juste = True
        lignes, debut = [], 0
        for i, reelle in enumerate(console_reelle):
            fin = debut + len(_mots(valeurs_reelles[i]))
            lignes.append({"numero": i + 1, "predite": " ".join(tous_predits[debut:fin]), "reelle": reelle, "juste": True})
            debut = fin
    return {
        "points": points,
        "console": lignes,
        "sortie_juste": sortie_juste,
        "sortie_valeurs_seules": sortie_juste and not sortie_exacte,
        "tout_juste": sortie_juste and all(p["juste"] for p in points),
    }
