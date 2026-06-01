"""Response shapes for the generation pipeline.

The explanation fields mirror what the Playground UI already renders
(``reasoning``, ``sqlBreakdown``, ``concepts``), so the frontend can drop the
mock and use this as-is.
"""

from pydantic import BaseModel


class SqlBreakdownItem(BaseModel):
    part: str
    explanation: str


class Explanation(BaseModel):
    reasoning: list[str] = []
    sqlBreakdown: list[SqlBreakdownItem] = []
    concepts: list[str] = []


class GenerationOutput(BaseModel):
    sql: str
    explanation: Explanation
    model: str  # provider model id that produced the answer
    provider: str
    attempts: int  # how many LLM round-trips it took to pass validation
