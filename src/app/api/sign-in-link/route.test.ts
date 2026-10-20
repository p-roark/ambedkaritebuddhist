// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb, type TestSqlite } from '@/test/sqlite-db';

const state = vi.hoisted(() => ({ sqlite: null as unknown as TestSqlite, db: null as unknown }));

vi.mock('@/db', () => ({ getDb: () => state.db }));
// Capture sign-in emails instead of calling Gmail
const sendMock = vi.hoisted(() => vi.fn(async (message: { to: string; url: string }) => Boolean(message)));
vi.mock('@/lib/emails/sign-in', () => ({ sendSignInLinkEmail: sendMock }));
const backgroundTasks = vi.hoisted(() => [] as Promise<unknown>[]);
vi.mock('@/lib/background', () => ({
  runInBackground: (_label: string, task: Promise<unknown>) => void backgroundTasks.push(task),
}));
const settle = async () => {
  while (backgroundTasks.length) await Promise.allSettled(backgroundTasks.splice(0));
};

const { POST } = await import('./route');
const { consumeSignInLink } = await import('@/lib/email-sign-in');
const { clearFeatureFlagsCache } = await import('@/lib/feature-flags-server');

const request = (body: unknown, ip = '203.0.113.7') =>
  POST(new NextRequest('https://abcc.example/api/sign-in-link', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'cf-connecting-ip': ip },
  }));

/** Email and token from the link in the last captured email. */
async function lastLink() {
  await settle();
  const call = sendMock.mock.calls.at(-1);
  if (!call) return null;
  const url = new URL(call[0].url);
  return { to: call[0].to, url, email: url.searchParams.get('email') ?? '', token: url.searchParams.get('token') ?? '' };
}

function setFlag(key: string, enabled: boolean) {
  state.sqlite
    .prepare('INSERT OR REPLACE INTO "FeatureFlag" (key, enabled, updatedBy, updatedAt) VALUES (?, ?, ?, ?)')
    .run(key, enabled ? 1 : 0, 'admin@example.com', '2026-10-18');
  clearFeatureFlagsCache();
}

beforeEach(() => {
  const { sqlite, db } = createTestDb();
  state.sqlite = sqlite;
  state.db = db;
  sendMock.mockClear();
  backgroundTasks.length = 0;
  clearFeatureFlagsCache();
  sqlite
    .prepare('INSERT INTO "User" (id, name, email, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run('u1', 'Savitri Phule', 'member@example.com', '', 'MEMBER', '2026-10-01', '2026-10-01');
  sqlite
    .prepare('INSERT INTO "ReferralCode" (id, code, ownerId, maxUses, currentUses, active) VALUES (?, ?, ?, ?, ?, ?)')
    .run('rc1', 'BHIM-ABC-1234', 'u1', 10, 0, 1);
});

describe('POST /api/sign-in-link', () => {
  it('is unavailable while the switch is off (the default)', async () => {
    expect((await request({ email: 'member@example.com' })).status).toBe(403);
    await settle();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('emails an existing member a link that signs them in once', async () => {
    setFlag('emailSignIn', true);
    const res = await request({ email: ' Member@Example.com ', callbackUrl: '/profile' });
    expect(res.status).toBe(200);

    const link = await lastLink();
    expect(link?.to).toBe('member@example.com');
    expect(`${link!.url.origin}${link!.url.pathname}`).toBe('https://abcc.example/auth/email-link');
    expect(link?.url.searchParams.get('callbackUrl')).toBe('/profile');

    // Only the hash is stored
    const stored = state.sqlite.prepare('SELECT tokenHash FROM "SignInLink"').all() as Array<{ tokenHash: string }>;
    expect(stored).toHaveLength(1);
    expect(stored[0].tokenHash).not.toBe(link?.token);

    expect(await consumeSignInLink('other@example.com', link!.token)).toBeNull(); // wrong email
    expect(await consumeSignInLink('member@example.com', link!.token)).toBe('member@example.com');
    expect(await consumeSignInLink('member@example.com', link!.token)).toBeNull(); // already used
  });

  it('sends nothing to an unknown email but replies the same way', async () => {
    setFlag('emailSignIn', true);
    const res = await request({ email: 'stranger@example.com' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    await settle();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('lets a new person sign in from a valid invite link, but not a used-up one', async () => {
    setFlag('emailSignIn', true);
    expect((await request({ email: 'new@example.com', callbackUrl: '/join?code=BHIM-ABC-1234' })).status).toBe(200);
    expect((await lastLink())?.to).toBe('new@example.com');

    sendMock.mockClear();
    state.sqlite.prepare('UPDATE "ReferralCode" SET currentUses = maxUses').run();
    expect((await request({ email: 'other.new@example.com', callbackUrl: '/join?code=BHIM-ABC-1234' })).status).toBe(200);
    await settle();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('does not accept invite links while new member registration is paused', async () => {
    setFlag('emailSignIn', true);
    setFlag('memberRegistration', false);
    await request({ email: 'new@example.com', callbackUrl: '/join?code=BHIM-ABC-1234' });
    await settle();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('rejects expired links', async () => {
    setFlag('emailSignIn', true);
    await request({ email: 'member@example.com' });
    const link = await lastLink();
    state.sqlite.prepare('UPDATE "SignInLink" SET expiresAt = ?').run('2000-01-01T00:00:00.000Z');
    expect(await consumeSignInLink('member@example.com', link!.token)).toBeNull();
  });

  it('limits links per email and per network address', async () => {
    setFlag('emailSignIn', true);
    for (let i = 0; i < 3; i++) expect((await request({ email: 'member@example.com' }, `198.51.100.${i}`)).status).toBe(200);
    expect((await request({ email: 'member@example.com' }, '198.51.100.9')).status).toBe(429);

    for (let i = 0; i < 7; i++) {
      state.sqlite
        .prepare('INSERT INTO "User" (id, name, email, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(`x${i}`, 'X', `x${i}@example.com`, '', 'MEMBER', '2026-10-01', '2026-10-01');
      expect((await request({ email: `x${i}@example.com` }, '192.0.2.1')).status).toBe(200);
    }
    state.sqlite
      .prepare('INSERT INTO "User" (id, name, email, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run('x9', 'X', 'x9@example.com', '', 'MEMBER', '2026-10-01', '2026-10-01');
    // 3 earlier links from 198.51.100.x don't count; 7 from 192.0.2.1 do — 10 allowed per hour
    for (let i = 0; i < 3; i++) await request({ email: 'x9@example.com' }, '192.0.2.1');
    expect((await request({ email: 'x0@example.com' }, '192.0.2.1')).status).toBe(429);
  });

  it('validates the email and ignores off-site callback URLs', async () => {
    setFlag('emailSignIn', true);
    expect((await request({ email: 'not-an-email' })).status).toBe(400);
    await request({ email: 'member@example.com', callbackUrl: 'https://evil.example/' });
    expect((await lastLink())?.url.searchParams.get('callbackUrl')).toBeNull();
  });
});
