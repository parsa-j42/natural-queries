"""Pull a JSON object out of an LLM reply.

Models wrap JSON in prose or ```json fences even when told not to. This finds
the outermost object and parses it, raising JsonParseError on failure so callers
can ask the model to try again.
"""

import json
import re

_FENCE_RE = re.compile(r"^```[a-zA-Z]*\n?|\n?```$")


class JsonParseError(ValueError):
    """The text did not contain a parseable JSON object."""


def extract_json_object(text: str) -> dict:
    text = _FENCE_RE.sub("", text.strip()).strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise JsonParseError("no JSON object found in the reply")
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError as exc:
        raise JsonParseError(f"invalid JSON: {exc}") from exc
