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


def test_cte_query_passes():
    sql = """
    WITH deep AS (
      SELECT Well_Report_ID FROM Lithologies WHERE Depth > 100
    )
    SELECT count(*) FROM deep
    """
    assert validate_sql(sql).ok


def test_union_query_passes():
    sql = """
    SELECT Well_ID FROM Wells WHERE Meridian = '4'
    UNION
    SELECT Well_ID FROM Wells WHERE Meridian = '5'
    """
    assert validate_sql(sql).ok


def test_subquery_with_unknown_column_is_rejected():
    sql = "SELECT * FROM (SELECT Bogus_Column FROM Wells) AS t"
    assert not validate_sql(sql).ok


def test_cte_that_writes_is_rejected():
    # A CTE wrapping an unknown table is still caught.
    sql = "WITH x AS (SELECT * FROM Aquifers) SELECT * FROM x"
    assert not validate_sql(sql).ok
