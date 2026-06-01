"""Tests for the hardening utilities: cache, rate limiter, and middleware."""

import asyncio

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app import main
from app.cache import LRUCache
from app.observability import RateLimitMiddleware
from app.pipeline import generate as generate_mod
from app.pipeline.models import GenerationOutput
from app.providers.router import GenerationResult
from app.ratelimit import RateLimiter

# --- LRU cache ------------------------------------------------------------


def test_lru_evicts_oldest():
    cache: LRUCache[int] = LRUCache(capacity=2)
    cache.put("a", 1)
    cache.put("b", 2)
    cache.get("a")  # touch a so b is now the oldest
    cache.put("c", 3)  # evicts b
    assert cache.get("a") == 1
    assert cache.get("b") is None
    assert cache.get("c") == 3
    assert len(cache) == 2


# --- rate limiter ---------------------------------------------------------


def test_rate_limiter_allows_then_blocks():
    limiter = RateLimiter(limit=2, window_seconds=60)
    assert limiter.check("ip") is None
    assert limiter.check("ip") is None
    retry = limiter.check("ip")
    assert retry is not None and retry > 0


def test_rate_limiter_is_per_key():
    limiter = RateLimiter(limit=1, window_seconds=60)
    assert limiter.check("a") is None
    assert limiter.check("b") is None  # different key, own budget
    assert limiter.check("a") is not None


# --- generation cache -----------------------------------------------------


class _FakeOnce:
    """Returns a valid reply once, then raises if called again."""

    def __init__(self):
        self.calls = 0

    async def __call__(self, system, messages, *, model=None, api_key=None, **kwargs):
        self.calls += 1
        if self.calls > 1:
            raise AssertionError("provider should not be called on a cache hit")
        return GenerationResult(
            text='{"sql": "SELECT Well_ID FROM Wells LIMIT 1", "reasoning": [], '
            '"sqlBreakdown": [], "concepts": []}',
            model="fake",
            provider="fake",
        )


def test_generation_cache_serves_repeat(monkeypatch):
    generate_mod._RESULT_CACHE.clear()
    fake = _FakeOnce()
    monkeypatch.setattr(generate_mod, "provider_generate", fake)

    first = asyncio.run(generate_mod.generate_sql("How many wells?", use_cache=True))
    second = asyncio.run(generate_mod.generate_sql("how   many WELLS?", use_cache=True))

    assert isinstance(first, GenerationOutput)
    assert second.sql == first.sql
    assert fake.calls == 1  # second served from cache despite different spacing/case


# --- middleware -----------------------------------------------------------


def test_request_id_header_present():
    client = TestClient(main.app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.headers.get("X-Request-ID")


def test_rate_limit_middleware_returns_429():
    app = FastAPI()
    app.add_middleware(
        RateLimitMiddleware, limiter=RateLimiter(limit=2), protected_paths={"/x"}
    )

    @app.get("/x")
    def x():
        return {"ok": True}

    client = TestClient(app)
    codes = [client.get("/x").status_code for _ in range(4)]
    assert codes[:2] == [200, 200]
    assert 429 in codes[2:]
