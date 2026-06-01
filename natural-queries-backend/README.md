# Natural Queries Backend

FastAPI service that turns plain-English questions into validated SQL over the
Alberta groundwater schema. The data itself is never queried here: the browser
runs the SQL against Parquet via DuckDB-WASM. This service only generates SQL.

## Requirements

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) for dependency and environment management

## Setup

```bash
cd natural-queries-backend
uv sync                       # create .venv and install deps (incl. dev tools)
cp .env.example .env          # then fill in values as needed
```

## Running

```bash
uv run uvicorn app.main:app --reload --port 8000
```

Then check the health endpoint:

```bash
curl http://localhost:8000/health
# {"status":"ok","environment":"development"}
```

## Configuration

Settings load from the environment (or a local `.env`, which is gitignored) via
`app/config.py`. See `.env.example` for the full list.

| Variable | Purpose | Default |
|---|---|---|
| `ENVIRONMENT` | Label surfaced by `/health` | `development` |
| `CORS_ORIGINS` | Comma-separated browser origins allowed to call the API | prod site + `localhost:5173` |
| `GOOGLE_API_KEY` | Google AI Studio key (Gemini) | empty |
| `GROQ_API_KEY` | Groq key | empty |
| `ANTHROPIC_API_KEY` | Anthropic key (normally empty: Claude is BYO-key) | empty |
| `DEFAULT_MODEL` | Catalog id used when a request names no model | `openai/gpt-oss-120b` |
| `FALLBACK_MODELS` | Comma-separated catalog ids tried when the chosen model errors | see `.env.example` |

## Providers and models

The backend can call three providers behind one interface
(`app/providers/`): Google AI Studio (Gemini), Groq, and Anthropic (Claude).
`GET /providers` lists the selectable models for the frontend's picker.

Keys are server-held by default. A request may carry its own key (bring your own
key), which is used only for the model that request explicitly chooses;
fallbacks always use server keys. Claude is BYO-key only here, so it has no
server key and the schema prompt is cached on Anthropic's side to cut cost.

To add, remove, or correct a model (including fixing an API model id), edit
`app/providers/catalog.py`. Defaults and selection rationale are in
`ROADMAP.md`, Phase 3b.

## Development

```bash
uv run ruff check .           # lint
uv run ruff format .          # format
uv run pytest                 # tests
```

## Layout

```
app/
  main.py      FastAPI app, CORS, routes (/health, /providers)
  config.py    settings loaded from env via pydantic-settings
  schema/      typed schema metadata + prompt rendering
  providers/   LLM adapters (google, groq, anthropic), catalog, router
tests/         pytest suite
etl/           Access-to-Parquet build (see etl/README.md)
```

Later phases add `pipeline/`, `retrieval/`, and `story/` under `app/`.
