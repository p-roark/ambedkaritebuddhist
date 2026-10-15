// In-memory SQLite with every D1 migration applied, exposed through drizzle's
// proxy driver so API routes run their real queries against real SQL in tests.
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from '@/db/schema';

// node:sqlite (Node 22+) is loaded at runtime: Vite can't bundle it and
// @types/node 20 has no typings for it.
type SqliteStatement = {
  run: (...params: unknown[]) => unknown;
  all: (...params: unknown[]) => unknown[];
  get: (...params: unknown[]) => unknown;
};
export type TestSqlite = { exec: (sql: string) => void; prepare: (sql: string) => SqliteStatement };
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as {
  DatabaseSync: new (location: string) => TestSqlite;
};

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

export function createTestDb() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
  }
  const db = drizzle(async (query, params, method) => {
    const stmt = sqlite.prepare(query);
    const args = params as unknown[];
    if (method === 'run') {
      stmt.run(...args);
      return { rows: [] };
    }
    const rows = stmt.all(...args).map((row) => Object.values(row as Record<string, unknown>));
    return { rows: method === 'get' ? rows[0] : rows };
  }, { schema });
  return { sqlite, db };
}
