"""The default retriever: send the entire schema.

The full schema renders to roughly 3K tokens, which is small enough to include
wholesale and avoids retrieval ever dropping a table the query needs. We keep the
retriever seam anyway so swapping in the keyword retriever (or a real embedding
one) is a one-line change in the pipeline.
"""


class WholeSchemaRetriever:
    def select(self, question: str) -> list[str] | None:
        return None
