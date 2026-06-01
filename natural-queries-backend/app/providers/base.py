"""Shared types and HTTP plumbing for the LLM provider adapters.

Every provider implements the same tiny surface: take a system prompt plus a
list of chat messages and a model id, return the assistant's text. Differences
in request shape (OpenAI-style, Gemini-style, Anthropic-style) and in prompt
caching are hidden behind each adapter.
"""

import re
from abc import ABC, abstractmethod
from typing import Literal

import httpx
from pydantic import BaseModel

# Generous timeout: reasoning models on a cold path can take a while. Connect
# stays short so a dead host fails fast and the router can fall back.
DEFAULT_TIMEOUT = httpx.Timeout(60.0, connect=10.0)

_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL)

# One shared client, reused across requests so TLS connections are pooled rather
# than re-established per call. Created lazily and closed on app shutdown.
_client: httpx.AsyncClient | None = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=DEFAULT_TIMEOUT)
    return _client


async def close_client() -> None:
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
    _client = None


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class GenerationRequest(BaseModel):
    system: str
    messages: list[Message]
    model: str  # the provider's own model id (e.g. "claude-sonnet-4-6")
    temperature: float = 0.0
    max_tokens: int = 2048


class ProviderError(RuntimeError):
    """A single provider call failed. The router catches these to fall back."""

    def __init__(self, provider: str, message: str, *, status: int | None = None):
        self.provider = provider
        self.status = status
        super().__init__(f"{provider}: {message}")


class Provider(ABC):
    name: str

    @abstractmethod
    async def generate(self, request: GenerationRequest, *, api_key: str) -> str:
        """Run one completion and return the assistant's text."""


async def post_json(provider: str, url: str, *, headers: dict, payload: dict) -> dict:
    """POST JSON and return the parsed body, raising ProviderError on failure."""
    try:
        resp = await get_client().post(url, headers=headers, json=payload)
    except httpx.RequestError as exc:
        raise ProviderError(provider, f"request failed: {exc}") from exc

    if resp.status_code >= 400:
        # Trim the body so a huge HTML error page does not flood logs.
        raise ProviderError(
            provider, f"HTTP {resp.status_code}: {resp.text[:300]}", status=resp.status_code
        )
    return resp.json()


def strip_thinking(text: str) -> str:
    """Remove <think>...</think> blocks some open reasoning models emit inline."""
    return _THINK_RE.sub("", text).strip()
