"""Validate candidate SQL before we ever hand it to the browser.

Three layers, cheapest first:
1. Parse with sqlglot (DuckDB dialect). Reject anything unparseable.
2. Guard: exactly one statement, and it must be read-only (a SELECT). No DDL,
   DML, or raw commands ever reach the browser's DuckDB.
3. Bind-check: run EXPLAIN against an in-memory DuckDB whose tables are the real
   schema with no rows. This catches unknown tables/columns and type errors
   without needing the multi-GB data.
"""

from dataclasses import dataclass
from functools import lru_cache

import duckdb
import sqlglot
from sqlglot import exp

from app.schema import get_schema

# Expression types that mean the statement writes or runs a command. If any of
# these appear, the SQL is not a plain read.
_WRITE_NODES = (
    exp.Insert,
    exp.Update,
    exp.Delete,
    exp.Drop,
    exp.Create,
    exp.Alter,
    exp.Command,  # COPY, PRAGMA, ATTACH, EXPORT, etc. parse to Command
    exp.Set,
    exp.Use,
)


@dataclass
class ValidationResult:
    ok: bool
    error: str | None = None

    @classmethod
    def failure(cls, message: str) -> "ValidationResult":
        return cls(ok=False, error=message)


@lru_cache
def _schema_ddl() -> str:
    """CREATE TABLE statements for every table, columns quoted, no data."""
    schema = get_schema()
    statements = []
    for table in schema.tables:
        cols = ", ".join(f'"{c.name}" {c.type}' for c in table.columns)
        statements.append(f'CREATE TABLE "{table.name}" ({cols});')
    return "\n".join(statements)


def _bind_check(sql: str) -> str | None:
    """EXPLAIN the SQL against empty schema tables. Returns an error or None."""
    con = duckdb.connect(":memory:")
    try:
        con.execute(_schema_ddl())
        con.execute(f"EXPLAIN {sql}")
    except duckdb.Error as exc:
        # DuckDB messages are already user-readable (e.g. "Binder Error: ...").
        return str(exc).strip().splitlines()[0]
    finally:
        con.close()
    return None


def validate_sql(sql: str) -> ValidationResult:
    sql = sql.strip().rstrip(";").strip()
    if not sql:
        return ValidationResult.failure("the query is empty")

    try:
        statements = [s for s in sqlglot.parse(sql, dialect="duckdb") if s is not None]
    except sqlglot.errors.ParseError as exc:
        return ValidationResult.failure(f"could not parse SQL: {exc}")

    if len(statements) != 1:
        return ValidationResult.failure("provide exactly one SQL statement")
    statement = statements[0]

    if statement.find(*_WRITE_NODES) is not None or statement.find(exp.Select) is None:
        return ValidationResult.failure("only read-only SELECT queries are allowed")

    known = {name.lower() for name in get_schema().table_names}
    for table in statement.find_all(exp.Table):
        if table.name and table.name.lower() not in known:
            return ValidationResult.failure(f"unknown table: {table.name}")

    error = _bind_check(sql)
    if error is not None:
        return ValidationResult.failure(error)

    return ValidationResult(ok=True)
