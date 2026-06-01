"""Tests for the lenient JSON extraction used to parse LLM replies."""

import pytest

from app.jsonutil import JsonParseError, extract_json_object


def test_plain_object():
    assert extract_json_object('{"sql": "SELECT 1"}') == {"sql": "SELECT 1"}


def test_strips_code_fences():
    text = '```json\n{"a": 1}\n```'
    assert extract_json_object(text) == {"a": 1}


def test_ignores_prose_around_object():
    text = 'Sure, here you go:\n{"a": 1, "b": [2, 3]}\nHope that helps!'
    assert extract_json_object(text) == {"a": 1, "b": [2, 3]}


def test_takes_outermost_braces():
    # Nested objects should round-trip via the outermost pair.
    text = '{"outer": {"inner": 1}}'
    assert extract_json_object(text) == {"outer": {"inner": 1}}


def test_raises_when_no_object():
    with pytest.raises(JsonParseError):
        extract_json_object("no json here")


def test_raises_on_malformed_json():
    with pytest.raises(JsonParseError):
        extract_json_object('{"a": }')
