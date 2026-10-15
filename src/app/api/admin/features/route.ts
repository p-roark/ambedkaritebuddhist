import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { FEATURE_KEYS, FEATURES, isFeatureKey } from '@/lib/feature-flags';
import { clearFeatureFlagsCache } from '@/lib/feature-flags-server';

export const dynamic = 'force-dynamic';

// GET /api/admin/features — every switch with its description and last change
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [{ getDb }, { featureFlags }] = await Promise.all([import('@/db'), import('@/db/schema')]);
  const rows = await getDb().select().from(featureFlags);
  const byKey = new Map(rows.map((row) => [row.key, row]));

  const features = FEATURE_KEYS.map((key) => {
    const row = byKey.get(key);
    return {
      key,
      ...FEATURES[key],
      enabled: row ? row.enabled : FEATURES[key].defaultEnabled,
      updatedBy: row?.updatedBy ?? null,
      updatedAt: row?.updatedAt ?? null,
    };
  });

  return NextResponse.json({ features }, { status: 200 });
}

// PATCH /api/admin/features — body: { key, enabled }
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { key?: unknown; enabled?: unknown };
  if (!isFeatureKey(body.key) || typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const [{ getDb }, { featureFlags }] = await Promise.all([import('@/db'), import('@/db/schema')]);
  const values = { enabled: body.enabled, updatedBy: admin.email, updatedAt: new Date().toISOString() };
  await getDb()
    .insert(featureFlags)
    .values({ key: body.key, ...values })
    .onConflictDoUpdate({ target: featureFlags.key, set: values });

  clearFeatureFlagsCache();
  return NextResponse.json({ ok: true, key: body.key, ...values }, { status: 200 });
}
