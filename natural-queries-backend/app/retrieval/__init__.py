"""Schema retrieval: choose which tables to put in the prompt."""

from app.retrieval.base import Retriever
from app.retrieval.keyword import KeywordRetriever
from app.retrieval.whole import WholeSchemaRetriever


def get_retriever(mode: str = "whole") -> Retriever:
    """Return the retriever for a config mode. Unknown modes fall back to whole."""
    if mode == "keyword":
        return KeywordRetriever()
    return WholeSchemaRetriever()


__all__ = ["KeywordRetriever", "Retriever", "WholeSchemaRetriever", "get_retriever"]
