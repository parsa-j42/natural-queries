"""The catalog of LLM models the backend can use.

This is the single place to add, remove, or correct a model. The frontend reads
it through GET /providers to build its model picker. Model ids are the exact
strings each provider's API expects; if a provider renames a model, edit it here
only.

Selection rationale (decided 2026-06-01, see ROADMAP Phase 3b):
- Default when the user picks nothing: GPT-OSS 120B on Groq. Strongest open model
  on the free tier for structured/SQL output, and Groq's latency makes the demo
  feel instant.
- Best regardless of cost: Claude Sonnet 4.6 (bring your own key).
- The Gemini 3.x ids follow Google's naming; correct them here if the API differs.
"""

from pydantic import BaseModel


class ModelInfo(BaseModel):
    id: str  # API model id, also the catalog key the frontend sends back
    provider: str  # "google" | "groq" | "anthropic"
    label: str  # human-facing name for the picker
    byok_only: bool = False  # requires a user-supplied key (no server key)
    recommended: bool = False  # strong enough to surface prominently
    notes: str | None = None


# Order here is the order the frontend shows them in.
MODELS: list[ModelInfo] = [
    # Groq: server-keyed, very low latency.
    ModelInfo(
        id="openai/gpt-oss-120b",
        provider="groq",
        label="GPT-OSS 120B (Groq)",
        recommended=True,
        notes="Default. Strong open reasoning model, very fast on Groq.",
    ),
    ModelInfo(
        id="llama-3.3-70b-versatile",
        provider="groq",
        label="Llama 3.3 70B (Groq)",
        recommended=True,
        notes="Reliable general model with more token headroom than GPT-OSS.",
    ),
    ModelInfo(
        id="qwen/qwen3-32b",
        provider="groq",
        label="Qwen3 32B (Groq)",
        recommended=True,
        notes="Reasoning model, strong at code and SQL.",
    ),
    ModelInfo(
        id="openai/gpt-oss-20b",
        provider="groq",
        label="GPT-OSS 20B (Groq)",
        notes="Lighter and faster, good for simple questions.",
    ),
    # Google AI Studio: server-keyed. The full Flash models have low daily caps;
    # Flash Lite has far higher limits and suits high request volume.
    ModelInfo(
        id="gemini-3-flash",
        provider="google",
        label="Gemini 3 Flash",
        recommended=True,
        notes="Capable, but only ~20 requests/day on the free tier.",
    ),
    ModelInfo(
        id="gemini-3.5-flash",
        provider="google",
        label="Gemini 3.5 Flash",
        recommended=True,
        notes="Newest Flash. Low daily cap (~20/day).",
    ),
    ModelInfo(
        id="gemini-3.1-flash-lite",
        provider="google",
        label="Gemini 3.1 Flash Lite",
        recommended=True,
        notes="High limits (~500/day, 250K TPM). Best free choice for volume.",
    ),
    ModelInfo(
        id="gemini-2.5-flash",
        provider="google",
        label="Gemini 2.5 Flash",
        notes="Previous-gen Flash. Low daily cap.",
    ),
    ModelInfo(
        id="gemini-2.5-flash-lite",
        provider="google",
        label="Gemini 2.5 Flash Lite",
        notes="Previous-gen Flash Lite.",
    ),
    # Anthropic: bring your own key only in this project.
    ModelInfo(
        id="claude-sonnet-4-6",
        provider="anthropic",
        label="Claude Sonnet 4.6",
        byok_only=True,
        recommended=True,
        notes="Best overall quality. Schema is prompt-cached to cut cost. BYO key.",
    ),
    ModelInfo(
        id="claude-haiku-4-5",
        provider="anthropic",
        label="Claude Haiku 4.5",
        byok_only=True,
        notes="Cheaper, faster Claude. BYO key.",
    ),
]

_BY_ID = {m.id: m for m in MODELS}


def get_model(model_id: str) -> ModelInfo | None:
    return _BY_ID.get(model_id)


def list_models() -> list[ModelInfo]:
    return MODELS
