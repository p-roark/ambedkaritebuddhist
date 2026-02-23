import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * Returns a Drizzle client bound to the Cloudflare D1 database.
 *
 * This works in two scenarios:
 *   1. Local `next dev`  — via setupDevPlatform() in next.config.js, which
 *      reads wrangler.toml and emulates the D1 binding locally.
 *   2. Cloudflare Pages — the DB binding is injected by the runtime.
 *
 * Call this function inside every API route / server action handler
 * (not at module level) so the request context is available.
 */
export function getDb() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getRequestContext } = require('@cloudflare/next-on-pages') as {
    getRequestContext: () => { env: Record<string, unknown> };
  };
  const { env } = getRequestContext();
  const d1 = env.DB as D1Database;
  return drizzle(d1, { schema });
}

export type DrizzleDb = ReturnType<typeof getDb>;
