"""Filesystem layout and table inventory for the ETL pipeline.

Paths are resolved relative to the repository root so the pipeline works no
matter where it is invoked from. Everything it writes is gitignored.
"""

from pathlib import Path

# etl/ -> natural-queries-backend/ -> repo root
REPO_ROOT = Path(__file__).resolve().parents[2]

MDB_PATH = REPO_ROOT / "Well_Reports.mdb"

# Raw CSV dumps from mdb-export. Intermediate, gitignored (data/raw/).
RAW_DIR = REPO_ROOT / "data" / "raw"

# Canonical schema captured from the .mdb, consumed by the build step and later
# by the backend's schema metadata (Phase 3).
SCHEMA_JSON = Path(__file__).resolve().parent / "schema.json"

# Final Parquet artifacts, served to the browser as static assets (gitignored).
PARQUET_DIR = REPO_ROOT / "natural-queries-frontend" / "public" / "data"

# Access UI table that holds no real data. Dropped from every step.
DROP_TABLES = {"SwitchboardItems"}

# The three tables too large to materialise in pandas. These are cleaned with
# DuckDB streaming straight from CSV to Parquet (see build_parquet.py). The rest
# are small enough for pandas to do the fiddly per-column cleaning.
LARGE_TABLES = {"Lithologies", "Analysis_Items", "Pump_Test_Items"}

# mdb-export renders dates with these strftime formats so DuckDB can parse them
# directly as ISO timestamps.
DATE_FORMAT = "%Y-%m-%d"
DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"
