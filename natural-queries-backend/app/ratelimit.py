"""A simple in-memory sliding-window rate limiter.

Keeps, per key (usually a client IP), the timestamps of recent requests and
rejects once more than ``limit`` land inside ``window`` seconds. Good enough to
bound cost and abuse on a single-instance backend; a shared store would be needed
across instances.
"""

import time
from collections import defaultdict, deque
from threading import Lock


class RateLimiter:
    def __init__(self, limit: int, window_seconds: float = 60.0):
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str) -> float | None:
        """Record a hit. Return seconds to wait if over the limit, else None."""
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            cutoff = now - self.window
            while hits and hits[0] <= cutoff:
                hits.popleft()
            if len(hits) >= self.limit:
                return max(self.window - (now - hits[0]), 0.0)
            hits.append(now)
            return None

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()
