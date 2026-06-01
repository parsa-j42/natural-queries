"""LLM provider adapters and the router that picks between them."""

from app.providers.base import GenerationRequest, Message, Provider, ProviderError
from app.providers.catalog import ModelInfo, get_model, list_models
from app.providers.router import (
    AllProvidersFailedError,
    GenerationResult,
    generate,
)

__all__ = [
    "AllProvidersFailedError",
    "GenerationRequest",
    "GenerationResult",
    "Message",
    "ModelInfo",
    "Provider",
    "ProviderError",
    "generate",
    "get_model",
    "list_models",
]
