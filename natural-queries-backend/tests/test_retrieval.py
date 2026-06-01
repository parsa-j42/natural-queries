"""Tests for schema retrieval."""

from app.retrieval import KeywordRetriever, WholeSchemaRetriever


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
