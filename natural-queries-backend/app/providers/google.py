"""Google AI Studio adapter (Gemini generateContent)."""

from app.providers.base import GenerationRequest, Provider, ProviderError, post_json

BASE = "https://generativelanguage.googleapis.com/v1beta/models"


class GoogleProvider(Provider):
    name = "google"

    async def generate(self, request: GenerationRequest, *, api_key: str) -> str:
        url = f"{BASE}/{request.model}:generateContent"
        contents = [
            # Gemini calls the assistant role "model".
            {
                "role": "model" if m.role == "assistant" else "user",
                "parts": [{"text": m.content}],
            }
            for m in request.messages
        ]
        payload = {
            "system_instruction": {"parts": [{"text": request.system}]},
            "contents": contents,
            "generationConfig": {
                "temperature": request.temperature,
                "maxOutputTokens": request.max_tokens,
            },
        }
        headers = {"x-goog-api-key": api_key, "content-type": "application/json"}
        data = await post_json(self.name, url, headers=headers, payload=payload)
        return _extract_text(data)


def _extract_text(data: dict) -> str:
    candidates = data.get("candidates") or []
    if not candidates:
        raise ProviderError("google", f"no candidates in response: {data}")
    parts = candidates[0].get("content", {}).get("parts", [])
    text = "".join(part.get("text", "") for part in parts).strip()
    if not text:
        raise ProviderError("google", f"empty response: {data}")
    return text
