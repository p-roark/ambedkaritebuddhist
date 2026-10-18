import { and, count, eq, gt, lt } from 'drizzle-orm';
import { getDb } from '@/db';
import { signInLinks } from '@/db/schema';

/** How long an emailed sign-in link works. */
export const SIGN_IN_LINK_TTL_MS = 15 * 60_000;

// Limits on requesting links, so the form can't be used to flood an inbox
const EMAIL_WINDOW_MS = 15 * 60_000;
const MAX_LINKS_PER_EMAIL = 3;
const IP_WINDOW_MS = 60 * 60_000;
const MAX_LINKS_PER_IP = 10;

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export type CreateSignInLinkResult = { ok: true; token: string } | { ok: false; reason: 'rate_limited' };

/**
 * Creates a one-time sign-in token for `email`. Only its hash is stored; the
 * token itself goes in the emailed link.
 */
export async function createSignInLink(email: string, ip: string | null): Promise<CreateSignInLinkResult> {
  const db = getDb();
  const now = Date.now();

  // Clean up expired links
  await db.delete(signInLinks).where(lt(signInLinks.expiresAt, new Date(now).toISOString()));

  const [byEmail] = await db
    .select({ n: count() })
    .from(signInLinks)
    .where(and(eq(signInLinks.email, email), gt(signInLinks.createdAt, new Date(now - EMAIL_WINDOW_MS).toISOString())));
  if (byEmail.n >= MAX_LINKS_PER_EMAIL) return { ok: false, reason: 'rate_limited' };

  if (ip) {
    const [byIp] = await db
      .select({ n: count() })
      .from(signInLinks)
      .where(and(eq(signInLinks.ip, ip), gt(signInLinks.createdAt, new Date(now - IP_WINDOW_MS).toISOString())));
    if (byIp.n >= MAX_LINKS_PER_IP) return { ok: false, reason: 'rate_limited' };
  }

  const token = randomToken();
  await db.insert(signInLinks).values({
    tokenHash: await sha256Hex(token),
    email,
    ip,
    expiresAt: new Date(now + SIGN_IN_LINK_TTL_MS).toISOString(),
    createdAt: new Date(now).toISOString(),
  });
  return { ok: true, token };
}

/**
 * Uses up a sign-in link. Returns the email it was sent to, or null if the
 * link is unknown, expired, already used or for a different email. The single
 * DELETE … RETURNING makes each link work only once, even if opened twice at
 * the same moment.
 */
export async function consumeSignInLink(email: string, token: string): Promise<string | null> {
  if (!email || !/^[0-9a-f]{64}$/.test(token)) return null;
  const rows = await getDb()
    .delete(signInLinks)
    .where(and(
      eq(signInLinks.tokenHash, await sha256Hex(token)),
      eq(signInLinks.email, email),
      gt(signInLinks.expiresAt, new Date().toISOString()),
    ))
    .returning({ email: signInLinks.email });
  return rows[0]?.email ?? null;
}

/** Link the member clicks; it opens a page with a "Sign in" button (see /auth/email-link). */
export function buildSignInUrl(origin: string, email: string, token: string, callbackUrl: string): string {
  const params = new URLSearchParams({ email, token });
  if (callbackUrl !== '/') params.set('callbackUrl', callbackUrl);
  return `${origin.replace(/\/+$/, '')}/auth/email-link?${params.toString()}`;
}
