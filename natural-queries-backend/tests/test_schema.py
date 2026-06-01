"""Tests for the schema metadata module."""

from app.schema import get_schema, render_schema


def test_loads_all_data_tables():
    schema = get_schema()
    # 17 data tables (SwitchboardItems was dropped during ETL).
    assert len(schema.tables) == 17
    assert "Wells" in schema.table_names
    assert "SwitchboardItems" not in schema.table_names


def test_primary_keys_and_columns():
    schema = get_schema()
    wells = schema.table("Wells")
    assert wells is not None
    assert wells.primary_key == "Well_ID"
    assert "Latitude" in wells.column_names
    # Coordinates came through as DOUBLE in the ETL.
    assert wells.column("Latitude").type == "DOUBLE"


def test_foreign_keys_are_attached_to_child_tables():
    schema = get_schema()
    analysis_items = schema.table("Analysis_Items")
    fks = {(fk.column, fk.references_table) for fk in analysis_items.foreign_keys}
    assert ("Chemical_Analysis_ID", "Chemical_Analysis") in fks


def test_curated_descriptions_present():
    schema = get_schema()
    element_symbol = schema.table("Analysis_Items").column("Element_Symbol")
    assert element_symbol.description is not None
    assert "FE" in element_symbol.description


def test_render_full_schema_mentions_tables_and_examples():
    text = render_schema()
    assert "Table Wells" in text
    assert "Well_ID INTEGER PK" in text
    assert "FK Chemical_Analysis_ID -> Chemical_Analysis" in text
    # Few-shot examples are appended.
    assert "Example questions" in text
    assert "Element_Symbol = 'FE'" in text


def test_render_subset_limits_tables():
    text = render_schema(["Wells"], include_examples=False)
    assert "Table Wells" in text
    assert "Table Well_Reports" not in text
    assert "Example questions" not in text
