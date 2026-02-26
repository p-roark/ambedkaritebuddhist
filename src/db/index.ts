import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

type CfEnv = {
  DEPLOYMENT?: string;
  DB?: D1Database;
  'DB-PROD'?: D1Database;
};

/**
 * Returns a Drizzle client bound to the Cloudflare D1 database.
 * Picks DB-PROD when env.DEPLOYMENT === 'prod', otherwise DB.
 *
 * The __cloudflareContext global is injected by:
 *   - setupDevPlatform() during `next dev` (reads wrangler.toml locally)
 *   - The Cloudflare Pages runtime in production
 *
 * Call this inside API route handlers — not at module level.
 */
export function getDb() {
  const cloudflareRequestContextSymbol = Symbol.for('__cloudflare-request-context__');
  const requestContext = (
    globalThis as unknown as {
      [key: symbol]: { env?: CfEnv } | undefined;
    }
  )[cloudflareRequestContextSymbol];

  const envFromRequest = requestContext?.env;

  const globalContext = (
    globalThis as unknown as {
      __cloudflareContext?: { env?: CfEnv };
    }
  ).__cloudflareContext;

  const env = envFromRequest ?? globalContext?.env;
  const isProd = (env?.DEPLOYMENT ?? 'dev') === 'prod';
  const d1 = isProd ? env?.['DB-PROD'] : env?.['DB'];

  if (!d1) {
    throw new Error(
      `D1 binding not found (DEPLOYMENT=${isProd ? 'prod' : 'dev'}). ` +
      'Locally: make sure wrangler.toml has your database_name + database_id, then run `pnpm dev`. ' +
      'In production: verify the DB / DB-PROD binding is set in Cloudflare Pages settings.'
    );
  }

  return drizzle(d1, { schema });
}

export type DrizzleDb = ReturnType<typeof getDb>;
