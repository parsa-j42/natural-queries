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

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance so the env is parsed only once."""
    return Settings()
