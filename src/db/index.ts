import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * Returns a Drizzle client bound to the Cloudflare D1 database.
 *
 * The __cloudflareContext global is injected by:
 *   - setupDevPlatform() during `next dev` (reads wrangler.toml locally)
 *   - The Cloudflare Pages runtime in production
 *
 * Call this inside API route handlers — not at module level.
 */
export function getDb() {
  const ctx = (
    globalThis as unknown as {
      __cloudflareContext?: { env?: { DB?: D1Database } };
    }
  ).__cloudflareContext;

  const d1 = ctx?.env?.DB;

  if (!d1) {
    throw new Error(
      'D1 binding not found. ' +
      'Locally: make sure wrangler.toml has your database_name + database_id, then run `pnpm dev` (setupDevPlatform wires it up). ' +
      'In production: verify the DB binding is set in Cloudflare Pages settings.'
    );
  }

  return drizzle(d1, { schema });
}

export type DrizzleDb = ReturnType<typeof getDb>;
