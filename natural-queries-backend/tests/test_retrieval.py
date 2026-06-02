"""Tests for schema retrieval."""

from app.retrieval import (
    KeywordRetriever,
    WholeSchemaRetriever,
    get_retriever,
)


def test_whole_schema_retriever_returns_none():
    assert WholeSchemaRetriever().select("anything") is None


def test_keyword_retriever_finds_relevant_tables_and_fk_neighbors():
    selected = KeywordRetriever().select("show me wells with the highest iron content")
    assert selected is not None
    assert "Wells" in selected
    assert "Analysis_Items" in selected
    # Pulled in by foreign key so the join is possible.
    assert "Chemical_Analysis" in selected


def test_keyword_retriever_falls_back_to_whole_schema_when_no_match():
    assert KeywordRetriever().select("zzz qqq xyz") is None


def test_get_retriever_selects_by_mode():
    assert isinstance(get_retriever("keyword"), KeywordRetriever)
    assert isinstance(get_retriever("whole"), WholeSchemaRetriever)
    # Unknown modes fall back to the safe default.
    assert isinstance(get_retriever("nonsense"), WholeSchemaRetriever)
