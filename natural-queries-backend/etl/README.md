# ETL: Access (.mdb) to Parquet

Turns the raw `Well_Reports.mdb` (about 2 GB Microsoft Access, JET4) into clean,
typed, compressed Parquet files that the browser loads and queries with
DuckDB-WASM. The database is never queried at request time; this is a one-off
(or occasional) build step.

## Prerequisites

- `mdbtools` on the PATH (`mdb-tables`, `mdb-schema`, `mdb-export`).
- The backend's `etl` dependency group: `uv sync --group etl`.
- `Well_Reports.mdb` at the repository root (gitignored, never committed).

## Run it

From `natural-queries-backend/`:

```bash
uv run --group etl python -m etl.extract        # .mdb -> data/raw/*.csv + schema.json
uv run --group etl python -m etl.build_parquet  # CSV -> public/data/*.parquet
```

Outputs:

- `data/raw/*.csv` at the repo root: intermediate dumps, gitignored. Safe to delete
  after the build.
- `etl/schema.json`: the canonical schema (real table and column names, types,
  and foreign-key relationships), captured from the `.mdb`. Committed; consumed by
  the build step and, later, the backend's schema metadata.
- `natural-queries-frontend/public/data/*.parquet`: the browser-ready artifacts,
  gitignored (rebuilt from the source, not stored in git).

## How it works

**Extract (`extract.py`).** `mdb-export` streams each table row by row, so the
multi-million-row tables never sit in memory. Dates are emitted in ISO form
(`-D`/`-T` strftime flags) so the build can parse them directly. The Access UI
table `SwitchboardItems` is dropped.

**Schema (`schema.py`).** `mdb-schema`'s postgres dialect gives reliable column
types but lowercases identifiers, so the real CamelCase names are read from each
table's export header and matched back to the types. Postgres types map to a
DuckDB cast target and a human-facing Access type (shown in the schema viewer).
`NUMERIC` becomes `DOUBLE`: the measurements and coordinates fit comfortably and
doubles are far lighter in the browser than `DECIMAL`.

**Transform + load (`transform.py`, `build_parquet.py`).** pandas and DuckDB are
used where each is strongest:

- The three huge tables (`Lithologies`, `Analysis_Items`, `Pump_Test_Items`) are
  streamed straight from CSV to Parquet by DuckDB, never materialised in pandas.
- The rest are read into pandas as strings (so ids, postal codes, and leading
  zeros survive), text-cleaned (trim, blank to null), then handed to DuckDB.

Either way the final typed cast happens once in DuckDB from `schema.json`, with
`TRY_CAST` so a single dirty value nulls out instead of failing the run. Output is
zstd Parquet with 100k-row row groups, which lets DuckDB-WASM skip most of a file
via HTTP range requests when a query filters or projects columns.

The build also runs foreign-key integrity checks across the built tables and
prints a size report.

## Results (last build)

- 17 data tables, about 8.9M rows total.
- All 13 foreign-key relationships: 0 orphan rows.
- Total Parquet: about 84 MB (largest single file about 16 MB).

Because the full dataset compresses to about 84 MB with every file under ~17 MB,
the Parquet is served directly as GitHub Pages static assets (see the deployment
notes); no object storage or table partitioning is needed.

## Data notes

- Column types come from the real `.mdb`, not guesses. Notably `Drillers.User_ID`
  is a GUID, not text.
- Element symbols in `Analysis_Items` are upper-cased: iron is `FE` (and field
  iron `F_FE`), not `Fe`.
- `Chemical_Analysis.Aquifer` is sparsely populated (about 5k of 116k rows).
