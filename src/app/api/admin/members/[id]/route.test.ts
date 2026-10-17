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

const { GET: getMember, PATCH: updateMember } = await import('./route');
const { GET: exportMembers } = await import('../export/route');

const asAdmin = () => (state.session = { email: 'admin@example.com', role: 'ADMIN' });
const asMember = () => (state.session = { email: 'member@example.com', role: 'MEMBER' });
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const body = async (res: Response) => (await res.json()) as { member?: Record<string, unknown>; fieldErrors?: Record<string, string> };

function seedUser(id: string, email: string, extra: Record<string, string | null> = {}) {
  const fields = { name: 'Member ' + id, referredBy: 'BHIM-ABC-1234', registrationCompletedAt: null, ...extra };
  state.sqlite
    .prepare(`INSERT INTO "User" (id, email, passwordHash, role, createdAt, updatedAt, ${Object.keys(fields).join(', ')})
      VALUES (?, ?, '', 'MEMBER', '2026-10-01', '2026-10-01', ${Object.keys(fields).map(() => '?').join(', ')})`)
    .run(id, email, ...Object.values(fields));
}

const completeProfile = {
  name: 'Savitri Phule', phone: '416-555-0123', addressLine1: '100 Queen St W', city: 'Toronto',
  province: 'ON', postalCode: 'M5H 2N2', residencyStatus: 'CITIZEN',
};

function patch(id: string, body: unknown) {
  return updateMember(new NextRequest(`http://localhost/api/admin/members/${id}`, { method: 'PATCH', body: JSON.stringify(body) }), params(id));
}

beforeEach(() => {
  const { sqlite, db } = createTestDb();
  state.sqlite = sqlite;
  state.db = db;
  state.session = null;
  seedUser('u1', 'registered@example.com', { ...completeProfile, registrationCompletedAt: '2026-10-02' });
  seedUser('u2', 'pending@example.com');
  seedUser('u3', 'member@example.com', { registrationCompletedAt: '2026-10-02' });
});

describe('GET /api/admin/members/:id', () => {
  it('returns every stored detail to admins', async () => {
    asAdmin();
    const res = await getMember(new NextRequest('http://localhost/api/admin/members/u1'), params('u1'));
    expect(res.status).toBe(200);
    expect((await body(res)).member).toMatchObject({ email: 'registered@example.com', phone: '416-555-0123', residencyStatus: 'CITIZEN' });
  });

  it('is admin-only and 404s for unknown members', async () => {
    asMember();
    expect((await getMember(new NextRequest('http://localhost/x'), params('u1'))).status).toBe(403);
    asAdmin();
    expect((await getMember(new NextRequest('http://localhost/x'), params('nope'))).status).toBe(404);
  });
});

describe('PATCH /api/admin/members/:id', () => {
  it('lets admins edit details, normalising values', async () => {
    asAdmin();
    const res = await patch('u1', { ...completeProfile, city: 'Mississauga', postalCode: 'l5b1m2', notes: 'Volunteer' });
    expect(res.status).toBe(200);
    expect((await body(res)).member).toMatchObject({ city: 'Mississauga', postalCode: 'L5B 1M2', notes: 'Volunteer' });
  });

  it('keeps mandatory fields required for registered members', async () => {
    asAdmin();
    const res = await patch('u1', { ...completeProfile, phone: '' });
    expect(res.status).toBe(400);
    expect((await body(res)).fieldErrors).toHaveProperty('phone');
  });

  it('allows partial details for members who have not registered, but validates what is entered', async () => {
    asAdmin();
    expect((await patch('u2', { name: 'Pending Person', city: 'Ottawa' })).status).toBe(200);
    const bad = await patch('u2', { name: 'Pending Person', postalCode: '12345' });
    expect(bad.status).toBe(400);
    expect((await body(bad)).fieldErrors).toHaveProperty('postalCode');
  });

  it('never changes email, role or status', async () => {
    asAdmin();
    await patch('u1', { ...completeProfile, email: 'hacker@example.com', role: 'ADMIN', status: 'blocked' });
    const row = state.sqlite.prepare('SELECT email, role, status FROM "User" WHERE id = ?').get('u1');
    expect(row).toEqual({ email: 'registered@example.com', role: 'MEMBER', status: 'active' });
  });

  it('is admin-only', async () => {
    asMember();
    expect((await patch('u1', completeProfile)).status).toBe(403);
  });
});

describe('GET /api/admin/members/export', () => {
  it('downloads members as CSV for admins', async () => {
    asAdmin();
    const res = await exportMembers(new NextRequest('http://localhost/api/admin/members/export'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
    expect(res.headers.get('Content-Disposition')).toMatch(/attachment; filename="abcc-members-\d{4}-\d{2}-\d{2}\.csv"/);
    const csv = await res.text();
    const lines = csv.replace('﻿', '').trim().split('\r\n');
    expect(lines[0]).toMatch(/^Name,Email,Phone,/);
    expect(lines).toHaveLength(4); // header + 3 members
    expect(csv).toContain('registered@example.com');
    expect(csv).toContain('Ontario'); // province label
    expect(csv).toContain('Canadian Citizen'); // residency label
  });

  it('is admin-only', async () => {
    asMember();
    expect((await exportMembers(new NextRequest('http://localhost/api/admin/members/export'))).status).toBe(403);
  });
});
