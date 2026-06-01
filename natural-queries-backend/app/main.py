"""FastAPI application entry point.

Wires up the app, CORS, health check, and the provider catalog. The generation
and story routes are added in later steps of Phase 3 and Phase 4.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import get_settings
from app.providers import ModelInfo, list_models

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness probe used by the frontend and deploy platform."""
    return {"status": "ok", "environment": settings.environment}


class ProvidersResponse(BaseModel):
    models: list[ModelInfo]
    default: str


@app.get("/providers")
def providers() -> ProvidersResponse:
    """List the selectable models and which one is the default.

    The frontend uses this to build its model picker; ``byok_only`` models
    prompt the user for a key.
    """
    return ProvidersResponse(models=list_models(), default=settings.default_model)
