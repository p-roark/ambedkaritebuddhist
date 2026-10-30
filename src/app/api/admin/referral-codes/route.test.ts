// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb, type TestSqlite } from '@/test/sqlite-db';

const state = vi.hoisted(() => ({
  sqlite: null as unknown as TestSqlite,
  db: null as unknown,
  role: 'ADMIN',
}));

vi.mock('@/db', () => ({ getDb: () => state.db }));
vi.mock('@/lib/auth', () => ({
  auth: async () => ({ user: { email: 'admin@example.com', role: state.role, name: 'Admin', image: null } }),
}));

const { POST } = await import('./route');

const create = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/admin/referral-codes', { method: 'POST', body: JSON.stringify(body) }));
const maxUsesOf = (code: string) =>
  (state.sqlite.prepare('SELECT maxUses FROM "ReferralCode" WHERE code = ?').get(code) as { maxUses: number } | undefined)?.maxUses;

beforeEach(() => {
  const { sqlite, db } = createTestDb();
  state.sqlite = sqlite;
  state.db = db;
  state.role = 'ADMIN';
});

describe('POST /api/admin/referral-codes', () => {
  it('creates codes for large groups, up to 300 uses and beyond', async () => {
    for (const [i, maxUses] of [100, 150, 200, 250, 300].entries()) {
      const code = `BHIM-BIG-000${i}`;
      expect((await create({ code, maxUses })).status).toBe(201);
      expect(maxUsesOf(code)).toBe(maxUses);
    }
  });

  it('rejects limits outside 1–1000 or that are not whole numbers', async () => {
    for (const maxUses of [0, 1001, 2.5, 'lots']) {
      expect((await create({ code: 'BHIM-BAD-0001', maxUses })).status).toBe(400);
    }
    expect(maxUsesOf('BHIM-BAD-0001')).toBeUndefined();
  });

  it('is admin-only', async () => {
    state.role = 'MEMBER';
    expect((await create({ code: 'BHIM-MEM-0001', maxUses: 100 })).status).toBe(403);
  });
});
