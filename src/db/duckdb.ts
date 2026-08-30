import * as duckdb from '@duckdb/duckdb-wasm';
import duckdbWasmMvp from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdbWorkerMvp from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdbWasmEh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import duckdbWorkerEh from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import type { Transaction } from '../data/types';

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

export function getDb(): Promise<duckdb.AsyncDuckDB> {
  if (!dbPromise) {
    dbPromise = initDb();
  }
  return dbPromise;
}

async function initDb(): Promise<duckdb.AsyncDuckDB> {
  const bundles: duckdb.DuckDBBundles = {
    mvp: {
      mainModule: duckdbWasmMvp,
      mainWorker: duckdbWorkerMvp,
    },
    eh: {
      mainModule: duckdbWasmEh,
      mainWorker: duckdbWorkerEh,
    },
  };
  const bundle = await duckdb.selectBundle(bundles);
  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  return db;
}

export async function loadTransactions(transactions: Transaction[]): Promise<void> {
  const db = await getDb();
  const conn = await db.connect();
  try {
    await db.registerFileText('transactions.json', JSON.stringify(transactions));
    await conn.query(`
      CREATE OR REPLACE TABLE transactions AS
      SELECT
        id,
        CAST(date AS DATE) AS date,
        merchant,
        category,
        CAST(amount AS DOUBLE) AS amount
      FROM read_json_auto('transactions.json')
    `);
  } finally {
    await conn.close();
  }
}

export function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runQuery<T = Record<string, any>>(sql: string): Promise<T[]> {
  const db = await getDb();
  const conn = await db.connect();
  try {
    const table = await conn.query(sql);
    const fields = table.schema.fields.map((f) => f.name);
    const rows: T[] = [];
    for (const row of table) {
      const obj: Record<string, unknown> = {};
      for (const field of fields) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let value: any = (row as any)[field];
        if (typeof value === 'bigint') value = Number(value);
        if (value && typeof value === 'object' && 'toISOString' in value) {
          value = (value as Date).toISOString().slice(0, 10);
        }
        obj[field] = value;
      }
      rows.push(obj as T);
    }
    return rows;
  } finally {
    await conn.close();
  }
}
