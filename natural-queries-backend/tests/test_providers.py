"""Tests for the provider catalog, response parsers, and router."""

import asyncio

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import app
from app.providers import router
from app.providers.anthropic import _extract_text as anthropic_extract
from app.providers.base import Message, Provider, ProviderError, strip_thinking
from app.providers.catalog import get_model, list_models
from app.providers.google import _extract_text as google_extract
from app.providers.groq import _extract_text as groq_extract
from app.providers.router import AllProvidersFailedError, generate

# --- catalog --------------------------------------------------------------


def test_default_model_is_in_catalog_and_not_byok():
    default = Settings().default_model
    info = get_model(default)
    assert info is not None
    assert info.byok_only is False


def test_claude_models_are_byok_only():
    for model in list_models():
        if model.provider == "anthropic":
            assert model.byok_only is True


# --- response parsers -----------------------------------------------------


def test_groq_extract_strips_thinking():
    data = {"choices": [{"message": {"content": "<think>hmm</think>SELECT 1"}}]}
    assert groq_extract(data) == "SELECT 1"


def test_groq_extract_raises_on_empty():
    with pytest.raises(ProviderError):
        groq_extract({"choices": []})


def test_google_extract_joins_parts():
    data = {"candidates": [{"content": {"parts": [{"text": "SEL"}, {"text": "ECT 1"}]}}]}
    assert google_extract(data) == "SELECT 1"


def test_anthropic_extract_keeps_only_text_blocks():
    data = {
        "content": [
            {"type": "thinking", "thinking": "x"},
            {"type": "text", "text": "SELECT 1"},
        ]
    }
    assert anthropic_extract(data) == "SELECT 1"


def test_strip_thinking_no_tags():
    assert strip_thinking("SELECT 1") == "SELECT 1"


# --- router ---------------------------------------------------------------


class FakeProvider(Provider):
    def __init__(self, name: str, *, reply: str | None = None, error: Exception | None = None):
        self.name = name
        self.reply = reply
        self.error = error
        self.calls: list[tuple] = []

    async def generate(self, request, *, api_key: str) -> str:
        self.calls.append((request, api_key))
        if self.error is not None:
            raise self.error
        return self.reply


def _patch(monkeypatch, settings: Settings, providers: dict[str, Provider]):
    monkeypatch.setattr(router, "get_settings", lambda: settings)
    monkeypatch.setattr(router, "_PROVIDERS", providers)


def test_primary_success_uses_server_key(monkeypatch):
    settings = Settings(groq_api_key="server-groq", default_model="openai/gpt-oss-120b",
                        fallback_models="")
    groq = FakeProvider("groq", reply="SELECT 1")
    _patch(monkeypatch, settings, {"groq": groq})

    result = asyncio.run(generate("sys", [Message(role="user", content="q")]))

    assert result.text == "SELECT 1"
    assert result.model == "openai/gpt-oss-120b"
    assert result.provider == "groq"
    # Server key was used, not a BYO key.
    assert groq.calls[0][1] == "server-groq"


def test_byo_key_overrides_for_chosen_model(monkeypatch):
    settings = Settings(anthropic_api_key="", default_model="openai/gpt-oss-120b",
                        fallback_models="")
    anthropic = FakeProvider("anthropic", reply="SELECT 2")
    _patch(monkeypatch, settings, {"anthropic": anthropic})

    result = asyncio.run(
        generate("sys", [Message(role="user", content="q")],
                 model="claude-sonnet-4-6", api_key="user-key")
    )

    assert result.provider == "anthropic"
    assert anthropic.calls[0][1] == "user-key"


def test_falls_back_to_next_provider_on_error(monkeypatch):
    settings = Settings(groq_api_key="gk", google_api_key="gg",
                        default_model="openai/gpt-oss-120b",
                        fallback_models="gemini-3.1-flash-lite")
    groq = FakeProvider("groq", error=ProviderError("groq", "boom"))
    google = FakeProvider("google", reply="SELECT 3")
    _patch(monkeypatch, settings, {"groq": groq, "google": google})

    result = asyncio.run(generate("sys", [Message(role="user", content="q")]))

    assert result.model == "gemini-3.1-flash-lite"
    assert result.provider == "google"


def test_raises_when_all_candidates_fail(monkeypatch):
    settings = Settings(groq_api_key="gk", default_model="openai/gpt-oss-120b",
                        fallback_models="")
    groq = FakeProvider("groq", error=ProviderError("groq", "boom"))
    _patch(monkeypatch, settings, {"groq": groq})

    with pytest.raises(AllProvidersFailedError):
        asyncio.run(generate("sys", [Message(role="user", content="q")]))


def test_skips_model_with_no_key(monkeypatch):
    # No groq key and BYO-only fallback with no user key -> nothing usable.
    settings = Settings(groq_api_key="", default_model="openai/gpt-oss-120b",
                        fallback_models="")
    groq = FakeProvider("groq", reply="never")
    _patch(monkeypatch, settings, {"groq": groq})

    with pytest.raises(AllProvidersFailedError):
        asyncio.run(generate("sys", [Message(role="user", content="q")]))
    assert groq.calls == []


# --- /providers endpoint --------------------------------------------------


def test_providers_endpoint_lists_models():
    client = TestClient(app)
    resp = client.get("/providers")
    assert resp.status_code == 200
    body = resp.json()
    assert body["default"]
    ids = {m["id"] for m in body["models"]}
    assert body["default"] in ids
    assert "claude-sonnet-4-6" in ids
