// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb, type TestSqlite } from '@/test/sqlite-db';

const state = vi.hoisted(() => ({ db: null as unknown, sqlite: null as unknown as TestSqlite }));
vi.mock('@/db', () => ({ getDb: () => state.db }));

const { checkMemberAddress, ADDRESS_NOT_FOUND } = await import('./address-verification-server');
const { clearFeatureFlagsCache } = await import('@/lib/feature-flags-server');

// Real Geolocator reply for "100 Queen St W Toronto"
const sample = readFileSync(path.resolve(__dirname, '../test/fixtures/geolocator-100-queen-st-w.json'), 'utf8');
const fetchMock = vi.fn();
const picked = { addressLine1: '100 Queen Street West', city: 'Toronto', province: 'ON' };
const strict = { allowUnverifiedUnchanged: false };

beforeEach(() => {
  const { sqlite, db } = createTestDb();
  state.sqlite = sqlite;
  state.db = db;
  clearFeatureFlagsCache();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('checkMemberAddress', () => {
  it('verifies an address the Geolocator knows (ignoring case and punctuation)', async () => {
    fetchMock.mockImplementation(async () => new Response(sample, { status: 200 }));
    const result = await checkMemberAddress({ ...picked, addressLine1: '100 queen street west.' }, null, strict);
    expect(result.ok && result.addressVerifiedAt).toEqual(expect.any(String));
  });

  it('rejects typed addresses the Geolocator does not know', async () => {
    fetchMock.mockImplementation(async () => new Response(sample, { status: 200 }));
    expect(await checkMemberAddress({ addressLine1: '68 Fake Road', city: 'Toronto', province: 'ON' }, null, strict))
      .toEqual({ ok: false, error: ADDRESS_NOT_FOUND });
    // Right street, wrong province
    expect((await checkMemberAddress({ ...picked, province: 'BC' }, null, strict)).ok).toBe(false);
  });

  it('accepts but leaves unverified when the Geolocator is down', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'));
    expect(await checkMemberAddress(picked, null, strict)).toEqual({ ok: true, addressVerifiedAt: null });
  });

  it('keeps an unchanged verified address without asking again', async () => {
    const previous = { ...picked, addressVerifiedAt: '2026-10-01T00:00:00.000Z' };
    expect(await checkMemberAddress(picked, previous, strict)).toEqual({ ok: true, addressVerifiedAt: '2026-10-01T00:00:00.000Z' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('re-checks an unchanged unverified address at registration, but not on profile edits', async () => {
    const junk = { addressLine1: ':)68', city: '123', province: 'ON', addressVerifiedAt: null };
    expect(await checkMemberAddress(junk, junk, { allowUnverifiedUnchanged: true })).toEqual({ ok: true, addressVerifiedAt: null });
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));
    expect((await checkMemberAddress(junk, junk, strict)).ok).toBe(false);
  });

  it('does not check while the Address search switch is off', async () => {
    state.sqlite
      .prepare('INSERT INTO "FeatureFlag" (key, enabled, updatedBy, updatedAt) VALUES (?, 0, ?, ?)')
      .run('addressLookup', 'admin@example.com', '2026-10-20');
    clearFeatureFlagsCache();
    expect(await checkMemberAddress({ addressLine1: '68 Fake Road', city: 'Toronto', province: 'ON' }, null, strict))
      .toEqual({ ok: true, addressVerifiedAt: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
