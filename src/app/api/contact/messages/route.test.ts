// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb, type TestSqlite } from '@/test/sqlite-db';

const state = vi.hoisted(() => ({
  sqlite: null as unknown as TestSqlite,
  db: null as unknown,
  sessionEmail: null as string | null,
}));

vi.mock('@/db', () => ({ getDb: () => state.db }));
vi.mock('@/lib/auth', () => ({
  auth: async () => (state.sessionEmail ? { user: { email: state.sessionEmail, name: 'Test', role: 'MEMBER' } } : null),
}));

const { POST } = await import('./route');

const message = { name: 'Savitri Phule', email: 'typed@example.com', subject: 'Hello', message: 'Jai Bhim' };
const post = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/contact/messages', { method: 'POST', body: JSON.stringify(body) }));
const saved = () =>
  state.sqlite.prepare('SELECT name, email, userId FROM "ContactMessage"').all() as Array<Record<string, unknown>>;

beforeEach(() => {
  const { sqlite, db } = createTestDb();
  state.sqlite = sqlite;
  state.db = db;
  state.sessionEmail = null;
  sqlite
    .prepare('INSERT INTO "User" (id, name, email, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run('u1', 'Savitri Phule', 'member@example.com', '', 'MEMBER', '2026-10-01', '2026-10-01');
});

describe('POST /api/contact/messages', () => {
  it('saves visitor messages with the email they typed', async () => {
    expect((await post(message)).status).toBe(201);
    expect(saved()).toEqual([{ name: 'Savitri Phule', email: 'typed@example.com', userId: null }]);
  });

  it("links a signed-in member's message to their account and sign-in email", async () => {
    state.sessionEmail = 'member@example.com';
    expect((await post(message)).status).toBe(201);
    expect(saved()).toEqual([{ name: 'Savitri Phule', email: 'member@example.com', userId: 'u1' }]);
  });

  it('still requires a name, subject and message', async () => {
    state.sessionEmail = 'member@example.com';
    expect((await post({ ...message, subject: '' })).status).toBe(400);
    expect(saved()).toEqual([]);
  });
});
