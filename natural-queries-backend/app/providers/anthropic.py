"""Anthropic adapter (Claude Messages API) with schema prompt caching.

The system prompt carries the schema, which is large and identical across
requests, so we mark it with cache_control. Anthropic then caches it and bills
subsequent calls at a fraction of the input cost. Claude is bring-your-own-key
in this project, so the key always comes from the request, never the server.
"""

from app.providers.base import GenerationRequest, Provider, ProviderError, post_json

URL = "https://api.anthropic.com/v1/messages"
VERSION = "2023-06-01"


class AnthropicProvider(Provider):
    name = "anthropic"

    async def generate(self, request: GenerationRequest, *, api_key: str) -> str:
        payload = {
            "model": request.model,
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
            "system": [
                {
                    "type": "text",
                    "text": request.system,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            "messages": [{"role": m.role, "content": m.content} for m in request.messages],
        }
        headers = {
            "x-api-key": api_key,
            "anthropic-version": VERSION,
            "content-type": "application/json",
        }
        data = await post_json(self.name, URL, headers=headers, payload=payload)
        return _extract_text(data)


def _extract_text(data: dict) -> str:
    blocks = data.get("content") or []
    # Concatenate text blocks; ignore thinking or tool blocks if present.
    text = "".join(b.get("text", "") for b in blocks if b.get("type") == "text").strip()
    if not text:
        raise ProviderError("anthropic", f"empty response: {data}")
    return text
