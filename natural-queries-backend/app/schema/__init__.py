"""Schema metadata for the Alberta groundwater dataset.

The rest of the backend imports the schema from here: ``get_schema()`` for the
typed model and ``render_schema()`` for prompt text.
"""

from app.schema.loader import get_schema, render_schema
from app.schema.models import Column, Example, ForeignKey, Schema, Table

__all__ = [
    "Column",
    "Example",
    "ForeignKey",
    "Schema",
    "Table",
    "get_schema",
    "render_schema",
]
