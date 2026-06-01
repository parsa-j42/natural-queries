"""Provider router: pick a model, resolve its key, run it, fall back on error.

The pipeline calls ``generate()`` and does not care which provider answers. The
router maps the chosen model to its provider, supplies the right key (the user's
own key for the explicitly chosen model, otherwise the server key), and tries the
configured fallbacks if the first choice errors.
"""

from pydantic import BaseModel

from app.config import Settings, get_settings
from app.providers.anthropic import AnthropicProvider
from app.providers.base import GenerationRequest, Message, Provider, ProviderError
from app.providers.catalog import ModelInfo, get_model
from app.providers.google import GoogleProvider
from app.providers.groq import GroqProvider

_PROVIDERS: dict[str, Provider] = {
    "google": GoogleProvider(),
    "groq": GroqProvider(),
    "anthropic": AnthropicProvider(),
}


class GenerationResult(BaseModel):
    text: str
    model: str  # catalog id that actually answered
    provider: str


class AllProvidersFailedError(RuntimeError):
    """Every candidate model failed or had no usable key."""

    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__("all providers failed: " + "; ".join(errors))


def _server_key(provider: str, settings: Settings) -> str:
    return {
        "google": settings.google_api_key,
        "groq": settings.groq_api_key,
        "anthropic": settings.anthropic_api_key,
    }[provider]


def _candidate_models(primary: str, settings: Settings) -> list[str]:
    """Primary choice first, then the configured fallbacks, without duplicates."""
    ordered = [primary]
    for model_id in settings.fallback_model_list:
        if model_id not in ordered:
            ordered.append(model_id)
    return ordered


async def generate(
    system: str,
    messages: list[Message],
    *,
    model: str | None = None,
    api_key: str | None = None,
    temperature: float = 0.0,
    max_tokens: int = 2048,
) -> GenerationResult:
    """Generate text from the chosen model, falling back on failure.

    ``api_key`` is a bring-your-own key that applies only to the explicitly
    chosen model; fallbacks always use server keys.
    """
    settings = get_settings()
    primary = model or settings.default_model
    errors: list[str] = []

    for index, model_id in enumerate(_candidate_models(primary, settings)):
        info: ModelInfo | None = get_model(model_id)
        if info is None:
            errors.append(f"{model_id}: unknown model")
            continue

        is_primary = index == 0
        key = api_key if (is_primary and api_key) else _server_key(info.provider, settings)
        if not key:
            reason = "BYO key required" if info.byok_only else "no server API key"
            errors.append(f"{model_id}: {reason}")
            continue

        request = GenerationRequest(
            system=system,
            messages=messages,
            model=info.id,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        try:
            text = await _PROVIDERS[info.provider].generate(request, api_key=key)
        except ProviderError as exc:
            errors.append(str(exc))
            continue
        return GenerationResult(text=text, model=info.id, provider=info.provider)

    raise AllProvidersFailedError(errors)
