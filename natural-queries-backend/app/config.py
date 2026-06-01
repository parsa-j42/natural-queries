"""Application settings, loaded from the environment via pydantic-settings.

Every value here can be overridden with an environment variable (or a local .env
file, which is gitignored). See .env.example for the full list and defaults.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Service metadata
    app_name: str = "Natural Queries API"
    environment: str = "development"

    # Comma-separated list of origins allowed to call the API from a browser.
    # Defaults cover the production site and the local Vite dev server.
    cors_origins: str = Field(
        default="https://naturalqueries.parsaj.dev,http://localhost:5173",
    )

    # Provider API keys. Optional at this stage; the pipeline that uses them
    # arrives in Phase 3. Keys are read here so they live in one place and never
    # get hardcoded. Leave blank to rely on bring-your-own-key requests.
    google_api_key: str = ""
    groq_api_key: str = ""
    anthropic_api_key: str = ""

    # Model used when a request does not name one. Must be a non-BYO-key model in
    # the catalog (app/providers/catalog.py) so it works with the server's keys.
    default_model: str = "openai/gpt-oss-120b"

    # Ordered fallbacks tried when the chosen model errors out. Comma-separated
    # catalog ids. BYO-key-only models are skipped here (no server key to use).
    fallback_models: str = "openai/gpt-oss-120b,llama-3.3-70b-versatile,gemini-3.1-flash-lite"

    # Cap on output tokens per generation, to bound cost and latency.
    max_output_tokens: int = 2048

    # Cache identical requests (same question/selection and model) so repeats are
    # instant and free. In-memory, per process.
    cache_enabled: bool = True

    # Per-IP request budget for the expensive endpoints (/generate, /story).
    # Requests allowed per minute; 0 disables rate limiting.
    rate_limit_per_minute: int = 30

    # Logging verbosity for the app logger.
    log_level: str = "INFO"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def fallback_model_list(self) -> list[str]:
        return [m.strip() for m in self.fallback_models.split(",") if m.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance so the env is parsed only once."""
    return Settings()
