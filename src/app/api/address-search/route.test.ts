// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb, type TestSqlite } from '@/test/sqlite-db';

const state = vi.hoisted(() => ({ db: null as unknown, sqlite: null as unknown as TestSqlite, signedIn: true }));
vi.mock('@/db', () => ({ getDb: () => state.db }));
vi.mock('@/lib/auth', () => ({
  auth: async () => (state.signedIn ? { user: { email: 'member@example.com', role: 'MEMBER' } } : null),
}));

const { GET } = await import('./route');
const { clearFeatureFlagsCache } = await import('@/lib/feature-flags-server');

const sample = readFileSync(path.resolve(__dirname, '../../../test/fixtures/geolocator-100-queen-st-w.json'), 'utf8');
const search = async (q: string) => {
  const res = await GET(new NextRequest(`http://localhost/api/address-search?q=${encodeURIComponent(q)}`));
  return { status: res.status, body: (await res.json()) as { suggestions?: Array<{ label: string }>; unavailable?: boolean } };
};
const fetchMock = vi.fn();

beforeEach(() => {
  const { sqlite, db } = createTestDb();
  state.sqlite = sqlite;
  state.db = db;
  state.signedIn = true;
  clearFeatureFlagsCache();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /api/address-search', () => {
  it('returns street-address suggestions to signed-in users', async () => {
    fetchMock.mockResolvedValueOnce(new Response(sample, { status: 200 }));
    const { status, body } = await search('100 Queen St W');
    expect(status).toBe(200);
    expect(body.suggestions?.map((s) => s.label)).toEqual(['100 Queen Street West, Toronto, ON', '100 Queen Street West, Saint John, NB']);
  });

  it('does not search until there is a house number and a few characters', async () => {
    expect((await search('Queen Street')).body).toEqual({ suggestions: [] });
    expect((await search('10 Q')).body).toEqual({ suggestions: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports the service as unavailable instead of failing', async () => {
    fetchMock.mockRejectedValueOnce(new Error('timeout'));
    expect((await search('100 Queen St W')).body).toEqual({ suggestions: [], unavailable: true });
  });

  it('is for signed-in users only', async () => {
    state.signedIn = false;
    expect((await search('100 Queen St W')).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('is unavailable when the Address search switch is off', async () => {
    state.sqlite
      .prepare('INSERT INTO "FeatureFlag" (key, enabled, updatedBy, updatedAt) VALUES (?, 0, ?, ?)')
      .run('addressLookup', 'admin@example.com', '2026-10-20');
    clearFeatureFlagsCache();
    expect((await search('100 Queen St W')).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
