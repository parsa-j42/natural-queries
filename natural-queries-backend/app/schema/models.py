"""Typed representation of the well-data schema.

These models are the in-memory shape the rest of the backend reasons over: the
generation prompt is built from them, and the validator checks candidate SQL
against them. They are populated by ``loader.py`` from the canonical
``schema.json`` plus the curated descriptions in ``descriptions.py``.
"""

from pydantic import BaseModel


class Column(BaseModel):
    name: str
    type: str  # DuckDB type, e.g. INTEGER, VARCHAR, DOUBLE, TIMESTAMP, BOOLEAN
    nullable: bool
    description: str | None = None


class ForeignKey(BaseModel):
    """A column in this table that points at another table's key."""

    column: str
    references_table: str
    references_column: str


class Table(BaseModel):
    name: str
    description: str | None = None
    primary_key: str | None = None
    columns: list[Column]
    foreign_keys: list[ForeignKey] = []

    def column(self, name: str) -> Column | None:
        return next((c for c in self.columns if c.name == name), None)

    @property
    def column_names(self) -> set[str]:
        return {c.name for c in self.columns}


class Example(BaseModel):
    """A few-shot natural-language question paired with its target SQL."""

    question: str
    sql: str


class Schema(BaseModel):
    tables: list[Table]
    examples: list[Example] = []

    def table(self, name: str) -> Table | None:
        return next((t for t in self.tables if t.name == name), None)

    @property
    def table_names(self) -> set[str]:
        return {t.name for t in self.tables}
