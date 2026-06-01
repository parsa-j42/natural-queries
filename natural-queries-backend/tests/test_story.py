"""Tests for Story-mode generation, validation, and caching."""

import asyncio
import json

import pytest

from app.providers.router import GenerationResult
from app.story import StoryGenerationError, generate_story
from app.story import cache as story_cache
from app.story import generate as story_gen
from app.story.models import MultiChapterStory, Story


def _step(solution: str) -> dict:
    return {
        "context": "ctx",
        "task": "find some wells",
        "hint": "use the Wells table",
        "solution": solution,
        "explanation": {
            "overview": "what it does",
            "steps": [{"sql": "SELECT", "explanation": "pick columns", "key_concept": "select"}],
        },
    }


def _single(solution: str) -> str:
    return json.dumps({"title": "A Tale", "context": "premise", "steps": [_step(solution)]})


def _multi(solution: str) -> str:
    return json.dumps(
        {
            "title": "A Saga",
            "overall_context": "premise",
            "chapters": [
                {
                    "title": "Chapter 1",
                    "introduction": "intro",
                    "learning_objectives": ["learn joins"],
                    "steps": [_step(solution)],
                    "conclusion": "wrap up",
                }
            ],
        }
    )


class FakeGenerate:
    def __init__(self, *replies: str):
        self.replies = list(replies)
        self.calls = 0

    async def __call__(self, system, messages, *, model=None, api_key=None, **kwargs):
        text = self.replies[min(self.calls, len(self.replies) - 1)]
        self.calls += 1
        return GenerationResult(text=text, model="fake-model", provider="fake")


@pytest.fixture(autouse=True)
def _clear_cache():
    story_cache.clear()
    yield
    story_cache.clear()


def _run(monkeypatch, fake, *, mode="single", **kwargs):
    monkeypatch.setattr(story_gen, "provider_generate", fake)
    return asyncio.run(
        generate_story(mode, ["well_locations"], ["basic_select"], "beginner", **kwargs)
    )


def test_single_story_generates_and_injects_selections(monkeypatch):
    fake = FakeGenerate(_single("SELECT Well_ID, Township FROM Wells LIMIT 5"))
    story = _run(monkeypatch, fake)
    assert isinstance(story, Story)
    assert story.difficulty == "beginner"
    assert story.elements == ["well_locations"]
    assert story.skills == ["basic_select"]
    assert story.steps[0].solution.startswith("SELECT")


def test_multi_story_generates(monkeypatch):
    fake = FakeGenerate(_multi("SELECT Well_ID FROM Wells LIMIT 5"))
    story = _run(monkeypatch, fake, mode="multi")
    assert isinstance(story, MultiChapterStory)
    assert len(story.chapters) == 1
    assert story.chapters[0].steps[0].solution.startswith("SELECT")


def test_invalid_solution_is_repaired(monkeypatch):
    fake = FakeGenerate(
        _single("SELECT * FROM Aquifers"),  # unknown table
        _single("SELECT Well_ID FROM Wells LIMIT 5"),  # valid
    )
    story = _run(monkeypatch, fake)
    assert isinstance(story, Story)
    assert fake.calls == 2


def test_gives_up_after_max_attempts(monkeypatch):
    fake = FakeGenerate(_single("SELECT * FROM Aquifers"))
    monkeypatch.setattr(story_gen, "provider_generate", fake)
    with pytest.raises(StoryGenerationError):
        asyncio.run(
            generate_story(
                "single", ["well_locations"], ["basic_select"], "beginner", max_attempts=2
            )
        )
    assert fake.calls == 2


def test_cache_returns_same_story_without_regenerating(monkeypatch):
    fake = FakeGenerate(_single("SELECT Well_ID FROM Wells LIMIT 5"))
    first = _run(monkeypatch, fake)
    second = _run(monkeypatch, fake)
    assert first is second
    assert fake.calls == 1  # second call served from cache
