// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb, type TestSqlite } from '@/test/sqlite-db';

const state = vi.hoisted(() => ({ sqlite: null as unknown as TestSqlite, db: null as unknown }));
vi.mock('@/db', () => ({ getDb: () => state.db }));

const { GET } = await import('./route');

beforeEach(() => {
  const { sqlite, db } = createTestDb();
  state.sqlite = sqlite;
  state.db = db;
});

describe('GET /api/donation-email', () => {
  it('gives the organization email when no Donations address is set', async () => {
    const orgEmail = (state.sqlite.prepare('SELECT email FROM "OrganizationSettings" WHERE id = ?').get('main') as { email: string }).email;
    const res = await GET();
    expect(await res.json()).toEqual({ email: orgEmail });
    // Short browser cache, so a change in Settings shows within a minute
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=60');
  });

  it('gives the Donations address from Settings → Email', async () => {
    state.sqlite
      .prepare('INSERT INTO "EmailSender" (purpose, address, updatedBy, updatedAt) VALUES (?, ?, ?, ?)')
      .run('donations', 'donate@ambedkaritebuddhist.org', 'admin@example.com', '2026-11-06');
    expect(await (await GET()).json()).toEqual({ email: 'donate@ambedkaritebuddhist.org' });
  });
});
