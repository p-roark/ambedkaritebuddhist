// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb, type TestSqlite } from '@/test/sqlite-db';

const state = vi.hoisted(() => ({ db: null as unknown, sqlite: null as unknown as TestSqlite }));
vi.mock('@/db', () => ({ getDb: () => state.db }));

const { checkMemberAddress } = await import('./address-verification-server');
const { clearFeatureFlagsCache } = await import('@/lib/feature-flags-server');

// Real Geolocator reply for "100 Queen St W Toronto"
const sample = readFileSync(path.resolve(__dirname, '../test/fixtures/geolocator-100-queen-st-w.json'), 'utf8');
const fetchMock = vi.fn();
const picked = { addressLine1: '100 Queen Street West', city: 'Toronto', province: 'ON' };
const registration = { recheckUnverifiedUnchanged: true };
const profileEdit = { recheckUnverifiedUnchanged: false };

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
  it('marks an address the Geolocator knows as verified (ignoring case and punctuation)', async () => {
    fetchMock.mockImplementation(async () => new Response(sample, { status: 200 }));
    const result = await checkMemberAddress({ ...picked, addressLine1: '100 queen street west.' }, null, registration);
    expect(result.addressVerifiedAt).toEqual(expect.any(String));
  });

  it('accepts a typed address the Geolocator does not know, unverified', async () => {
    fetchMock.mockImplementation(async () => new Response(sample, { status: 200 }));
    expect(await checkMemberAddress({ addressLine1: '68 Rural Route Road', city: 'Toronto', province: 'ON' }, null, registration))
      .toEqual({ addressVerifiedAt: null });
    // Right street, wrong province: not verified either
    expect(await checkMemberAddress({ ...picked, province: 'BC' }, null, registration)).toEqual({ addressVerifiedAt: null });
  });

  it('accepts but leaves unverified when the Geolocator is down', async () => {
    fetchMock.mockRejectedValue(new Error('timeout'));
    expect(await checkMemberAddress(picked, null, registration)).toEqual({ addressVerifiedAt: null });
  });

  it('keeps an unchanged verified address without asking again', async () => {
    const previous = { ...picked, addressVerifiedAt: '2026-10-01T00:00:00.000Z' };
    expect(await checkMemberAddress(picked, previous, registration)).toEqual({ addressVerifiedAt: '2026-10-01T00:00:00.000Z' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('re-checks an unchanged unverified address at registration, but not on profile edits', async () => {
    const old = { ...picked, addressVerifiedAt: null };
    expect(await checkMemberAddress(picked, old, profileEdit)).toEqual({ addressVerifiedAt: null });
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockImplementation(async () => new Response(sample, { status: 200 }));
    expect((await checkMemberAddress(picked, old, registration)).addressVerifiedAt).toEqual(expect.any(String));
  });

  it('does not look anything up while the Address search switch is off', async () => {
    state.sqlite
      .prepare('INSERT INTO "FeatureFlag" (key, enabled, updatedBy, updatedAt) VALUES (?, 0, ?, ?)')
      .run('addressLookup', 'admin@example.com', '2026-10-20');
    clearFeatureFlagsCache();
    expect(await checkMemberAddress(picked, null, registration)).toEqual({ addressVerifiedAt: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
