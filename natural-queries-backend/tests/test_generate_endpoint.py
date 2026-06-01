"""Tests for the POST /generate HTTP layer (pipeline mocked)."""

from fastapi.testclient import TestClient

from app import main
from app.pipeline import GenerationFailedError
from app.pipeline.models import Explanation, GenerationOutput, SqlBreakdownItem

client = TestClient(main.app)


def _fake_output() -> GenerationOutput:
    return GenerationOutput(
        sql="SELECT Well_ID FROM Wells LIMIT 10",
        explanation=Explanation(
            reasoning=["pick the id"],
            sqlBreakdown=[SqlBreakdownItem(part="SELECT", explanation="columns")],
            concepts=["projection"],
        ),
        model="fake-model",
        provider="fake",
        attempts=1,
    )


def test_generate_returns_sql_and_explanation(monkeypatch):
    async def fake_generate(question, *, model=None, api_key=None, **kwargs):
        return _fake_output()

    monkeypatch.setattr(main, "generate_sql", fake_generate)
    resp = client.post("/generate", json={"question": "show wells"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["sql"].startswith("SELECT")
    assert body["explanation"]["sqlBreakdown"][0]["part"] == "SELECT"


def test_generate_passes_model_and_byo_key(monkeypatch):
    seen = {}

    async def fake_generate(question, *, model=None, api_key=None, **kwargs):
        seen["model"] = model
        seen["api_key"] = api_key
        return _fake_output()

    monkeypatch.setattr(main, "generate_sql", fake_generate)
    resp = client.post(
        "/generate",
        json={"question": "show wells", "model": "claude-sonnet-4-6", "apiKey": "user-key"},
    )
    assert resp.status_code == 200
    assert seen == {"model": "claude-sonnet-4-6", "api_key": "user-key"}


def test_empty_question_is_422():
    resp = client.post("/generate", json={"question": "   "})
    assert resp.status_code == 422


def test_generation_failure_is_422(monkeypatch):
    async def fake_generate(question, *, model=None, api_key=None, **kwargs):
        raise GenerationFailedError("unknown column: Foo")

    monkeypatch.setattr(main, "generate_sql", fake_generate)
    resp = client.post("/generate", json={"question": "nonsense"})
    assert resp.status_code == 422
    assert "unknown column" in resp.json()["detail"]
