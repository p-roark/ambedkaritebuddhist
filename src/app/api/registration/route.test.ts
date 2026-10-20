// @vitest-environment node
import { AsyncLocalStorage } from 'node:async_hooks';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb, type TestSqlite } from '@/test/sqlite-db';

// Real migrations on in-memory SQLite (see src/test/sqlite-db.ts)
const state = vi.hoisted(() => ({
  sqlite: null as unknown as TestSqlite,
  db: null as unknown,
  sessionEmail: null as string | null,
  sessionRole: 'MEMBER',
  // Per-request session override, so concurrent requests can be different users
  requestEmail: null as unknown as { getStore: () => string | undefined },
}));

vi.mock('@/db', () => ({ getDb: () => state.db }));
// Capture emails instead of calling Gmail
const sendEmailMock = vi.hoisted(() => vi.fn(async () => true));
vi.mock('@/lib/email', () => ({ sendEmail: sendEmailMock }));
// Collect background work so each test can wait for it (no leaking into the next test)
const backgroundTasks = vi.hoisted(() => [] as Promise<unknown>[]);
vi.mock('@/lib/background', () => ({
  runInBackground: (_label: string, task: Promise<unknown>) => void backgroundTasks.push(task),
}));
const settleBackground = async () => {
  while (backgroundTasks.length) await Promise.allSettled(backgroundTasks.splice(0));
};
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
const { clearFeatureFlagsCache } = await import('@/lib/feature-flags-server');

const validForm = {
  name: 'Savitri Phule',
  phone: '416-555-0123',
  addressLine1: '100 Queen St W',
  city: 'Toronto',
  province: 'ON',
  postalCode: 'M5H 2N2',
  residencyStatus: 'CITIZEN',
  ageConfirmed: true,
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

afterEach(settleBackground);

beforeEach(() => {
  sendEmailMock.mockClear();
  const { sqlite, db } = createTestDb();
  clearFeatureFlagsCache();
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
    expect(user?.ageConfirmedAt).toBeTruthy();
    expect(user?.boardInterest).toBe(0);
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

  it('pre-selects Ontario when no province is saved', async () => {
    seedUser('new.member@example.com', { referredBy: 'BHIM-OLD-0001' });
    state.sqlite.prepare('UPDATE "User" SET province = ? WHERE email = ?').run('BC', 'new.member@example.com');
    expect(((await (await getRegistration()).json()) as { prefill: { province: string } }).prefill.province).toBe('BC');

    state.sqlite.prepare('UPDATE "User" SET province = NULL WHERE email = ?').run('new.member@example.com');
    expect(((await (await getRegistration()).json()) as { prefill: { province: string } }).prefill.province).toBe('ON');
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

describe('memberRegistration switch', () => {
  function pauseRegistration() {
    state.sqlite
      .prepare('INSERT INTO "FeatureFlag" (key, enabled, updatedBy, updatedAt) VALUES (?, ?, ?, ?)')
      .run('memberRegistration', 0, 'admin@example.com', '2026-10-15');
    clearFeatureFlagsCache();
  }

  it('pauses new registrations without using the code', async () => {
    seedCode('BHIM-ABC-1234');
    pauseRegistration();

    expect((await post({ ...validForm, code: 'BHIM-ABC-1234' })).status).toBe(403);
    expect(codeUses('BHIM-ABC-1234')).toBe(0);
    const validation = await validateCode(new NextRequest('http://localhost/api/registration/validate?code=BHIM-ABC-1234'));
    expect(await validation.json()).toEqual({ valid: false, reason: 'paused' });
  });

  it('still lets existing members complete their details', async () => {
    seedUser('new.member@example.com', { referredBy: 'BHIM-OLD-0001' });
    pauseRegistration();
    expect((await post(validForm)).status).toBe(200);
  });
});

describe('registration emails', () => {
  const orgEmail = () =>
    (state.sqlite.prepare('SELECT email FROM "OrganizationSettings" WHERE id = ?').get('main') as { email: string }).email;
  type SentEmail = [string, { to: string | string[]; subject: string; html: string }];
  const sent = () => sendEmailMock.mock.calls as unknown as SentEmail[];

  it('welcomes new members and sends the notice to the organization email by default', async () => {
    seedCode('BHIM-ABC-1234');
    expect((await post({ ...validForm, name: "Ravi D'Souza-Kamble", boardInterest: true, code: 'BHIM-ABC-1234' })).status).toBe(200);

    await settleBackground();
    expect(sendEmailMock).toHaveBeenCalledTimes(2);
    const welcome = sent().find(([, m]) => m.to === 'new.member@example.com');
    const notice = sent().find(([, m]) => m.to !== 'new.member@example.com');
    expect(welcome?.[0]).toBe('registrations');
    expect(welcome?.[1].html).toContain('Welcome, Ravi D&#39;Souza-Kamble!');
    expect(welcome?.[1].html).toContain('http://localhost/profile');
    expect(notice?.[0]).toBe('registrations');
    expect(notice?.[1].to).toBe(orgEmail());
    expect(notice?.[1].subject).toBe("New member registered: Ravi D'Souza-Kamble");
    expect(notice?.[1].html).toContain('BHIM-ABC-1234');
    expect(notice?.[1].html).toContain('Canadian Citizen');
    expect(notice?.[1].html).toMatch(/Board \/ committee interest.*Yes/s);
    expect(userRow('new.member@example.com')?.boardInterest).toBe(1);
    expect(notice?.[1].html).not.toContain("D'Souza");
  });

  it('sends the notice to the Registrations address when one is set', async () => {
    state.sqlite
      .prepare('INSERT INTO "EmailSender" (purpose, address, updatedBy, updatedAt) VALUES (?, ?, ?, ?)')
      .run('registrations', 'registrations@example.org', 'admin@example.com', '2026-10-17');
    seedCode('BHIM-ABC-1234');
    expect((await post({ ...validForm, code: 'BHIM-ABC-1234' })).status).toBe(200);

    await settleBackground();
    expect(sent().map(([, m]) => m.to).sort()).toEqual(['new.member@example.com', 'registrations@example.org']);
  });

  it('only sends the notice when an existing member completes the form', async () => {
    seedUser('new.member@example.com', { referredBy: 'BHIM-OLD-0001' });
    expect((await post(validForm)).status).toBe(200);

    await settleBackground();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sent()[0][1].subject).toBe('Existing member completed registration: Savitri Phule');
  });

  it('sends nothing when registration fails', async () => {
    expect((await post(validForm)).status).toBe(400); // no invite code
    await settleBackground();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
