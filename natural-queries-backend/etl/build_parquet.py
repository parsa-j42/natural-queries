"""Build step: raw CSV -> clean, typed, zstd Parquet, with integrity checks.

Run `python -m etl.extract` first so the CSVs and schema.json exist. This step
then:
  1. writes one zstd Parquet per table (DuckDB streaming for the big three,
     pandas-then-DuckDB for the rest);
  2. runs foreign-key integrity checks across the built tables;
  3. reports on-disk sizes so we can size the hosting decision.
"""

from __future__ import annotations

import duckdb

from etl.config import LARGE_TABLES, PARQUET_DIR, RAW_DIR
from etl.schema import load_schema
from etl.transform import projection_sql, read_small_table

# Tune for browser range-fetching: smaller row groups let DuckDB-WASM skip more
# of the file via HTTP range requests when a query filters or projects.
ROW_GROUP_SIZE = 100_000


def _copy_to_parquet(con: duckdb.DuckDBPyConnection, select_sql: str, dest) -> None:
    con.execute(
        f"COPY ({select_sql}) TO '{dest}' "
        f"(FORMAT parquet, COMPRESSION zstd, ROW_GROUP_SIZE {ROW_GROUP_SIZE})"
    )


def _build_large(con: duckdb.DuckDBPyConnection, table: str, columns: list[dict]) -> None:
    """Stream a huge table from CSV to Parquet without touching pandas."""
    csv_path = RAW_DIR / f"{table}.csv"
    reader = (
        f"read_csv('{csv_path}', header = true, all_varchar = true, quote = '\"', escape = '\"')"
    )
    select_sql = f"SELECT\n  {projection_sql(columns)}\nFROM {reader}"
    _copy_to_parquet(con, select_sql, PARQUET_DIR / f"{table}.parquet")


def _build_small(con: duckdb.DuckDBPyConnection, table: str, columns: list[dict]) -> None:
    """Clean a small table in pandas, then cast and write with DuckDB."""
    csv_path = RAW_DIR / f"{table}.csv"
    df = read_small_table(csv_path, columns)  # noqa: F841  (registered below)
    con.register("src", df)
    select_sql = f"SELECT\n  {projection_sql(columns)}\nFROM src"
    _copy_to_parquet(con, select_sql, PARQUET_DIR / f"{table}.parquet")
    con.unregister("src")


def _integrity_checks(con: duckdb.DuckDBPyConnection, relationships: list[dict]) -> None:
    print("\nForeign-key integrity (orphan child rows):")
    for rel in relationships:
        parent = PARQUET_DIR / f"{rel['parent_table']}.parquet"
        child = PARQUET_DIR / f"{rel['child_table']}.parquet"
        if not parent.exists() or not child.exists():
            continue
        pcol, ccol = rel["parent_column"], rel["child_column"]
        orphans = con.execute(
            f"""
            SELECT count(*) FROM read_parquet('{child}') c
            WHERE c."{ccol}" IS NOT NULL
              AND c."{ccol}" NOT IN (SELECT "{pcol}" FROM read_parquet('{parent}'))
            """
        ).fetchone()[0]
        flag = "ok" if orphans == 0 else "WARN"
        print(
            f"  [{flag}] {rel['child_table']}.{ccol} -> "
            f"{rel['parent_table']}.{pcol}: {orphans:,} orphans"
        )


def _size_report() -> None:
    print("\nParquet sizes:")
    total = 0
    for path in sorted(PARQUET_DIR.glob("*.parquet")):
        size = path.stat().st_size
        total += size
        print(f"  {path.name:<28} {size / 1_048_576:8.1f} MB")
    print(f"  {'TOTAL':<28} {total / 1_048_576:8.1f} MB")


def run() -> None:
    schema = load_schema()
    PARQUET_DIR.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect()
    con.execute("PRAGMA threads=4")

    print(f"Building Parquet into {PARQUET_DIR}\n")
    for table in schema["tables"]:
        name = table["name"]
        columns = table["columns"]
        if name in LARGE_TABLES:
            print(f"  {name:<26} (streamed via DuckDB)")
            _build_large(con, name, columns)
        else:
            print(f"  {name:<26} (cleaned via pandas)")
            _build_small(con, name, columns)

    _integrity_checks(con, schema["relationships"])
    _size_report()
    con.close()
    print("\nBuild complete.")


if __name__ == "__main__":
    run()
