"""Tests for the POST /story HTTP layer (generation mocked)."""

from fastapi.testclient import TestClient

from app import main
from app.story import StoryGenerationError
from app.story.models import (
    ExplanationStep,
    QueryExplanation,
    Story,
    StoryStep,
)

client = TestClient(main.app)


def _fake_story() -> Story:
    return Story(
        title="A Tale",
        context="premise",
        difficulty="beginner",
        elements=["well_locations"],
        skills=["basic_select"],
        steps=[
            StoryStep(
                context="ctx",
                task="find wells",
                hint="use Wells",
                solution="SELECT Well_ID FROM Wells LIMIT 5",
                explanation=QueryExplanation(
                    overview="what it does",
                    steps=[ExplanationStep(sql="SELECT", explanation="cols", key_concept="select")],
                ),
            )
        ],
    )


def test_story_returns_a_lesson(monkeypatch):
    async def fake_generate(mode, elements, skills, difficulty, *, model=None, api_key=None):
        return _fake_story()

    monkeypatch.setattr(main, "generate_story", fake_generate)
    resp = client.post(
        "/story",
        json={
            "mode": "single",
            "elements": ["well_locations"],
            "skills": ["basic_select"],
            "difficulty": "beginner",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "A Tale"
    assert body["steps"][0]["solution"].startswith("SELECT")


def test_missing_selections_is_422():
    resp = client.post("/story", json={"mode": "single", "elements": [], "skills": []})
    assert resp.status_code == 422


def test_generation_failure_is_422(monkeypatch):
    async def fake_generate(mode, elements, skills, difficulty, *, model=None, api_key=None):
        raise StoryGenerationError(["task \"x\": unknown table"])

    monkeypatch.setattr(main, "generate_story", fake_generate)
    resp = client.post(
        "/story",
        json={"mode": "single", "elements": ["well_locations"], "skills": ["basic_select"]},
    )
    assert resp.status_code == 422
