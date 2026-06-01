"""Tests for SQL validation."""

from app.pipeline.validate import validate_sql

IRON_QUERY = """
SELECT w.Well_ID, w.Latitude, ca.Sample_Date, ai.Value AS Iron_mg_L
FROM Wells w
JOIN Chemical_Analysis ca ON ca.Well_ID = w.Well_ID
JOIN Analysis_Items ai ON ai.Chemical_Analysis_ID = ca.Chemical_Analysis_ID
WHERE ai.Element_Symbol = 'FE'
ORDER BY ai.Value DESC
LIMIT 100
"""


def test_valid_multi_join_query_passes():
    assert validate_sql(IRON_QUERY).ok


def test_trailing_semicolon_is_fine():
    assert validate_sql("SELECT Well_ID FROM Wells LIMIT 1;").ok


def test_quoted_reserved_column_passes():
    # "From" is a SQL keyword but a real column in Boreholes.
    assert validate_sql('SELECT "From", "To" FROM Boreholes LIMIT 5').ok


def test_unknown_table_is_rejected():
    result = validate_sql("SELECT * FROM Aquifers")
    assert not result.ok
    assert "Aquifers" in result.error


def test_unknown_column_is_rejected():
    result = validate_sql("SELECT Nonexistent_Column FROM Wells")
    assert not result.ok


def test_write_statements_are_rejected():
    for sql in ["DROP TABLE Wells", "DELETE FROM Wells", "INSERT INTO Wells VALUES (1)"]:
        result = validate_sql(sql)
        assert not result.ok
        assert "read-only" in result.error


def test_multiple_statements_are_rejected():
    result = validate_sql("SELECT 1; SELECT 2")
    assert not result.ok


def test_empty_is_rejected():
    assert not validate_sql("   ").ok
