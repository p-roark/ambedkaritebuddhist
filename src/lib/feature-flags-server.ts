import { NextResponse } from 'next/server';
import { FEATURES, resolveFeatureFlags, type FeatureFlags, type FeatureKey } from '@/lib/feature-flags';

// Cached per Worker isolate so most requests skip D1. A change made by an
// admin applies immediately on the isolate that handled it and within this
// window everywhere else.
const CACHE_MS = 30_000;

let cache: { at: number; flags: FeatureFlags } | null = null;

export async function getFeatureFlags(): Promise<FeatureFlags> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.flags;

  try {
    const [{ getDb }, { featureFlags }] = await Promise.all([import('@/db'), import('@/db/schema')]);
    const rows = await getDb().select({ key: featureFlags.key, enabled: featureFlags.enabled }).from(featureFlags);
    const flags = resolveFeatureFlags(rows);
    cache = { at: now, flags };
    return flags;
  } catch (error) {
    // D1 unavailable (or table not migrated yet): fall back to the defaults
    console.error('Load feature flags error:', error);
    return cache?.flags ?? resolveFeatureFlags([]);
  }
}

export function clearFeatureFlagsCache() {
  cache = null;
}

export async function isFeatureEnabled(key: FeatureKey): Promise<boolean> {
  return (await getFeatureFlags())[key];
}

/** For API routes: returns a 403 response when the feature is switched off, else null. */
export async function requireFeature(key: FeatureKey): Promise<NextResponse | null> {
  if (await isFeatureEnabled(key)) return null;
  return NextResponse.json(
    { error: `${FEATURES[key].label} is currently unavailable.`, feature: key },
    { status: 403 },
  );
}
