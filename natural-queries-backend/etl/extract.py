"""Extract step: dump every data table to CSV and capture the schema.

mdb-export streams row by row, so even the multi-million-row tables are written
without loading them into memory. Dates are emitted in ISO form so the build
step can parse them directly. The Access UI table is skipped.
"""

from __future__ import annotations

import subprocess
import time

from etl.config import (
    DATE_FORMAT,
    DATETIME_FORMAT,
    DROP_TABLES,
    MDB_PATH,
    RAW_DIR,
)
from etl.schema import write_schema_json


def _table_names() -> list[str]:
    out = subprocess.run(
        ["mdb-tables", "-1", str(MDB_PATH)],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return [name for name in out.split() if name not in DROP_TABLES]


def _export_table(table: str) -> int:
    """Stream one table to CSV. Returns the data row count (excluding header)."""
    dest = RAW_DIR / f"{table}.csv"
    with dest.open("w", encoding="utf-8") as fh:
        subprocess.run(
            [
                "mdb-export",
                "-D",
                DATE_FORMAT,
                "-T",
                DATETIME_FORMAT,
                str(MDB_PATH),
                table,
            ],
            stdout=fh,
            check=True,
        )
    # Count lines without slurping the file into memory.
    with dest.open("rb") as fh:
        lines = sum(1 for _ in fh)
    return max(lines - 1, 0)


def run() -> None:
    if not MDB_PATH.exists():
        raise FileNotFoundError(f"Access database not found at {MDB_PATH}")

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    tables = _table_names()
    print(f"Extracting {len(tables)} tables from {MDB_PATH.name}\n")

    for table in tables:
        start = time.perf_counter()
        rows = _export_table(table)
        elapsed = time.perf_counter() - start
        print(f"  {table:<26} {rows:>10,} rows  ({elapsed:5.1f}s)")

    print("\nCapturing schema -> etl/schema.json")
    write_schema_json()
    print("Extract complete.")


if __name__ == "__main__":
    run()
