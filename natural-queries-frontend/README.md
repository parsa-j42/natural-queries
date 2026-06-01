# Natural Queries

Natural Queries turns plain-English questions into SQL against a groundwater well
database. It has two modes:

- **Playground** - type a question, get generated SQL with an explanation, and run it.
- **Story** - guided, chapter-based lessons that build up SQL skills.

The frontend is built with [Vite](https://vitejs.dev/), [React](https://react.dev/),
[TypeScript](https://www.typescriptlang.org/) and [Mantine](https://mantine.dev/).
SQL execution is real: every query runs locally in the browser with DuckDB-WASM
against Parquet files (no server round-trip). Query *generation* is still mocked on
the client and will be replaced by the backend `/generate` API.

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
- `yarn prettier` / `yarn prettier:write` - check / format with Prettier
- `yarn deploy` - build and publish to GitHub Pages
