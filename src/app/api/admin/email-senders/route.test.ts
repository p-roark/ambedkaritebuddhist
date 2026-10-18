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

const { GET: listSenders, PUT: setSender } = await import('./route');
const { resolveSender } = await import('@/lib/email-senders-server');

type SendersBody = { defaultAddress: string | null; senders: Array<{ purpose: string; address: string | null; updatedBy: string | null }>; error?: string };
const put = async (body: unknown) => {
  const res = await setSender(new NextRequest('http://localhost/api/admin/email-senders', { method: 'PUT', body: JSON.stringify(body) }));
  return { status: res.status, body: (await res.json()) as SendersBody };
};

beforeEach(() => {
  const { sqlite, db } = createTestDb();
  state.sqlite = sqlite;
  state.db = db;
  state.session = { email: 'admin@example.com', role: 'ADMIN' };
  // The migrations seed the 'main' settings row
  sqlite.prepare('UPDATE "OrganizationSettings" SET orgName = ?, email = ? WHERE id = ?').run('Ambedkarite Buddhist Community of Canada', 'info@abcc.example', 'main');
});

describe('resolveSender', () => {
  it('uses the organization email and name by default', async () => {
    expect(await resolveSender()).toEqual({ address: 'info@abcc.example', name: 'Ambedkarite Buddhist Community of Canada', source: 'organization' });
    expect(await resolveSender('donations')).toMatchObject({ address: 'info@abcc.example', source: 'organization' });
  });

  it('uses a purpose address once set, and falls back again when cleared', async () => {
    await put({ purpose: 'registrations', address: ' Registrations@ABCC.example ' });
    expect(await resolveSender('registrations')).toMatchObject({ address: 'registrations@abcc.example', source: 'purpose' });
    expect(await resolveSender('donations')).toMatchObject({ address: 'info@abcc.example' });

    await put({ purpose: 'registrations', address: '' });
    expect(await resolveSender('registrations')).toMatchObject({ address: 'info@abcc.example', source: 'organization' });
  });
});

describe('admin email senders API', () => {
  it('lists every purpose with the default address and who changed it', async () => {
    await put({ purpose: 'donations', address: 'donate@abcc.example' });
    const res = await listSenders(new NextRequest('http://localhost/api/admin/email-senders'));
    const body = (await res.json()) as SendersBody;
    expect(body.defaultAddress).toBe('info@abcc.example');
    expect(body.senders.map((s) => s.purpose)).toEqual(['registrations', 'signIn', 'donations', 'events', 'familyInvites']);
    expect(body.senders.find((s) => s.purpose === 'donations')).toMatchObject({ address: 'donate@abcc.example', updatedBy: 'admin@example.com' });
  });

  it('rejects unknown purposes and invalid addresses', async () => {
    expect((await put({ purpose: 'marketing', address: 'a@b.example' })).status).toBe(400);
    expect((await put({ purpose: 'donations', address: 'not an email' })).status).toBe(400);
    expect((await put({ purpose: 'donations', address: 'Name <a@b.example>' })).status).toBe(400);
  });

  it('is admin-only', async () => {
    state.session = { email: 'member@example.com', role: 'MEMBER' };
    expect((await put({ purpose: 'donations', address: 'a@b.example' })).status).toBe(403);
    expect((await listSenders(new NextRequest('http://localhost/api/admin/email-senders'))).status).toBe(403);
  });
});
