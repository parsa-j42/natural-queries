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
| `GOOGLE_API_KEY` | Google AI Studio key (used from Phase 3) | empty |
| `GROQ_API_KEY` | Groq key (used from Phase 3) | empty |
| `ANTHROPIC_API_KEY` | Anthropic key (used from Phase 3) | empty |

## Development

```bash
uv run ruff check .           # lint
uv run ruff format .          # format
uv run pytest                 # tests
```

## Layout

```
app/
  main.py      FastAPI app, CORS, routes
  config.py    settings loaded from env via pydantic-settings
tests/         pytest suite
```

Future phases add `schema/`, `providers/`, `pipeline/`, `retrieval/`, and
`story/` under `app/`, plus an `etl/` package for the Access-to-Parquet build.
