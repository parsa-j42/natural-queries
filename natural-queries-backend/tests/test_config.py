"""Tests for settings parsing helpers."""

from app.config import Settings


def test_cors_origin_list_splits_and_strips():
    settings = Settings(cors_origins=" https://a.dev , http://localhost:5173 ,")
    assert settings.cors_origin_list == ["https://a.dev", "http://localhost:5173"]


def test_fallback_model_list_splits():
    settings = Settings(fallback_models="a, b ,c")
    assert settings.fallback_model_list == ["a", "b", "c"]


def test_empty_lists():
    settings = Settings(cors_origins="", fallback_models="")
    assert settings.cors_origin_list == []
    assert settings.fallback_model_list == []
