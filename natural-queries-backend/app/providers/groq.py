"""Groq adapter (OpenAI-compatible chat completions)."""

from app.providers.base import (
    GenerationRequest,
    Provider,
    ProviderError,
    post_json,
    strip_thinking,
)

URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqProvider(Provider):
    name = "groq"

    async def generate(self, request: GenerationRequest, *, api_key: str) -> str:
        messages = [{"role": "system", "content": request.system}]
        messages += [{"role": m.role, "content": m.content} for m in request.messages]
        payload = {
            "model": request.model,
            "messages": messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        }
        headers = {"Authorization": f"Bearer {api_key}", "content-type": "application/json"}
        data = await post_json(self.name, URL, headers=headers, payload=payload)
        return _extract_text(data)


def _extract_text(data: dict) -> str:
    choices = data.get("choices") or []
    if not choices:
        raise ProviderError("groq", f"no choices in response: {data}")
    content = choices[0].get("message", {}).get("content")
    if not content:
        raise ProviderError("groq", f"empty content in response: {data}")
    return strip_thinking(content)
