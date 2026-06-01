"""Capture the true schema from the .mdb and expose type mappings.

mdb-schema's postgres dialect gives us reliable column types, but it lowercases
every identifier. To keep the original CamelCase names that the rest of the app
uses, we read the real names from each table's mdb-export header and match them
back to the parsed types case-insensitively.
"""

from __future__ import annotations

import json
import re
import subprocess
from dataclasses import asdict, dataclass

from etl.config import DROP_TABLES, MDB_PATH, SCHEMA_JSON


@dataclass
class Column:
    name: str  # original CamelCase, from the export header
    pg_type: str  # as reported by mdb-schema postgres, e.g. "NUMERIC (18, 6)"
    duckdb_type: str  # type we cast to when building Parquet
    access_type: str  # human-facing Access type, for the schema viewer
    not_null: bool


@dataclass
class Relationship:
    parent_table: str
    parent_column: str
    child_table: str
    child_column: str


@dataclass
class Table:
    name: str
    columns: list[Column]


# Postgres type (upper-cased, no length) -> DuckDB cast target. NUMERIC values
# are groundwater measurements and coordinates that fit comfortably in a double,
# which is far lighter in the browser than DECIMAL.
_DUCKDB_TYPE = {
    "INTEGER": "INTEGER",
    "NUMERIC": "DOUBLE",
    "VARCHAR": "VARCHAR",
    "TEXT": "VARCHAR",
    "BOOLEAN": "BOOLEAN",
    "TIMESTAMP": "TIMESTAMP",
    "UUID": "UUID",
    "SERIAL": "INTEGER",
}


def _access_type(base: str, length: str | None, precision: str | None) -> str:
    """Render the human-facing Access type shown in the schema viewer."""
    match base:
        case "INTEGER" | "SERIAL":
            return "Long Integer"
        case "NUMERIC":
            return f"Numeric ({precision})" if precision else "Numeric"
        case "VARCHAR":
            return f"Text ({length})" if length else "Text"
        case "TEXT":
            return "Memo"
        case "BOOLEAN":
            return "Boolean"
        case "TIMESTAMP":
            return "DateTime"
        case "UUID":
            return "GUID"
        case _:
            return base.title()


def _classify(pg_type: str) -> tuple[str, str]:
    """Map a raw postgres type string to (duckdb_type, access_type)."""
    base = pg_type.split("(")[0].split()[0].upper()
    length = None
    precision = None
    inside = re.search(r"\(([^)]*)\)", pg_type)
    if inside:
        if "," in inside.group(1):
            precision = inside.group(1).strip()
        else:
            length = inside.group(1).strip()
    return _DUCKDB_TYPE.get(base, "VARCHAR"), _access_type(base, length, precision)


def _run(args: list[str]) -> str:
    return subprocess.run(args, capture_output=True, text=True, check=True).stdout


def _real_table_names() -> dict[str, str]:
    """Map lowercased table name -> original-case name from mdb-tables."""
    names = _run(["mdb-tables", "-1", str(MDB_PATH)]).split()
    return {n.lower(): n for n in names}


def _export_header(table: str) -> list[str]:
    """First (header) line of an mdb-export, giving real column names."""
    proc = subprocess.Popen(
        ["mdb-export", str(MDB_PATH), table],
        stdout=subprocess.PIPE,
        text=True,
    )
    assert proc.stdout is not None
    header = proc.stdout.readline().strip()
    proc.stdout.close()
    proc.terminate()
    return header.split(",")


def _parse_schema_blocks() -> dict[str, dict[str, tuple[str, bool]]]:
    """Parse mdb-schema postgres output into {table: {col: (pg_type, not_null)}}."""
    text = _run(["mdb-schema", str(MDB_PATH), "postgres"])
    tables: dict[str, dict[str, tuple[str, bool]]] = {}
    current: str | None = None
    for line in text.splitlines():
        create = re.match(r'CREATE TABLE IF NOT EXISTS "([^"]+)"', line)
        if create:
            current = create.group(1)
            tables[current] = {}
            continue
        if current is None:
            continue
        if line.strip() == ");":
            current = None
            continue
        col = re.match(r'\s*"([^"]+)"\s+(.+?),?\s*$', line)
        if col:
            col_type = col.group(2)
            not_null = "NOT NULL" in col_type
            col_type = col_type.replace("NOT NULL", "").strip()
            tables[current][col.group(1)] = (col_type, not_null)
    return tables


def _parse_relationships() -> list[Relationship]:
    text = _run(["mdb-schema", str(MDB_PATH), "postgres"])
    rels: list[Relationship] = []
    pattern = re.compile(r'Relationship from "([^"]+)" \("([^"]+)"\) to "([^"]+)"\("([^"]+)"\)')
    for match in pattern.finditer(text):
        parent, parent_col, child, child_col = match.groups()
        rels.append(Relationship(parent, parent_col, child, child_col))
    return rels


def build_schema() -> tuple[list[Table], list[Relationship]]:
    """Assemble the canonical schema: real names + types, minus dropped tables."""
    real_names = _real_table_names()
    blocks = _parse_schema_blocks()
    tables: list[Table] = []

    for lower_name, cols in blocks.items():
        real_name = real_names.get(lower_name, lower_name)
        if real_name in DROP_TABLES:
            continue
        header = _export_header(real_name)
        columns: list[Column] = []
        for col_name in header:
            pg_type, not_null = cols.get(col_name.lower(), ("VARCHAR", False))
            duckdb_type, access_type = _classify(pg_type)
            columns.append(
                Column(
                    name=col_name,
                    pg_type=pg_type,
                    duckdb_type=duckdb_type,
                    access_type=access_type,
                    not_null=not_null,
                )
            )
        tables.append(Table(name=real_name, columns=columns))

    tables.sort(key=lambda t: t.name)

    # Relationship identifiers come back lowercased from the postgres dialect.
    # Restore the real column casing so schema.json is fully canonical.
    real_cols = {t.name: {c.name.lower(): c.name for c in t.columns} for t in tables}
    relationships: list[Relationship] = []
    for r in _parse_relationships():
        if r.parent_table in DROP_TABLES or r.child_table in DROP_TABLES:
            continue
        relationships.append(
            Relationship(
                parent_table=r.parent_table,
                parent_column=real_cols.get(r.parent_table, {}).get(
                    r.parent_column.lower(), r.parent_column
                ),
                child_table=r.child_table,
                child_column=real_cols.get(r.child_table, {}).get(
                    r.child_column.lower(), r.child_column
                ),
            )
        )
    return tables, relationships


def write_schema_json() -> None:
    tables, relationships = build_schema()
    payload = {
        "tables": [asdict(t) for t in tables],
        "relationships": [asdict(r) for r in relationships],
    }
    SCHEMA_JSON.write_text(json.dumps(payload, indent=2) + "\n")


def load_schema() -> dict:
    return json.loads(SCHEMA_JSON.read_text())
