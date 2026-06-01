"""FastAPI application entry point.

Wires up the app, middleware (request logging, rate limiting, CORS), and the
routes: health, provider catalog, SQL generation, and Story mode.
"""

from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from app.config import get_settings
from app.observability import RateLimitMiddleware, RequestContextMiddleware, setup_logging
from app.pipeline import GenerationFailedError, GenerationOutput, generate_sql
from app.providers import AllProvidersFailedError, ModelInfo, list_models
from app.providers.base import close_client
from app.ratelimit import RateLimiter
from app.story import (
    Difficulty,
    MultiChapterStory,
    Story,
    StoryGenerationError,
    generate_story,
)

settings = get_settings()
setup_logging(settings.log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Release the pooled HTTP connections to the providers on shutdown.
    await close_client()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

# The expensive endpoints worth protecting from abuse.
_RATE_LIMITED_PATHS = {"/generate", "/story"}

# Middleware runs outermost-first in reverse order of registration, so add the
# rate limiter first (innermost), then request logging, then CORS last so it is
# outermost and sets CORS headers on every response, including 429s and errors.
if settings.rate_limit_per_minute > 0:
    app.add_middleware(
        RateLimitMiddleware,
        limiter=RateLimiter(settings.rate_limit_per_minute),
        protected_paths=_RATE_LIMITED_PATHS,
    )
app.add_middleware(RequestContextMiddleware)
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
        return await generate_sql(
            question,
            model=request.model,
            api_key=request.api_key,
            max_tokens=settings.max_output_tokens,
            use_cache=settings.cache_enabled,
        )
    except GenerationFailedError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except AllProvidersFailedError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


class StoryRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, protected_namespaces=())

    mode: Literal["single", "multi"] = "single"
    elements: list[str]
    skills: list[str]
    difficulty: Difficulty = "beginner"
    model: str | None = None
    api_key: str | None = Field(default=None, alias="apiKey")


@app.post("/story")
async def story(request: StoryRequest) -> Story | MultiChapterStory:
    """Generate a Story-mode lesson whose solutions are validated, runnable SQL.

    Returns a single adventure or a multi-chapter saga depending on ``mode``.
    """
    if not request.elements or not request.skills:
        raise HTTPException(status_code=422, detail="select at least one element and one skill")

    try:
        return await generate_story(
            request.mode,
            request.elements,
            request.skills,
            request.difficulty,
            model=request.model,
            api_key=request.api_key,
            use_cache=settings.cache_enabled,
        )
    except StoryGenerationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except AllProvidersFailedError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
