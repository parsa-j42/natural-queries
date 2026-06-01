"""Story-mode response shapes.

Field names match the frontend's TypeScript types in
`src/API/StoryModeAPI.ts` exactly (snake_case, including `overall_context`,
`learning_objectives`, `key_concept`) so the UI consumes the response with no
mapping.
"""

from typing import Literal

from pydantic import BaseModel

Difficulty = Literal["beginner", "intermediate", "advanced"]


class ExplanationStep(BaseModel):
    sql: str
    explanation: str
    key_concept: str | None = None


class QueryExplanation(BaseModel):
    overview: str
    steps: list[ExplanationStep]


class StoryStep(BaseModel):
    context: str
    task: str
    hint: str
    solution: str  # DuckDB SQL, validated before the story is returned
    explanation: QueryExplanation


class Story(BaseModel):
    title: str
    context: str
    difficulty: Difficulty
    elements: list[str]
    skills: list[str]
    steps: list[StoryStep]


class Chapter(BaseModel):
    title: str
    introduction: str
    learning_objectives: list[str]
    steps: list[StoryStep]
    conclusion: str


class MultiChapterStory(BaseModel):
    title: str
    overall_context: str
    difficulty: Difficulty
    elements: list[str]
    skills: list[str]
    chapters: list[Chapter]
