// @vitest-environment node
import { AsyncLocalStorage } from 'node:async_hooks';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as schema from '@/db/schema';

// node:sqlite (Node 22+) is loaded at runtime: Vite can't bundle it and
// @types/node 20 has no typings for it.
type SqliteStatement = {
  run: (...params: unknown[]) => unknown;
  all: (...params: unknown[]) => unknown[];
  get: (...params: unknown[]) => unknown;
};
type DatabaseSync = { exec: (sql: string) => void; prepare: (sql: string) => SqliteStatement };
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as {
  DatabaseSync: new (location: string) => DatabaseSync;
};

// In-memory SQLite with every D1 migration applied, exposed through drizzle's
// proxy driver so the route's real queries run against real SQL.
const state = vi.hoisted(() => ({
  sqlite: null as unknown as DatabaseSync,
  db: null as unknown,
  sessionEmail: null as string | null,
  sessionRole: 'MEMBER',
  // Per-request session override, so concurrent requests can be different users
  requestEmail: null as unknown as { getStore: () => string | undefined },
}));

vi.mock('@/db', () => ({ getDb: () => state.db }));
vi.mock('@/lib/auth', () => ({
  auth: async () => {
    const email = state.requestEmail.getStore() ?? state.sessionEmail;
    return email ? { user: { email, name: 'Test User', image: null, role: state.sessionRole } } : null;
  },
}));

const requestEmail = new AsyncLocalStorage<string>();
state.requestEmail = requestEmail;

const { GET: getRegistration, POST: completeRegistration } = await import('./route');
const { GET: validateCode } = await import('./validate/route');
const { GET: getProfile } = await import('../profile/route');
const { GET: getStatus } = await import('../me/status/route');

function createDb() {
  const sqlite = new DatabaseSync(':memory:');
  const dir = path.resolve(__dirname, '../../../../migrations');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(path.join(dir, file), 'utf8'));
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

const validForm = {
  name: 'Savitri Phule',
  phone: '416-555-0123',
  addressLine1: '100 Queen St W',
  city: 'Toronto',
  province: 'ON',
  postalCode: 'M5H 2N2',
  residencyStatus: 'CITIZEN',
  disclaimerAccepted: true,
};

function post(body: unknown) {
  return completeRegistration(
    new NextRequest('http://localhost/api/registration', { method: 'POST', body: JSON.stringify(body) }),
  );
}

function seedCode(code: string, opts: { maxUses?: number; currentUses?: number; active?: boolean } = {}) {
  state.sqlite
    .prepare('INSERT INTO "ReferralCode" (id, code, ownerId, maxUses, currentUses, active) VALUES (?, ?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), code, 'admin-1', opts.maxUses ?? 10, opts.currentUses ?? 0, opts.active === false ? 0 : 1);
}

function seedUser(email: string, fields: { referredBy?: string | null; role?: string; registrationCompletedAt?: string | null } = {}) {
  state.sqlite
    .prepare('INSERT INTO "User" (id, name, email, passwordHash, role, referredBy, registrationCompletedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(crypto.randomUUID(), 'Existing', email, '', fields.role ?? 'MEMBER', fields.referredBy ?? null, fields.registrationCompletedAt ?? null, '2026-01-01', '2026-01-01');
}

function codeUses(code: string) {
  return (state.sqlite.prepare('SELECT currentUses FROM "ReferralCode" WHERE code = ?').get(code) as { currentUses: number }).currentUses;
}

function userRow(email: string) {
  return state.sqlite.prepare('SELECT * FROM "User" WHERE email = ?').get(email) as Record<string, unknown> | undefined;
}

beforeEach(() => {
  const { sqlite, db } = createDb();
  state.sqlite = sqlite;
  state.db = db;
  state.sessionEmail = 'new.member@example.com';
  state.sessionRole = 'MEMBER';
  seedUser('admin@example.com', { role: 'ADMIN' });
  state.sqlite.prepare('UPDATE "User" SET id = ? WHERE email = ?').run('admin-1', 'admin@example.com');
});

describe('POST /api/registration', () => {
  it('registers a new member with a valid invite code', async () => {
    seedCode('BHIM-ABC-1234');
    const res = await post({ ...validForm, code: 'bhim-abc-1234' });

    expect(res.status).toBe(200);
    const user = userRow('new.member@example.com');
    expect(user).toMatchObject({
      name: 'Savitri Phule',
      phone: '416-555-0123',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5H 2N2',
      residencyStatus: 'CITIZEN',
      referredBy: 'BHIM-ABC-1234',
      role: 'MEMBER',
      disclaimerVersion: expect.any(String),
    });
    expect(user?.registrationCompletedAt).toBeTruthy();
    expect(user?.disclaimerAcceptedAt).toBeTruthy();
    expect(codeUses('BHIM-ABC-1234')).toBe(1);
  });

  it('rejects new members without an invite code', async () => {
    const res = await post(validForm);
    expect(res.status).toBe(400);
    expect(userRow('new.member@example.com')).toBeUndefined();
  });

  it('rejects inactive and exhausted codes without using them', async () => {
    seedCode('BHIM-OFF-0000', { active: false });
    seedCode('BHIM-FUL-0000', { maxUses: 2, currentUses: 2 });

    expect((await post({ ...validForm, code: 'BHIM-OFF-0000' })).status).toBe(400);
    expect((await post({ ...validForm, code: 'BHIM-FUL-0000' })).status).toBe(400);
    expect(codeUses('BHIM-FUL-0000')).toBe(2);
    expect(userRow('new.member@example.com')).toBeUndefined();
  });

  it('does not use the code when the form is invalid', async () => {
    seedCode('BHIM-ABC-1234');
    const res = await post({ ...validForm, disclaimerAccepted: false, code: 'BHIM-ABC-1234' });

    expect(res.status).toBe(400);
    const data = (await res.json()) as { fieldErrors: Record<string, string> };
    expect(Object.keys(data.fieldErrors)).toEqual(['disclaimerAccepted']);
    expect(codeUses('BHIM-ABC-1234')).toBe(0);
  });

  // The use is counted by one conditional UPDATE (currentUses < maxUses), so it
  // holds under concurrency too. Requests run in sequence here because Vitest 1.x
  // cannot resolve a mocked module for parallel dynamic imports.
  it('stops accepting a code once maxUses is reached', async () => {
    seedCode('BHIM-ONE-0001', { maxUses: 1 });
    const results = [];
    for (const email of ['a@example.com', 'b@example.com', 'c@example.com']) {
      results.push(await requestEmail.run(email, () => post({ ...validForm, code: 'BHIM-ONE-0001' })));
    }

    expect(results.map((r) => r.status)).toEqual([200, 400, 400]);
    expect(codeUses('BHIM-ONE-0001')).toBe(1);
    const registered = ['a@example.com', 'b@example.com', 'c@example.com'].filter((e) => userRow(e));
    expect(registered).toHaveLength(1);
  });

  it('lets existing referred members complete the form without a code', async () => {
    seedUser('new.member@example.com', { referredBy: 'BHIM-OLD-0001' });
    const res = await post(validForm);

    expect(res.status).toBe(200);
    expect(userRow('new.member@example.com')).toMatchObject({ referredBy: 'BHIM-OLD-0001', residencyStatus: 'CITIZEN' });
    expect(userRow('new.member@example.com')?.registrationCompletedAt).toBeTruthy();
  });

  it('requires a code for users who were auto-created without one', async () => {
    seedUser('new.member@example.com');
    expect((await post(validForm)).status).toBe(400);
  });

  it('returns 401 when signed out', async () => {
    state.sessionEmail = null;
    expect((await post(validForm)).status).toBe(401);
  });
});

describe('GET /api/registration', () => {
  it('reports status and pre-fills existing details', async () => {
    seedUser('new.member@example.com', { referredBy: 'BHIM-OLD-0001' });
    state.sqlite.prepare('UPDATE "User" SET province = ?, postalCode = ? WHERE email = ?').run('Ontario', 'm5h2n2', 'new.member@example.com');

    const res = await getRegistration();
    const data = (await res.json()) as { registrationStatus: string; prefill: Record<string, string> };
    expect(data.registrationStatus).toBe('profile_required');
    expect(data.prefill).toMatchObject({ email: 'new.member@example.com', province: 'ON', postalCode: 'M5H 2N2' });
  });
});

describe('GET /api/registration/validate', () => {
  const check = async (code: string) =>
    (await validateCode(new NextRequest(`http://localhost/api/registration/validate?code=${code}`))).json();

  it('validates codes without using them', async () => {
    seedCode('BHIM-ABC-1234');
    seedCode('BHIM-OFF-0000', { active: false });
    seedCode('BHIM-FUL-0000', { maxUses: 1, currentUses: 1 });

    expect(await check('BHIM-ABC-1234')).toEqual({ valid: true });
    expect(await check('BHIM-OFF-0000')).toEqual({ valid: false, reason: 'inactive' });
    expect(await check('BHIM-FUL-0000')).toEqual({ valid: false, reason: 'exhausted' });
    expect(await check('BHIM-NOP-0000')).toEqual({ valid: false, reason: 'invalid' });
    expect(await check('garbage')).toEqual({ valid: false, reason: 'invalid' });
    expect(codeUses('BHIM-ABC-1234')).toBe(0);
  });
});

describe('member-only routes', () => {
  it('no longer auto-create users for signed-in visitors', async () => {
    const status = await getStatus();
    expect(await status.json()).toMatchObject({ isMember: false, registrationStatus: 'invite_required' });

    const profile = await getProfile(new NextRequest('http://localhost/api/profile'));
    expect(profile.status).toBe(403);
    expect(userRow('new.member@example.com')).toBeUndefined();
  });

  it('serve registered members', async () => {
    seedUser('new.member@example.com', { referredBy: 'BHIM-OLD-0001', registrationCompletedAt: '2026-10-15T00:00:00Z' });
    const profile = await getProfile(new NextRequest('http://localhost/api/profile'));
    expect(profile.status).toBe(200);
  });
});
