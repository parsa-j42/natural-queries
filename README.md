# Natural Queries

Ask a question about Alberta's groundwater in plain English, get correct SQL back,
and run it on real data, all in the browser.

Natural Queries turns ~8.8 million rows of Alberta water-well records (a 2 GB
Microsoft Access database) into a fast, private, in-browser SQL sandbox, paired with
a Python backend that translates natural language into validated SQL.

Two modes:

- **Playground** - type a question, get generated SQL with a step-by-step
  explanation, and execute it against the real data.
- **Story** - guided, chapter-based lessons that teach SQL, graded by actually
  running your query and comparing results.

## How it works

```
┌──────────────────────────────────────────────────────────────────┐
│  BROWSER  (static site on GitHub Pages)                            │
│                                                                    │
│   React / Mantine UI                                               │
│      ├─ DuckDB-WASM ── runs ALL SQL locally over Parquet files     │
│      │                  (and grades Story answers by comparing     │
│      │                   result sets)                              │
│      └─ POST /generate, /story ─────────────┐                      │
└─────────────────────────────────────────────┼─────────────────────┘
                                               │ HTTP/JSON (optional BYO key)
┌──────────────────────────────────────────────▼────────────────────┐
│  BACKEND  (Python / FastAPI on Render)                             │
│   /generate : question ─> agentic pipeline ─> validated SQL        │
│                 ├─ schema retrieval (RAG)                          │
│                 ├─ multi-provider LLM (Gemini / Groq / Claude)     │
│                 └─ generate ─> validate (sqlglot + DuckDB) ─> repair│
│   /story     : generate guided lessons with runnable solutions     │
│   /providers : list selectable models                              │
└────────────────────────────────────────────────────────────────────┘

   BUILD TIME:  Well_Reports.mdb (2 GB) ──ETL──> Parquet (84 MB, 17 files)
```

The database lives in the browser. The backend never stores or queries the well
data; it only generates SQL, which the browser executes. That keeps hosting cheap (a
static site plus a small stateless API) and makes every session a private sandbox.

### The four ideas

- **ETL** turns the 2 GB Access database into clean, compressed Parquet the browser
  can load (`mdbtools` -> pandas/DuckDB -> zstd Parquet).
- **DuckDB-WASM** is a real SQL engine running inside the browser, range-fetching
  only the columns and row groups a query touches.
- **RAG** selects the relevant slice of the schema for a question before prompting
  the model (cheaper, more accurate).
- **Agentic pipeline** generates SQL, validates it against the schema (parse,
  read-only check, and a DuckDB bind-check), and loops back to fix errors before
  returning it.

## Tech

| Area | Choice |
|---|---|
| Frontend | Vite, React, TypeScript, Mantine |
| In-browser SQL | DuckDB-WASM over Parquet |
| Backend | Python, FastAPI |
| LLM providers | Google AI Studio (Gemini), Groq, Anthropic (Claude), with optional bring-your-own-key |
| Validation | sqlglot + DuckDB bind-check |
| Tests | pytest (backend), Vitest + React Testing Library + Playwright (frontend) |
| Hosting | GitHub Pages (frontend) + Render (backend) |

## Layout

```
natural-queries/
├── natural-queries-frontend/   Vite + React app, DuckDB-WASM data layer
├── natural-queries-backend/    FastAPI service: schema, providers, pipeline, story
│   └── etl/                    Access-to-Parquet build
├── docs/DEPLOYMENT.md          deployment runbook
└── render.yaml                 backend deploy blueprint
```

Each half has its own README with the details:
[frontend](natural-queries-frontend/README.md),
[backend](natural-queries-backend/README.md),
[ETL](natural-queries-backend/etl/README.md).

## Run it locally

Backend (Python 3.12+, [uv](https://docs.astral.sh/uv/)):

```sh
cd natural-queries-backend
uv sync
cp .env.example .env            # add GROQ_API_KEY and/or GOOGLE_API_KEY
uv run uvicorn app.main:app --reload --port 8000
```

Frontend (Node 24, Yarn 4 via Corepack):

```sh
cd natural-queries-frontend
yarn install
yarn dev                        # defaults to the backend at http://localhost:8000
```

The Parquet data is produced by the ETL from the source `.mdb` (see the ETL README)
and lands in `natural-queries-frontend/public/data/` (gitignored).

## Tests

```sh
# backend
cd natural-queries-backend && uv run --group etl pytest

# frontend unit/component
cd natural-queries-frontend && yarn test

# frontend end-to-end (needs the browser once: npx playwright install chromium)
cd natural-queries-frontend && yarn test:e2e
```

## Deploying

The frontend auto-deploys to GitHub Pages; the backend deploys to Render from
`render.yaml`; the Parquet data is published as a GitHub Release and pulled into the
Pages build. Full steps are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
