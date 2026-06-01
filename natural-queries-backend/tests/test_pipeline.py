"""Tests for the generate -> validate -> repair loop, with a fake provider."""

import asyncio
import json

import pytest

from app.pipeline import GenerationFailedError, generate_sql
from app.pipeline import generate as generate_mod
from app.providers.router import GenerationResult


def _reply(sql: str) -> str:
    return json.dumps(
        {
            "sql": sql,
            "reasoning": ["step one"],
            "sqlBreakdown": [{"part": "SELECT", "explanation": "pick columns"}],
            "concepts": ["projection"],
        }
    )


class FakeGenerate:
    """Stand-in for app.providers.generate that replays canned replies."""

    def __init__(self, *replies: str):
        self.replies = list(replies)
        self.calls = 0

    async def __call__(self, system, messages, *, model=None, api_key=None, **kwargs):
        text = self.replies[min(self.calls, len(self.replies) - 1)]
        self.calls += 1
        return GenerationResult(text=text, model="fake-model", provider="fake")


def _run(monkeypatch, fake, **kwargs):
    monkeypatch.setattr(generate_mod, "provider_generate", fake)
    return asyncio.run(generate_sql("show me the wells", **kwargs))


def test_valid_first_try(monkeypatch):
    fake = FakeGenerate(_reply("SELECT Well_ID FROM Wells LIMIT 10"))
    out = _run(monkeypatch, fake)
    assert out.attempts == 1
    assert "Wells" in out.sql
    assert out.explanation.concepts == ["projection"]


def test_repairs_invalid_sql_then_succeeds(monkeypatch):
    fake = FakeGenerate(
        _reply("SELECT * FROM Aquifers"),  # unknown table, fails validation
        _reply("SELECT Well_ID FROM Wells LIMIT 10"),  # valid
    )
    out = _run(monkeypatch, fake)
    assert out.attempts == 2


def test_recovers_from_non_json_reply(monkeypatch):
    fake = FakeGenerate(
        "Sure! Here is your query.",  # not JSON
        _reply("SELECT Well_ID FROM Wells LIMIT 10"),
    )
    out = _run(monkeypatch, fake)
    assert out.attempts == 2


def test_gives_up_after_max_attempts(monkeypatch):
    fake = FakeGenerate(_reply("SELECT * FROM Aquifers"))  # always invalid
    monkeypatch.setattr(generate_mod, "provider_generate", fake)
    with pytest.raises(GenerationFailedError):
        asyncio.run(generate_sql("q", max_attempts=2))
    assert fake.calls == 2
