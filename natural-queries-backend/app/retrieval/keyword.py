"""A lightweight keyword retriever.

Scores each table by how many question words appear in its name, description, or
column names/descriptions, keeps the best few, then pulls in any tables those
connect to by foreign key so joins still work. Returns ``None`` (meaning "use the
whole schema") when nothing matches, so a vague question never ends up with an
empty prompt.

This is intentionally simple. The whole-schema retriever is the default while the
schema is small; this exists for when prompts grow or a larger schema is added.
"""

import re
from functools import lru_cache

from app.schema import Schema, get_schema

# Common words that carry no schema signal.
_STOPWORDS = {
    "the", "a", "an", "of", "in", "on", "for", "to", "and", "or", "by", "with",
    "show", "me", "list", "find", "get", "give", "all", "how", "many", "much",
    "what", "which", "where", "is", "are", "was", "were", "count", "number",
    "each", "per", "from", "that", "have", "has", "do", "does", "their",
}

_TOKEN_RE = re.compile(r"[A-Z]+(?=[A-Z][a-z])|[A-Z]?[a-z]+|[A-Z]+|[0-9]+")


def _tokenize(text: str) -> set[str]:
    """Split into lowercase word tokens, breaking CamelCase and snake_case."""
    return {t.lower() for t in _TOKEN_RE.findall(text)}


@lru_cache
def _table_tokens() -> dict[str, set[str]]:
    """Bag of tokens describing each table (name, description, columns)."""
    schema = get_schema()
    index: dict[str, set[str]] = {}
    for table in schema.tables:
        tokens = _tokenize(table.name)
        if table.description:
            tokens |= _tokenize(table.description)
        for col in table.columns:
            tokens |= _tokenize(col.name)
            if col.description:
                tokens |= _tokenize(col.description)
        index[table.name] = tokens - _STOPWORDS
    return index


def _fk_neighbors(schema: Schema, tables: set[str]) -> set[str]:
    """Tables reachable by one foreign-key hop from the given set, either way."""
    neighbors: set[str] = set()
    for table in schema.tables:
        for fk in table.foreign_keys:
            if table.name in tables:
                neighbors.add(fk.references_table)
            if fk.references_table in tables:
                neighbors.add(table.name)
    return neighbors


class KeywordRetriever:
    def __init__(self, *, top_k: int = 6):
        self.top_k = top_k

    def select(self, question: str) -> list[str] | None:
        question_tokens = _tokenize(question) - _STOPWORDS
        if not question_tokens:
            return None

        index = _table_tokens()
        scored = [
            (name, len(question_tokens & tokens))
            for name, tokens in index.items()
        ]
        hits = [(name, score) for name, score in scored if score > 0]
        if not hits:
            return None

        hits.sort(key=lambda item: item[1], reverse=True)
        selected = {name for name, _ in hits[: self.top_k]}
        selected |= _fk_neighbors(get_schema(), selected)
        return sorted(selected)
