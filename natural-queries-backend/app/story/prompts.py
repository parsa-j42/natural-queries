"""Prompt construction for Story mode.

Two products, single-adventure and multi-chapter, both asked for as a single
JSON object. The hard requirement is that every `solution` is a runnable DuckDB
query over the real (historical) data, because the browser executes it to grade
the student. The rules below steer the model away from the SQL-Server-isms and
"last 6 months" filters that would return nothing.
"""

from app.story.models import Difficulty

# What each selectable element maps to in the real schema. Helps the model reach
# for the right tables and the domain facts that make a story concrete.
ELEMENT_GUIDE: dict[str, str] = {
    "well_locations": (
        "Wells: coordinates (Latitude/Longitude/Elevation) and the Alberta survey "
        "location (LSD, Section, Township, Range, Meridian). Note these survey "
        "fields are VARCHAR, not numbers."
    ),
    "chemical_analysis": (
        "Chemical_Analysis (a water sample) joined to Analysis_Items (one row per "
        "element, identified by Element_Symbol such as 'FE', with the reading in "
        "Value). Elements lists the element reference data."
    ),
    "well_ownership": "Well_Owners: owner name and mailing address, joined to Wells by Well_ID.",
    "drilling_info": (
        "Well_Reports (construction details: drilling method, depths, casing), with "
        "Drillers, Drilling_Companies, Boreholes and Lithologies (logged geology)."
    ),
    "water_quality": (
        "Water chemistry thresholds via Analysis_Items.Value, e.g. iron ('FE') above "
        "0.3 mg/L causes staining and taste issues, above 1.0 mg/L risks infrastructure."
    ),
}

# What each skill should exercise.
SKILL_GUIDE: dict[str, str] = {
    "basic_select": "selecting columns and filtering with WHERE",
    "joins": "joining tables through their foreign keys",
    "aggregates": "GROUP BY with COUNT/AVG/MIN/MAX and HAVING",
    "complex_conditions": "CASE expressions, multiple AND/OR conditions, ranges",
    "temporal_analysis": "working with the TIMESTAMP date columns (EXTRACT, date ranges)",
}

# Beginner gets fewer, simpler tasks; advanced gets more.
_STEP_GUIDANCE: dict[Difficulty, str] = {
    "beginner": "Use 2 steps. Keep queries short, one or two joins at most.",
    "intermediate": "Use 3 steps, building in difficulty, with joins and aggregation.",
    "advanced": "Use 3 to 4 steps, including aggregation, CASE logic, and multi-table joins.",
}

_CHAPTER_GUIDANCE: dict[Difficulty, str] = {
    "beginner": "Use 2 chapters, 1 to 2 steps each.",
    "intermediate": "Use 3 chapters, 2 steps each.",
    "advanced": "Use 3 chapters, 2 steps each, with progressively harder queries.",
}

_RULES = """\
You are a SQL instructor. You write short, engaging lessons that teach students
to query a real Alberta groundwater well database. Each lesson presents a
scenario and a series of tasks; for every task you provide a correct SQL
solution and an explanation.

Hard requirements for every "solution":
- It must be valid DuckDB SQL: a single read-only SELECT.
- It must run on the real data and actually return rows. The data is historical,
  so never filter to "recent" dates like the last 6 months; that returns nothing.
- Use the exact table and column names from the schema, with their real types.
  Survey fields (Township, Range, Section, LSD, Meridian) are VARCHAR. Flags such
  as Validated_Flag and Water_Bearing are BOOLEAN, so write "WHERE Validated_Flag",
  not "= 1".
- Iron is Element_Symbol 'FE' in Analysis_Items; filter elements that way.
- Double-quote identifiers that are SQL keywords, such as "From" and "To".
- Always add a LIMIT (50 or less) unless the query is a single aggregate that
  returns one row. This keeps the lesson's result sets small.

Make the scenarios specific and grounded in groundwater/water-quality work.
Tie the chosen skills into the tasks. Respond with one JSON object and nothing
else: no markdown fences, no commentary outside the JSON.
"""


def build_system_prompt(schema_text: str) -> str:
    return f"{_RULES}\nSchema:\n\n{schema_text}"


def _selection_block(elements: list[str], skills: list[str], difficulty: Difficulty) -> str:
    element_lines = "\n".join(
        f"- {value}: {ELEMENT_GUIDE.get(value, value)}" for value in elements
    )
    skill_lines = "\n".join(f"- {value}: {SKILL_GUIDE.get(value, value)}" for value in skills)
    return (
        f"Difficulty: {difficulty}\n\n"
        f"Focus on these database elements:\n{element_lines}\n\n"
        f"Exercise these SQL skills:\n{skill_lines}\n"
    )


_SINGLE_SHAPE = """\
{
  "title": "...",
  "context": "the overall scenario (2-3 short paragraphs)",
  "steps": [
    {
      "context": "what this task is about",
      "task": "what the student must write a query for",
      "hint": "a nudge, naming the tables to use",
      "solution": "the correct DuckDB SELECT",
      "explanation": {
        "overview": "one sentence on what the query does",
        "steps": [
          {"sql": "a clause", "explanation": "what it does", "key_concept": "the concept"}
        ]
      }
    }
  ]
}\
"""

_MULTI_SHAPE = """\
{
  "title": "...",
  "overall_context": "the saga's premise (2-3 short paragraphs)",
  "chapters": [
    {
      "title": "...",
      "introduction": "what this chapter covers",
      "learning_objectives": ["...", "..."],
      "steps": [ {/* same step shape as a single story */} ],
      "conclusion": "wrap-up for the chapter"
    }
  ]
}\
"""


def build_single_user(elements: list[str], skills: list[str], difficulty: Difficulty) -> str:
    return (
        f"Write a single-adventure SQL lesson.\n\n"
        f"{_selection_block(elements, skills, difficulty)}\n"
        f"{_STEP_GUIDANCE[difficulty]}\n\n"
        f"Return exactly this JSON shape:\n{_SINGLE_SHAPE}"
    )


def build_multi_user(elements: list[str], skills: list[str], difficulty: Difficulty) -> str:
    return (
        f"Write a multi-chapter SQL saga.\n\n"
        f"{_selection_block(elements, skills, difficulty)}\n"
        f"{_CHAPTER_GUIDANCE[difficulty]}\n\n"
        f"Return exactly this JSON shape:\n{_MULTI_SHAPE}"
    )


def repair_user(errors: list[str]) -> str:
    joined = "\n".join(f"- {error}" for error in errors)
    return (
        "Some solution queries failed validation:\n"
        f"{joined}\n\n"
        "Fix those queries (keep the lesson otherwise the same) and reply again "
        "with the same JSON object. Return only the JSON."
    )
