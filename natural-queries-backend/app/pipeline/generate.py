"""The agentic generate -> validate -> repair loop.

Retrieve the relevant schema, ask the model for a JSON answer (SQL plus
explanation), validate the SQL, and on failure feed the exact error back and let
the model try again, bounded by ``max_attempts``. Only SQL that passes
validation is returned.
"""

from app.cache import LRUCache
from app.jsonutil import JsonParseError, extract_json_object
from app.pipeline.models import Explanation, GenerationOutput
from app.pipeline.prompts import build_system_prompt, repair_prompt
from app.pipeline.validate import validate_sql
from app.providers import Message
from app.providers import generate as provider_generate
from app.retrieval import Retriever, WholeSchemaRetriever
from app.schema import render_schema


class ParseError(ValueError):
    """The model's reply was not the JSON object we asked for."""


class GenerationFailedError(RuntimeError):
    """No attempt produced valid SQL within the retry budget."""

    def __init__(self, last_error: str):
        self.last_error = last_error
        super().__init__(f"could not generate valid SQL: {last_error}")


def _parse_candidate(text: str) -> tuple[str, Explanation]:
    try:
        data = extract_json_object(text)
    except JsonParseError as exc:
        raise ParseError(str(exc)) from exc

    sql = data.get("sql")
    if not isinstance(sql, str) or not sql.strip():
        raise ParseError("the JSON had no 'sql' string")

    # Explanation fields are best-effort: missing or malformed parts default to
    # empty rather than failing the whole generation.
    explanation = Explanation.model_validate(
        {
            "reasoning": data.get("reasoning") or [],
            "sqlBreakdown": data.get("sqlBreakdown") or [],
            "concepts": data.get("concepts") or [],
        }
    )
    return sql.strip(), explanation


_RESULT_CACHE: LRUCache[GenerationOutput] = LRUCache(256)


def _cache_key(question: str, model: str | None) -> str:
    # Normalize whitespace and case so trivially different phrasings of the same
    # question share a cache entry.
    return f"{model or 'default'}\n{' '.join(question.split()).lower()}"


async def generate_sql(
    question: str,
    *,
    model: str | None = None,
    api_key: str | None = None,
    max_attempts: int = 3,
    max_tokens: int = 2048,
    use_cache: bool = False,
    retriever: Retriever | None = None,
) -> GenerationOutput:
    key = _cache_key(question, model)
    if use_cache:
        cached = _RESULT_CACHE.get(key)
        if cached is not None:
            return cached

    retriever = retriever or WholeSchemaRetriever()
    schema_text = render_schema(retriever.select(question))
    system = build_system_prompt(schema_text)

    messages = [Message(role="user", content=question)]
    last_error = "no attempts were made"

    for attempt in range(1, max_attempts + 1):
        result = await provider_generate(
            system, messages, model=model, api_key=api_key, max_tokens=max_tokens
        )

        try:
            sql, explanation = _parse_candidate(result.text)
        except ParseError as exc:
            last_error = str(exc)
            messages.append(Message(role="assistant", content=result.text))
            messages.append(
                Message(role="user", content=repair_prompt(f"Your reply was not valid JSON: {exc}"))
            )
            continue

        validation = validate_sql(sql)
        if validation.ok:
            output = GenerationOutput(
                sql=sql,
                explanation=explanation,
                model=result.model,
                provider=result.provider,
                attempts=attempt,
            )
            if use_cache:
                _RESULT_CACHE.put(key, output)
            return output

        last_error = validation.error or "unknown validation error"
        messages.append(Message(role="assistant", content=result.text))
        messages.append(Message(role="user", content=repair_prompt(last_error)))

    raise GenerationFailedError(last_error)
