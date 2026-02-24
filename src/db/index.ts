import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

function getLegacyDbBinding() {
  const cloudflareRequestContextSymbol = Symbol.for('__cloudflare-request-context__');
  const requestContext = (
    globalThis as unknown as {
      [key: symbol]: { env?: { DB?: D1Database } } | undefined;
    }
  )[cloudflareRequestContextSymbol];

  const d1FromRequest = requestContext?.env?.DB;
  const globalContext = (
    globalThis as unknown as {
      __cloudflareContext?: { env?: { DB?: D1Database } };
    }
  ).__cloudflareContext;

  return d1FromRequest ?? globalContext?.env?.DB;
}

export function getDb() {
  const d1 =
    getCloudflareContext({ async: false }).env?.DB ?? getLegacyDbBinding();

  if (!d1) {
    throw new Error(
      'D1 binding not found. Ensure wrangler.toml has binding `DB`, run `pnpm dev` for local bindings, and redeploy after binding changes.'
    );
  }

  return drizzle(d1, { schema });
}

export type DrizzleDb = ReturnType<typeof getDb>;

