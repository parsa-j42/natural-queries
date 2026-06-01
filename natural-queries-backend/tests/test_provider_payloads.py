"""Verify each adapter builds the request its provider's API expects.

We patch the shared post_json so no HTTP happens, capture the payload/headers/url
the adapter produced, and assert on their shape.
"""

import asyncio

import pytest

from app.providers import anthropic as anthropic_mod
from app.providers import base as base_mod
from app.providers import google as google_mod
from app.providers import groq as groq_mod
from app.providers.base import GenerationRequest, Message

REQUEST = GenerationRequest(
    system="SYSTEM PROMPT",
    messages=[Message(role="user", content="hi"), Message(role="assistant", content="prev")],
    model="the-model",
    temperature=0.0,
    max_tokens=123,
)

CANNED = {
    "groq": {"choices": [{"message": {"content": "SELECT 1"}}]},
    "google": {"candidates": [{"content": {"parts": [{"text": "SELECT 1"}]}}]},
    "anthropic": {"content": [{"type": "text", "text": "SELECT 1"}]},
}


def _capture(monkeypatch, module, provider_name):
    captured = {}

    async def fake_post(provider, url, *, headers, payload):
        captured.update(provider=provider, url=url, headers=headers, payload=payload)
        return CANNED[provider_name]

    monkeypatch.setattr(module, "post_json", fake_post)
    return captured


def test_groq_payload(monkeypatch):
    captured = _capture(monkeypatch, groq_mod, "groq")
    text = asyncio.run(groq_mod.GroqProvider().generate(REQUEST, api_key="key"))

    assert text == "SELECT 1"
    payload = captured["payload"]
    assert payload["model"] == "the-model"
    assert payload["max_tokens"] == 123
    # First message is the system prompt, then the chat turns.
    assert payload["messages"][0] == {"role": "system", "content": "SYSTEM PROMPT"}
    assert payload["messages"][1]["role"] == "user"
    assert captured["headers"]["Authorization"] == "Bearer key"


def test_google_payload_maps_roles_and_system(monkeypatch):
    captured = _capture(monkeypatch, google_mod, "google")
    asyncio.run(google_mod.GoogleProvider().generate(REQUEST, api_key="key"))

    payload = captured["payload"]
    assert payload["system_instruction"]["parts"][0]["text"] == "SYSTEM PROMPT"
    roles = [c["role"] for c in payload["contents"]]
    assert roles == ["user", "model"]  # assistant maps to "model" for Gemini
    assert payload["generationConfig"]["maxOutputTokens"] == 123
    assert "the-model:generateContent" in captured["url"]
    assert captured["headers"]["x-goog-api-key"] == "key"


def test_anthropic_payload_caches_system(monkeypatch):
    captured = _capture(monkeypatch, anthropic_mod, "anthropic")
    asyncio.run(anthropic_mod.AnthropicProvider().generate(REQUEST, api_key="key"))

    payload = captured["payload"]
    system_block = payload["system"][0]
    assert system_block["text"] == "SYSTEM PROMPT"
    assert system_block["cache_control"] == {"type": "ephemeral"}
    assert payload["max_tokens"] == 123
    assert captured["headers"]["x-api-key"] == "key"
    assert captured["headers"]["anthropic-version"]


def test_shared_client_is_reused_and_closeable():
    asyncio.run(base_mod.close_client())
    first = base_mod.get_client()
    assert base_mod.get_client() is first  # reused, not recreated
    asyncio.run(base_mod.close_client())
    assert base_mod._client is None


@pytest.mark.parametrize("module", [groq_mod, google_mod, anthropic_mod])
def test_adapters_return_extracted_text(monkeypatch, module):
    name = module.__name__.rsplit(".", 1)[-1]
    _capture(monkeypatch, module, name)
    provider_cls = {
        "groq": groq_mod.GroqProvider,
        "google": google_mod.GoogleProvider,
        "anthropic": anthropic_mod.AnthropicProvider,
    }[name]
    text = asyncio.run(provider_cls().generate(REQUEST, api_key="k"))
    assert text == "SELECT 1"
