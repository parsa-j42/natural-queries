"""Regression fixtures: representative target SQL must validate, mistakes must not.

This guards the validator and the schema metadata together. If a column is
renamed in schema.json or the bind-check regresses, these queries (the kind the
model is expected to produce for common questions) start failing.
"""

import pytest

from app.pipeline.validate import validate_sql

# (description, sql) pairs that should all pass validation.
VALID_QUERIES = [
    (
        "wells with highest iron",
        """
        SELECT w.Well_ID, ai.Value AS iron
        FROM Wells w
        JOIN Chemical_Analysis ca ON ca.Well_ID = w.Well_ID
        JOIN Analysis_Items ai ON ai.Chemical_Analysis_ID = ca.Chemical_Analysis_ID
        WHERE ai.Element_Symbol = 'FE'
        ORDER BY ai.Value DESC
        LIMIT 100
        """,
    ),
    (
        "count by drilling method",
        "SELECT Drilling_Method, count(*) AS n FROM Well_Reports GROUP BY Drilling_Method",
    ),
    (
        "average finished depth by use, with HAVING",
        """
        SELECT Well_Use, avg(Finished_Well_Depth) AS d
        FROM Well_Reports
        WHERE Finished_Well_Depth IS NOT NULL
        GROUP BY Well_Use
        HAVING count(*) > 100
        ORDER BY d DESC
        """,
    ),
    (
        "case expression risk levels",
        """
        SELECT ai.Value,
          CASE WHEN ai.Value > 1.0 THEN 'High'
               WHEN ai.Value > 0.3 THEN 'Moderate'
               ELSE 'Normal' END AS risk
        FROM Analysis_Items ai
        WHERE ai.Element_Symbol = 'FE'
        LIMIT 50
        """,
    ),
    (
        "reserved-word column quoted",
        'SELECT "From", "To" FROM Boreholes LIMIT 10',
    ),
    (
        "boolean flag filter",
        "SELECT Well_ID FROM Wells WHERE Validated_Flag LIMIT 20",
    ),
    (
        "owner join",
        """
        SELECT w.Well_ID, wo.Owner_Name
        FROM Wells w
        JOIN Well_Owners wo ON wo.Well_ID = w.Well_ID
        LIMIT 25
        """,
    ),
    (
        "temporal extract",
        """
        SELECT EXTRACT(year FROM Sample_Date) AS yr, count(*) AS n
        FROM Chemical_Analysis
        WHERE Sample_Date IS NOT NULL
        GROUP BY yr
        ORDER BY yr
        """,
    ),
]

# (description, sql) pairs that must be rejected.
INVALID_QUERIES = [
    ("unknown column", "SELECT Iron_Level FROM Wells"),
    ("unknown table", "SELECT * FROM Aquifers"),
    (
        "sql-server dateadd",
        "SELECT * FROM Chemical_Analysis "
        "WHERE Sample_Date >= DATEADD(month, -6, GETDATE())",
    ),
    ("write statement", "DELETE FROM Wells"),
    ("two statements", "SELECT 1; DROP TABLE Wells"),
]


@pytest.mark.parametrize("description, sql", VALID_QUERIES, ids=[d for d, _ in VALID_QUERIES])
def test_target_queries_validate(description, sql):
    result = validate_sql(sql)
    assert result.ok, f"{description} should validate but failed: {result.error}"


@pytest.mark.parametrize("description, sql", INVALID_QUERIES, ids=[d for d, _ in INVALID_QUERIES])
def test_bad_queries_are_rejected(description, sql):
    assert not validate_sql(sql).ok, f"{description} should have been rejected"
