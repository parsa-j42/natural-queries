"""Curated, human-written context for the schema.

``schema.json`` carries the structural truth (tables, columns, types, FKs) but no
meaning. This module adds what a model needs to write correct SQL: what each
table is for, what the non-obvious columns hold, which column is the primary key,
and a handful of worked NL-to-SQL examples. Keep these accurate to the real
Alberta groundwater data, not aspirational.
"""

# The single identifying column per table, where one exists. Detail tables that
# are keyed by a combination of columns (Analysis_Items, Lithologies,
# Driller_Drilling_Company) are intentionally left out.
PRIMARY_KEYS: dict[str, str] = {
    "Boreholes": "BoreHole_ID",
    "Chemical_Analysis": "Chemical_Analysis_ID",
    "Drillers": "Driller_ID",
    "Drilling_Companies": "Drilling_Company_ID",
    "Elements": "Element_ID",
    "Geophysical_Logs": "Geophysical_Log_ID",
    "Other_Seals": "Other_Seal_ID",
    "Perforations": "Perforation_ID",
    "Pump_Test_Items": "Pump_Test_Item_ID",
    "Pump_Tests": "Pump_Test_ID",
    "Screens": "Screen_ID",
    "Well_Owners": "Well_Owner_ID",
    "Well_Reports": "Well_Report_ID",
    "Wells": "Well_ID",
}

# Logical foreign keys the data clearly has but that were never formally defined
# in the Access database, so they are absent from schema.json's relationship list.
# Without them the model misses obvious joins (e.g. iron content needs
# Analysis_Items -> Chemical_Analysis -> Wells). Each entry is
# (column, references_table, references_column). Merged with the captured FKs in
# the loader, deduped.
SUPPLEMENTAL_FOREIGN_KEYS: dict[str, list[tuple[str, str, str]]] = {
    "Analysis_Items": [("Chemical_Analysis_ID", "Chemical_Analysis", "Chemical_Analysis_ID")],
    "Chemical_Analysis": [
        ("Well_ID", "Wells", "Well_ID"),
        ("Well_Report_ID", "Well_Reports", "Well_Report_ID"),
    ],
    "Well_Owners": [("Well_ID", "Wells", "Well_ID")],
    "Boreholes": [("Well_Report_ID", "Well_Reports", "Well_Report_ID")],
}

TABLE_DESCRIPTIONS: dict[str, str] = {
    "Wells": (
        "One row per physical water well: its map location (latitude/longitude, "
        "elevation) and Alberta land-survey descriptors (LSD, section, township, "
        "range, meridian). The root entity that reports and samples hang off."
    ),
    "Well_Reports": (
        "The drilling/construction report filed for a well. A well can have "
        "several reports over its life. This is the central table for how a well "
        "was built: drilling method, casing, liner, screen, seals, pump, depths "
        "and the dates work happened."
    ),
    "Well_Owners": "Owner name and mailing address recorded for a well.",
    "Drillers": "Licensed individual drillers (the person who drilled the well).",
    "Drilling_Companies": "Drilling businesses, with address and contact details.",
    "Driller_Drilling_Company": (
        "Which driller worked for which company, over time. A link table keyed by "
        "driller, company and effective date."
    ),
    "Boreholes": (
        "Borehole diameter intervals drilled for a report (each row is a From/To "
        "depth range at a given diameter)."
    ),
    "Lithologies": (
        "Geological layers logged while drilling: the material, colour and depth "
        "of each layer, and whether it was water bearing. One of the largest "
        "tables (~2.6M rows)."
    ),
    "Screens": "Well-screen intervals installed in a report (From/To depth, slot size).",
    "Perforations": "Casing perforation intervals for a report (From/To depth, diameter).",
    "Other_Seals": "Additional sealing intervals placed in a report (From/To/At depth).",
    "Geophysical_Logs": (
        "Whether a geophysical log of a given type was taken for a report, and "
        "whether it was sent to Alberta Environment."
    ),
    "Pump_Tests": (
        "The header for a pumping (yield) test on a report: test date, static and "
        "ending water levels, and how water was removed."
    ),
    "Pump_Test_Items": (
        "Time-series readings taken during a pump test: at each elapsed minute, "
        "the pumping and recovery water depths. Linked to Pump_Tests."
    ),
    "Chemical_Analysis": (
        "A water sample drawn from a well and sent to a lab: sample/analysis "
        "dates, laboratory, aquifer and measured water level. The parent of the "
        "individual element readings in Analysis_Items."
    ),
    "Analysis_Items": (
        "The individual element measurements within a chemical analysis: one row "
        "per element per sample. The element is identified by Element_Symbol and "
        "the reading is in Value. Linked to Chemical_Analysis."
    ),
    "Elements": "Reference list of measurable water-chemistry elements (symbol and name).",
}

# Only the columns whose meaning is not obvious from the name. Keyed by table
# then column. Left deliberately sparse: a real schema doc does not re-explain
# self-evident names like First_Name.
COLUMN_DESCRIPTIONS: dict[str, dict[str, str]] = {
    "Wells": {
        "Well_ID": "Primary key. Referenced by Well_Reports, Chemical_Analysis, Well_Owners.",
        "GIC_Well_ID": "Groundwater Information Centre well number (an alternate identifier).",
        "GOA_Well_Tag_Number": "Government of Alberta well tag number.",
        "Latitude": "Decimal degrees (positive, Alberta is ~49 to 60 N).",
        "Longitude": "Decimal degrees (negative in Alberta, ~ -110 to -120).",
        "Elevation": "Ground elevation in metres.",
        "LSD": "Legal subdivision, part of the Alberta township survey location.",
        "Meridian": "Survey meridian (W of the 4th, 5th, 6th).",
    },
    "Well_Reports": {
        "Well_Report_ID": "Primary key. Referenced by the detail tables (Lithologies, Screens).",
        "Well_ID": "The well this report describes (FK to Wells).",
        "Drilling_Method": "How the well was drilled, e.g. 'Rotary', 'Cable Tool', 'Auger'.",
        "Type_of_Work": "What the report covers, e.g. 'New Well', 'Deepening', 'Reconditioning'.",
        "Well_Use": "Intended use, e.g. 'Domestic', 'Stock', 'Irrigation', 'Observation'.",
        "Total_Depth_Drilled": "Depth drilled, in metres.",
        "Finished_Well_Depth": "Final completed well depth, in metres.",
        "Drilling_Start_Date": "When drilling began.",
        "Drilling_End_Date": "When drilling finished.",
        "Artesian_Flow_Flag": "True if the well flowed under natural artesian pressure.",
    },
    "Chemical_Analysis": {
        "Chemical_Analysis_ID": "Primary key. Referenced by Analysis_Items.",
        "Well_ID": "The sampled well (FK to Wells).",
        "Sample_Date": "When the water sample was collected.",
        "Aquifer": "Name/label of the aquifer sampled, when recorded.",
    },
    "Analysis_Items": {
        "Chemical_Analysis_ID": "The analysis this reading belongs to (FK to Chemical_Analysis).",
        "Element_Symbol": (
            "Chemical symbol of the measured element, e.g. 'FE' (iron), 'NA' "
            "(sodium), 'CA' (calcium), 'CL' (chloride). Field-measured variants "
            "are prefixed, e.g. 'F_FE' for field iron. Filter on this to pick an "
            "element."
        ),
        "Element_Name": "Human name of the element, e.g. 'Iron'.",
        "Value": "The measured concentration, typically mg/L.",
    },
    "Lithologies": {
        "Well_Report_ID": "The report this layer was logged in (FK to Well_Reports).",
        "Depth": "Depth to the bottom of the layer, in metres.",
        "Material": "Logged material, e.g. 'Sand', 'Clay', 'Gravel', 'Shale'.",
        "Water_Bearing": "True if the layer produced water.",
    },
    "Pump_Tests": {
        "Static_Water_Level": "Resting water level before pumping, in metres.",
        "Water_Removal_Rate": "Pumping rate during the test.",
    },
    "Pump_Test_Items": {
        "Minutes": "Elapsed minutes into the test for this reading.",
        "Pumping_Depth": "Water depth while pumping at this time, in metres.",
        "Recovery_Depth": "Water depth during recovery at this time, in metres.",
    },
    "Drillers": {
        "User_ID": "GUID account identifier (not the join key; use Driller_ID for joins).",
        "Driller_ID": "Primary key used by Well_Reports and Driller_Drilling_Company.",
    },
}

# Worked examples. These steer the model toward the real table/column names and
# DuckDB dialect. Keep them runnable against the registered views.
EXAMPLES: list[dict[str, str]] = [
    {
        "question": "Show me the wells with the highest iron content",
        "sql": (
            "SELECT w.Well_ID, w.Latitude, w.Longitude, ca.Sample_Date, "
            "ai.Value AS Iron_mg_L\n"
            "FROM Wells w\n"
            "JOIN Chemical_Analysis ca ON ca.Well_ID = w.Well_ID\n"
            "JOIN Analysis_Items ai ON ai.Chemical_Analysis_ID = ca.Chemical_Analysis_ID\n"
            "WHERE ai.Element_Symbol = 'FE'\n"
            "ORDER BY ai.Value DESC\n"
            "LIMIT 100;"
        ),
    },
    {
        "question": "How many wells were drilled with each drilling method?",
        "sql": (
            "SELECT Drilling_Method, count(*) AS report_count\n"
            "FROM Well_Reports\n"
            "WHERE Drilling_Method IS NOT NULL\n"
            "GROUP BY Drilling_Method\n"
            "ORDER BY report_count DESC;"
        ),
    },
    {
        "question": "What is the average finished well depth by well use?",
        "sql": (
            "SELECT Well_Use, avg(Finished_Well_Depth) AS avg_depth_m, count(*) AS n\n"
            "FROM Well_Reports\n"
            "WHERE Finished_Well_Depth IS NOT NULL AND Well_Use IS NOT NULL\n"
            "GROUP BY Well_Use\n"
            "ORDER BY avg_depth_m DESC;"
        ),
    },
    {
        "question": "List the deepest water-bearing layers and what material they are",
        "sql": (
            "SELECT Well_Report_ID, Material, Colour, Depth\n"
            "FROM Lithologies\n"
            "WHERE Water_Bearing\n"
            "ORDER BY Depth DESC\n"
            "LIMIT 50;"
        ),
    },
]
