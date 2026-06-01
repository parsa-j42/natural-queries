"""Load the canonical schema and render it for prompts.

``schema.json`` (a copy of the ETL output, see ``etl/schema.json``) is the
structural source of truth. We merge it with the curated descriptions, primary
keys and examples from ``descriptions.py`` into typed ``Schema`` models, then
expose helpers to render a compact schema description for the LLM prompt.

If the ETL ever regenerates ``etl/schema.json``, copy it over the one in this
package. The underlying Access database is static, so in practice this is a
one-time copy.
"""

import json
from functools import lru_cache
from importlib import resources

from app.schema.descriptions import (
    COLUMN_DESCRIPTIONS,
    EXAMPLES,
    PRIMARY_KEYS,
    SUPPLEMENTAL_FOREIGN_KEYS,
    TABLE_DESCRIPTIONS,
)
from app.schema.models import Column, Example, ForeignKey, Schema, Table


def _load_raw() -> dict:
    """Read the packaged schema.json as a dict."""
    with resources.files("app.schema").joinpath("schema.json").open(encoding="utf-8") as f:
        return json.load(f)


def _build_schema() -> Schema:
    raw = _load_raw()

    # Group the flat relationship list by the child (referencing) table so each
    # table can carry its own foreign keys, then add the curated logical FKs that
    # Access never formalized. Dedupe so a key defined in both places appears once.
    fks_by_table: dict[str, list[ForeignKey]] = {}
    seen: set[tuple[str, str]] = set()  # (child_table, child_column)

    def add_fk(table: str, column: str, ref_table: str, ref_column: str) -> None:
        if (table, column) in seen:
            return
        seen.add((table, column))
        fks_by_table.setdefault(table, []).append(
            ForeignKey(column=column, references_table=ref_table, references_column=ref_column)
        )

    for rel in raw.get("relationships", []):
        add_fk(rel["child_table"], rel["child_column"], rel["parent_table"], rel["parent_column"])
    for table, fks in SUPPLEMENTAL_FOREIGN_KEYS.items():
        for column, ref_table, ref_column in fks:
            add_fk(table, column, ref_table, ref_column)

    tables: list[Table] = []
    for raw_table in raw["tables"]:
        name = raw_table["name"]
        col_descs = COLUMN_DESCRIPTIONS.get(name, {})
        columns = [
            Column(
                name=col["name"],
                type=col["duckdb_type"],
                nullable=not col.get("not_null", False),
                description=col_descs.get(col["name"]),
            )
            for col in raw_table["columns"]
        ]
        tables.append(
            Table(
                name=name,
                description=TABLE_DESCRIPTIONS.get(name),
                primary_key=PRIMARY_KEYS.get(name),
                columns=columns,
                foreign_keys=fks_by_table.get(name, []),
            )
        )

    examples = [Example(question=e["question"], sql=e["sql"]) for e in EXAMPLES]
    return Schema(tables=tables, examples=examples)


@lru_cache
def get_schema() -> Schema:
    """Return the merged schema, parsed once and cached."""
    return _build_schema()


def _render_table(table: Table) -> str:
    lines = [f"Table {table.name}" + (f"  -- {table.description}" if table.description else "")]
    for col in table.columns:
        flags = []
        if table.primary_key == col.name:
            flags.append("PK")
        if not col.nullable:
            flags.append("NOT NULL")
        flag_str = (" " + " ".join(flags)) if flags else ""
        desc = f"  -- {col.description}" if col.description else ""
        lines.append(f"  {col.name} {col.type}{flag_str}{desc}")
    for fk in table.foreign_keys:
        lines.append(
            f"  FK {fk.column} -> {fk.references_table}.{fk.references_column}"
        )
    return "\n".join(lines)


def render_schema(table_names: list[str] | None = None, *, include_examples: bool = True) -> str:
    """Render the schema (or a subset of tables) as compact text for a prompt.

    ``table_names`` limits the output to those tables (used by retrieval in
    Phase 3c); ``None`` renders everything. Examples always reference real
    tables, so they are appended whole regardless of the subset.
    """
    schema = get_schema()
    if table_names is None:
        tables = schema.tables
    else:
        wanted = set(table_names)
        tables = [t for t in schema.tables if t.name in wanted]

    blocks = [_render_table(t) for t in tables]
    rendered = "\n\n".join(blocks)

    if include_examples and schema.examples:
        example_blocks = [
            f"-- Q: {ex.question}\n{ex.sql}" for ex in schema.examples
        ]
        rendered += "\n\n-- Example questions and the SQL that answers them:\n\n"
        rendered += "\n\n".join(example_blocks)

    return rendered
