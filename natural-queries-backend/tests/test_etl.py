"""Unit tests for the ETL pure helpers (no .mdb or DuckDB needed)."""

from etl.schema import _classify
from etl.transform import projection_sql


def test_classify_maps_postgres_types():
    assert _classify("INTEGER") == ("INTEGER", "Long Integer")
    assert _classify("NUMERIC (18, 6)") == ("DOUBLE", "Numeric (18, 6)")
    assert _classify("VARCHAR (50)") == ("VARCHAR", "Text (50)")
    assert _classify("BOOLEAN") == ("BOOLEAN", "Boolean")
    assert _classify("TIMESTAMP WITHOUT TIME ZONE") == ("TIMESTAMP", "DateTime")
    assert _classify("UUID") == ("UUID", "GUID")
    assert _classify("TEXT") == ("VARCHAR", "Memo")


def test_projection_trims_and_casts():
    columns = [
        {"name": "Well_ID", "duckdb_type": "INTEGER"},
        {"name": "Owner_Name", "duckdb_type": "VARCHAR"},
        {"name": "Flag", "duckdb_type": "BOOLEAN"},
    ]
    sql = projection_sql(columns)
    # Strings are only trimmed/null-normalised, never cast.
    assert 'NULLIF(TRIM("Owner_Name"), \'\') AS "Owner_Name"' in sql
    # Non-strings get a guarded cast off the cleaned value.
    assert 'TRY_CAST(NULLIF(TRIM("Well_ID"), \'\') AS INTEGER) AS "Well_ID"' in sql
    assert 'TRY_CAST(NULLIF(TRIM("Flag"), \'\') AS BOOLEAN) AS "Flag"' in sql
