# Moteur Django : Python 3.13, dépendances figées par uv.lock, servi par gunicorn.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

RUN pip install --no-cache-dir uv==0.8.17

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .
# Les fichiers statiques du back-office, compressés une fois pour toutes (clé factice : collectstatic n'en a pas besoin).
RUN DJANGO_DEBUG=0 DJANGO_SECRET_KEY=collectstatic-uniquement-collectstatic-uniquement-collectstatic \
    python manage.py collectstatic --noinput

# Jamais en root.
RUN useradd --create-home --uid 1000 algodex && chown -R algodex /app
USER algodex

EXPOSE 8000
ENTRYPOINT ["/app/scripts/demarrer.sh"]
