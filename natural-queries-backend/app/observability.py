"""Logging and HTTP middleware: request IDs, structured access logs, rate limits.

Logs are emitted as single-line JSON so they are easy to ship and query. Every
request gets a short id, echoed back in the ``X-Request-ID`` header and attached
to its log line, so a report can be traced to its server-side record.
"""

import json
import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.ratelimit import RateLimiter

logger = logging.getLogger("natural_queries")


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Anything attached via `extra=` lands in __dict__; pull the fields we set.
        for key in ("request_id", "method", "path", "status", "duration_ms", "client"):
            if key in record.__dict__:
                payload[key] = record.__dict__[key]
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def setup_logging(level: str = "INFO") -> None:
    """Configure the app logger to emit JSON lines once."""
    handler = logging.StreamHandler()
    handler.setFormatter(_JsonFormatter())
    logger.handlers = [handler]
    logger.setLevel(level.upper())
    logger.propagate = False


def _client_ip(request: Request) -> str:
    # Behind a proxy the real client is the first hop in X-Forwarded-For.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Assign a request id, time the request, and log it as one JSON line."""

    async def dispatch(self, request: Request, call_next):
        request_id = uuid.uuid4().hex[:12]
        request.state.request_id = request_id
        start = time.monotonic()
        try:
            response = await call_next(request)
        except Exception:
            logger.exception(
                "request failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "client": _client_ip(request),
                },
            )
            raise

        duration_ms = round((time.monotonic() - start) * 1000, 1)
        # Health checks fire constantly, so log them at DEBUG to keep INFO clean.
        level = logging.DEBUG if request.url.path == "/health" else logging.INFO
        logger.log(
            level,
            "request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
                "client": _client_ip(request),
            },
        )
        response.headers["X-Request-ID"] = request_id
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Reject requests to protected paths once a client exceeds its budget."""

    def __init__(self, app, *, limiter: RateLimiter, protected_paths: set[str]):
        super().__init__(app)
        self.limiter = limiter
        self.protected_paths = protected_paths

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.url.path in self.protected_paths:
            retry_after = self.limiter.check(_client_ip(request))
            if retry_after is not None:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "rate limit exceeded, slow down"},
                    headers={"Retry-After": str(int(retry_after) + 1)},
                )
        return await call_next(request)
