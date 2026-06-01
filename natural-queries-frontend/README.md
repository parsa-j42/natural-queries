# Natural Queries

Natural Queries turns plain-English questions into SQL against a groundwater well
database. It has two modes:

- **Playground** - type a question, get generated SQL with an explanation, and run it.
- **Story** - guided, chapter-based lessons that build up SQL skills.

The frontend is built with [Vite](https://vitejs.dev/), [React](https://react.dev/),
[TypeScript](https://www.typescriptlang.org/) and [Mantine](https://mantine.dev/).
SQL execution is real: every query runs locally in the browser with DuckDB-WASM
against Parquet files (no server round-trip). Query *generation* and Story-mode
lessons come from the backend (`POST /generate`, `POST /story`); set `VITE_API_URL`
to point at it (defaults to `http://localhost:8000`).

## Data layer (DuckDB-WASM)

`src/db/duckdb.ts` boots DuckDB-WASM in a Web Worker and registers each table in
`public/data/*.parquet` as a view of the same name, so queries read like plain SQL
(`SELECT ... FROM Wells`). Files are fetched lazily over HTTP range requests, so a
query only pulls the columns and row groups it touches. `runQuery(sql)` returns the
result columns and rows; `src/db/format.ts` renders the Arrow values (BigInt,
timestamps, nulls) for display.

The Parquet files are produced by the backend ETL (see
`natural-queries-backend/etl/README.md`) and are gitignored. To point at a different
data location, change the base URL in `src/db/duckdb.ts`.

## Requirements

- Node `24` (see `.nvmrc`)
- Yarn `4` (Corepack)

```sh
nvm use
yarn install
```

## Scripts

- `yarn dev` - start the dev server
- `yarn build` - type-check and build for production
- `yarn preview` - preview the production build locally
- `yarn typecheck` - run the TypeScript compiler with no emit
- `yarn lint` - run ESLint and Stylelint
- `yarn test` - run the Vitest unit/component suite
- `yarn test:watch` - Vitest in watch mode
- `yarn test:e2e` - run the Playwright end-to-end tests
- `yarn prettier` / `yarn prettier:write` - check / format with Prettier
- `yarn deploy` - build and publish to GitHub Pages

## Testing

Two layers, because DuckDB-WASM (Web Worker + WASM) does not run in jsdom:

- **Vitest + React Testing Library** for logic and components: `formatCell`, the API
  client (mocked `fetch`), the grader's feedback branches (DuckDB layer mocked), and
  the `ResultsPanel` component. Fast, no browser. Run with `yarn test`. The render
  helper that wraps components in `MantineProvider` lives in `test-utils/`.
- **Playwright** for the real flows in `e2e/`: the Playground (generate then run) and
  Story mode (generate then grade). The backend is mocked per-test via request
  interception, so no API keys are needed; the dev server serves the real Parquet so
  the in-browser SQL engine runs for real.

The E2E tests need the browser binary and the Parquet data present:

```sh
npx playwright install chromium     # one-time browser download
# ensure natural-queries-frontend/public/data/*.parquet exists (from the ETL)
yarn test:e2e
```
