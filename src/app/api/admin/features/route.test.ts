// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb, type TestSqlite } from '@/test/sqlite-db';

const state = vi.hoisted(() => ({
  sqlite: null as unknown as TestSqlite,
  db: null as unknown,
  session: null as null | { email: string; role: string },
}));

vi.mock('@/db', () => ({ getDb: () => state.db }));
vi.mock('@/lib/auth', () => ({
  auth: async () => (state.session ? { user: { ...state.session, name: 'Test', image: null } } : null),
}));

const { GET: listFeatures, PATCH: updateFeature } = await import('./route');
const { GET: publicFeatures } = await import('../../features/route');
const { POST: donate } = await import('../../donations/route');
const { GET: familyList } = await import('../../profile/family/route');
const { POST: registerForEvent } = await import('../../events/[id]/register/route');
const { clearFeatureFlagsCache } = await import('@/lib/feature-flags-server');

const asAdmin = () => (state.session = { email: 'admin@example.com', role: 'ADMIN' });
const asMember = () => (state.session = { email: 'member@example.com', role: 'MEMBER' });

function patch(body: unknown) {
  return updateFeature(new NextRequest('http://localhost/api/admin/features', { method: 'PATCH', body: JSON.stringify(body) }));
}

async function publicFlags() {
  return ((await (await publicFeatures()).json()) as { flags: Record<string, boolean> }).flags;
}

beforeEach(() => {
  const { sqlite, db } = createTestDb();
  state.sqlite = sqlite;
  state.db = db;
  state.session = null;
  clearFeatureFlagsCache();
  sqlite
    .prepare('INSERT INTO "User" (id, name, email, passwordHash, role, referredBy, registrationCompletedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run('member-1', 'Member', 'member@example.com', '', 'MEMBER', 'BHIM-ABC-1234', '2026-10-01', '2026-10-01', '2026-10-01');
});

describe('admin features API', () => {
  it('lists every switch with defaults', async () => {
    asAdmin();
    const res = await listFeatures(new NextRequest('http://localhost/api/admin/features'));
    const data = (await res.json()) as { features: Array<{ key: string; enabled: boolean; updatedBy: string | null }> };
    expect(data.features.map((f) => f.key)).toEqual(['eventRegistration', 'family', 'memberRegistration', 'donations', 'galleryUpload', 'emailSignIn', 'memberDeletion']);
    expect(data.features.find((f) => f.key === 'emailSignIn')).toMatchObject({ enabled: false });
    expect(data.features.find((f) => f.key === 'memberDeletion')).toMatchObject({ enabled: false });
    expect(data.features.find((f) => f.key === 'family')).toMatchObject({ enabled: false, updatedBy: null });
  });

  it('lets admins change a switch and records who changed it', async () => {
    asAdmin();
    expect((await patch({ key: 'family', enabled: true })).status).toBe(200);
    expect((await publicFlags()).family).toBe(true);

    expect((await patch({ key: 'family', enabled: false })).status).toBe(200);
    expect((await publicFlags()).family).toBe(false);

    const row = state.sqlite.prepare('SELECT * FROM "FeatureFlag" WHERE key = ?').get('family') as Record<string, unknown>;
    expect(row).toMatchObject({ enabled: 0, updatedBy: 'admin@example.com' });
  });

  it('rejects unknown keys and bad values', async () => {
    asAdmin();
    expect((await patch({ key: 'notAFeature', enabled: true })).status).toBe(400);
    expect((await patch({ key: 'family', enabled: 'yes' })).status).toBe(400);
  });

  it('is admin-only', async () => {
    asMember();
    expect((await patch({ key: 'family', enabled: true })).status).toBe(403);
    expect((await listFeatures(new NextRequest('http://localhost/api/admin/features'))).status).toBe(403);
  });
});

describe('switches are enforced by the API', () => {
  it('refuses donations when switched off', async () => {
    asAdmin();
    await patch({ key: 'donations', enabled: false });
    state.session = null;
    const res = await donate(
      new NextRequest('http://localhost/api/donations', {
        method: 'POST',
        body: JSON.stringify({ donorName: 'A', donorEmail: 'a@example.com', amount: 10 }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('blocks the family API until the switch is on', async () => {
    asMember();
    expect((await familyList(new NextRequest('http://localhost/api/profile/family'))).status).toBe(403);

    asAdmin();
    await patch({ key: 'family', enabled: true });
    asMember();
    expect((await familyList(new NextRequest('http://localhost/api/profile/family'))).status).toBe(200);
  });

  it('refuses event registration while switched off (the default)', async () => {
    asMember();
    const res = await registerForEvent(
      new NextRequest('http://localhost/api/events/e1/register', { method: 'POST', body: '{}' }),
      { params: Promise.resolve({ id: 'e1' }) },
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ feature: 'eventRegistration' });
  });
});
