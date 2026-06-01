"""Cleaning rules shared by the build step.

Two paths, same semantics:
  - small/medium tables are read into pandas (as strings, to avoid pandas'
    type inference mangling ids, postal codes, and leading zeros), text-cleaned,
    then handed to DuckDB for the typed cast;
  - the three huge tables skip pandas entirely and are cleaned by DuckDB
    streaming straight from CSV.

Either way the final typed cast is done once, in DuckDB, from the canonical
schema so both paths produce identical column types.
"""

from __future__ import annotations

import pandas as pd

# Columns whose values come in as 0/1 from mdb-export and must become booleans.
# DuckDB casts '1'/'0' to BOOLEAN directly, so a plain TRY_CAST is enough.


def projection_sql(columns: list[dict]) -> str:
    """Build the SELECT list that turns raw VARCHAR columns into typed ones.

    Every source value is trimmed and blank-to-NULL normalised first, then cast
    with TRY_CAST so a single dirty value nulls out instead of failing the run.
    """
    parts = []
    for col in columns:
        name = col["name"]
        target = col["duckdb_type"]
        cleaned = f"NULLIF(TRIM(\"{name}\"), '')"
        if target == "VARCHAR":
            parts.append(f'{cleaned} AS "{name}"')
        else:
            parts.append(f'TRY_CAST({cleaned} AS {target}) AS "{name}"')
    return ",\n  ".join(parts)


def read_small_table(csv_path, columns: list[dict]) -> pd.DataFrame:
    """Read a small table as strings and do the per-column text cleaning.

    Reading everything as ``str`` keeps ids, postal codes, and journeyman
    numbers exactly as stored; the typed cast happens afterwards in DuckDB.
    """
    names = [c["name"] for c in columns]
    df = pd.read_csv(
        csv_path,
        dtype=str,
        keep_default_na=False,  # we decide what counts as null, below
        na_values=[],
    )
    # Guard against a header drift between schema.json and the CSV.
    if list(df.columns) != names:
        missing = set(names) - set(df.columns)
        extra = set(df.columns) - set(names)
        raise ValueError(f"Column mismatch for {csv_path.name}: missing={missing} extra={extra}")
    for col in names:
        df[col] = df[col].str.strip()
    df = df.replace("", None)
    return df
