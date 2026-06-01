"""Schema retrieval interface.

A retriever decides which tables go into the prompt for a given question. The
seam exists so we can start simple (send the whole schema) and swap in real
retrieval later without touching the pipeline. ``select`` returns the table
names to include, or ``None`` to mean "use the full schema".
"""

from typing import Protocol


class Retriever(Protocol):
    def select(self, question: str) -> list[str] | None: ...
