"""FastAPI application entry point.

Wires up the app, CORS, health check, and the provider catalog. The generation
and story routes are added in later steps of Phase 3 and Phase 4.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from app.config import get_settings
from app.pipeline import GenerationFailedError, GenerationOutput, generate_sql
from app.providers import AllProvidersFailedError, ModelInfo, list_models

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


class GenerateRequest(BaseModel):
    # populate_by_name lets the frontend send apiKey (its convention) while the
    # field stays snake_case here. protected_namespaces silences the warning
    # about a field literally named "model".
    model_config = ConfigDict(populate_by_name=True, protected_namespaces=())

    question: str
    model: str | None = None
    api_key: str | None = Field(default=None, alias="apiKey")


@app.post("/generate")
async def generate(request: GenerateRequest) -> GenerationOutput:
    """Turn an English question into validated, runnable DuckDB SQL.

    The SQL is validated server-side but executed in the browser. A 422 means we
    could not produce valid SQL; a 502 means every provider was unreachable.
    """
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="question must not be empty")

    try:
        return await generate_sql(question, model=request.model, api_key=request.api_key)
    except GenerationFailedError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except AllProvidersFailedError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
