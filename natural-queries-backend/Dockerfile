# Container image for the FastAPI service. Host-agnostic: works on any platform
# that runs a Dockerfile (Fly.io, Render, Railway, etc). Provide the provider
# keys and other settings as environment variables at deploy time (see
# .env.example); never bake secrets into the image.

FROM python:3.12-slim

# uv for fast, reproducible installs from the lockfile.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Install dependencies first so this layer is cached across code changes. The
# app package is needed for uv to build/install the project, so copy it too.
COPY pyproject.toml uv.lock ./
COPY app ./app
RUN uv sync --frozen --no-dev

EXPOSE 8000

# Respect $PORT when the host injects one (shell form expands the variable).
CMD uv run --no-dev uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
