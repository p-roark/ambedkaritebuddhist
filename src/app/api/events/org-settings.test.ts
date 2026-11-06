// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb, type TestSqlite } from '@/test/sqlite-db';

const state = vi.hoisted(() => ({ sqlite: null as unknown as TestSqlite, db: null as unknown }));
vi.mock('@/db', () => ({ getDb: () => state.db }));

const { GET } = await import('./route');

const orgSettings = async () =>
  (await (await GET(new NextRequest('http://localhost/api/events?resource=org-settings'))).json()) as {
    donationEmail: string;
    settings: { email: string };
  };

beforeEach(() => {
  const { sqlite, db } = createTestDb();
  state.sqlite = sqlite;
  state.db = db;
});

describe('GET /api/events?resource=org-settings', () => {
  it('gives the organization email as the donation address when no Donations address is set', async () => {
    const data = await orgSettings();
    expect(data.donationEmail).toBe(data.settings.email);
  });

  it('gives the Donations address from Settings → Email', async () => {
    state.sqlite
      .prepare('INSERT INTO "EmailSender" (purpose, address, updatedBy, updatedAt) VALUES (?, ?, ?, ?)')
      .run('donations', 'donate@ambedkaritebuddhist.org', 'admin@example.com', '2026-11-03');
    expect((await orgSettings()).donationEmail).toBe('donate@ambedkaritebuddhist.org');
  });
});
