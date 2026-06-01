// In-browser SQL engine. DuckDB-WASM runs every query locally against the
// Parquet files in public/data, fetched lazily over HTTP range requests. No
// backend is involved in execution; this module is the whole data layer.
import * as duckdb from '@duckdb/duckdb-wasm';
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import ehWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';

// The 17 data tables built by the ETL (etl/build_parquet.py). Each is exposed
// as a view of the same name so queries read like plain SQL: `SELECT ... FROM
// Wells`, no Parquet paths in user-facing SQL.
const TABLES = [
  'Analysis_Items',
  'Boreholes',
  'Chemical_Analysis',
  'Driller_Drilling_Company',
  'Drillers',
  'Drilling_Companies',
  'Elements',
  'Geophysical_Logs',
  'Lithologies',
  'Other_Seals',
  'Perforations',
  'Pump_Test_Items',
  'Pump_Tests',
  'Screens',
  'Well_Owners',
  'Well_Reports',
  'Wells',
] as const;

// Served as static assets; BASE_URL keeps this correct under a subpath deploy.
const dataUrl = (table: string) =>
  new URL(`${import.meta.env.BASE_URL}data/${table}.parquet`, window.location.href).href;

export interface ResultColumn {
  name: string;
  type: string;
}

export interface QueryResult {
  columns: ResultColumn[];
  rows: Record<string, unknown>[];
}

// Self-hosted bundles (via Vite ?url imports) instead of a CDN, so the app
// works offline and on GitHub Pages without a third-party runtime dependency.
const BUNDLES: duckdb.DuckDBBundles = {
  mvp: { mainModule: mvpWasm, mainWorker: mvpWorker },
  eh: { mainModule: ehWasm, mainWorker: ehWorker },
};

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;
let connPromise: Promise<duckdb.AsyncDuckDBConnection> | null = null;

async function initDb(): Promise<duckdb.AsyncDuckDB> {
  const bundle = await duckdb.selectBundle(BUNDLES);
  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  // Registering a file URL and creating its view does not fetch any data; the
  // first query that touches a table reads only the Parquet footer plus the
  // columns and row groups it needs.
  const conn = await db.connect();
  try {
    for (const table of TABLES) {
      await db.registerFileURL(
        `${table}.parquet`,
        dataUrl(table),
        duckdb.DuckDBDataProtocol.HTTP,
        false
      );
      await conn.query(
        `CREATE VIEW IF NOT EXISTS "${table}" AS SELECT * FROM read_parquet('${table}.parquet')`
      );
    }
  } finally {
    await conn.close();
  }
  return db;
}

async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (!dbPromise) {
    dbPromise = initDb();
  }
  if (!connPromise) {
    connPromise = dbPromise.then((db) => db.connect());
  }
  return connPromise;
}

// Kick off initialisation ahead of the first query (e.g. on page mount) so the
// wasm download and view setup overlap with the user typing. Safe to call more
// than once; the work happens only once.
export function warmUp(): void {
  void getConnection().catch(() => {
    // Swallow here; the next runQuery surfaces the real error to the user.
  });
}

export async function runQuery(sql: string): Promise<QueryResult> {
  const conn = await getConnection();
  const table = await conn.query(sql);

  const columns: ResultColumn[] = table.schema.fields.map((field) => ({
    name: field.name,
    type: String(field.type),
  }));

  const rows = table.toArray().map((row) => {
    const record: Record<string, unknown> = {};
    for (const column of columns) {
      record[column.name] = row[column.name];
    }
    return record;
  });

  return { columns, rows };
}
