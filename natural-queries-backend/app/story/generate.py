"""Generate Story-mode lessons, validating every solution as runnable SQL.

The model returns a single JSON object for the whole lesson. We attach the
selections the model was not asked to echo (difficulty, elements, skills), parse
it into the typed models, then validate every step's solution with the same
checker the Playground uses. If any solution is bad, the specific errors go back
to the model in a bounded repair loop, so the lesson the student gets is always
executable.
"""

from typing import Literal

from pydantic import ValidationError

from app.jsonutil import JsonParseError, extract_json_object
from app.pipeline.validate import validate_sql
from app.providers import Message
from app.providers import generate as provider_generate
from app.schema import render_schema
from app.story import cache as story_cache
from app.story.models import Difficulty, MultiChapterStory, Story, StoryStep
from app.story.prompts import (
    build_multi_user,
    build_single_user,
    build_system_prompt,
    repair_user,
)

Mode = Literal["single", "multi"]


class StoryGenerationError(RuntimeError):
    """No attempt produced a lesson with all-valid solutions."""

    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__("could not generate a valid story: " + "; ".join(errors))


def _steps_of(story: Story | MultiChapterStory) -> list[StoryStep]:
    if isinstance(story, Story):
        return list(story.steps)
    return [step for chapter in story.chapters for step in chapter.steps]


def _validate_solutions(story: Story | MultiChapterStory) -> list[str]:
    """Return a list of human-readable errors, one per failing solution."""
    errors = []
    for step in _steps_of(story):
        result = validate_sql(step.solution)
        if not result.ok:
            label = step.task[:60].strip()
            errors.append(f'task "{label}": {result.error}')
    return errors


async def generate_story(
    mode: Mode,
    elements: list[str],
    skills: list[str],
    difficulty: Difficulty,
    *,
    model: str | None = None,
    api_key: str | None = None,
    max_attempts: int = 3,
    use_cache: bool = True,
) -> Story | MultiChapterStory:
    key = story_cache.make_key(mode, elements, skills, difficulty, model)
    if use_cache:
        cached = story_cache.get(key)
        if cached is not None:
            return cached

    schema_text = render_schema()
    system = build_system_prompt(schema_text)
    user = (
        build_single_user(elements, skills, difficulty)
        if mode == "single"
        else build_multi_user(elements, skills, difficulty)
    )
    messages = [Message(role="user", content=user)]
    # Lessons are large, especially multi-chapter ones, so allow plenty of room.
    max_tokens = 4096 if mode == "single" else 6144
    last_errors = ["no attempts were made"]

    for _ in range(max_attempts):
        result = await provider_generate(
            system, messages, model=model, api_key=api_key, max_tokens=max_tokens
        )

        try:
            data = extract_json_object(result.text)
        except JsonParseError as exc:
            last_errors = [str(exc)]
            messages += _retry(result.text, last_errors)
            continue

        # The model is not asked to repeat these, so we set them ourselves.
        data["difficulty"] = difficulty
        data["elements"] = elements
        data["skills"] = skills

        try:
            story: Story | MultiChapterStory = (
                Story.model_validate(data)
                if mode == "single"
                else MultiChapterStory.model_validate(data)
            )
        except ValidationError as exc:
            last_errors = [f"the JSON did not match the expected shape: {exc.error_count()} issues"]
            messages += _retry(result.text, last_errors)
            continue

        errors = _validate_solutions(story)
        if not errors:
            story_cache.put(key, story)
            return story

        last_errors = errors
        messages += _retry(result.text, errors)

    raise StoryGenerationError(last_errors)


def _retry(assistant_text: str, errors: list[str]) -> list[Message]:
    return [
        Message(role="assistant", content=assistant_text),
        Message(role="user", content=repair_user(errors)),
    ]
