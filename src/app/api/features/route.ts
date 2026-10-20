import { NextResponse } from 'next/server';
import { getFeatureFlags } from '@/lib/feature-flags-server';

export const dynamic = 'force-dynamic';

// GET /api/features — public on/off state of every feature switch
export async function GET() {
  // Always read the stored values so a switch change shows on the next page load
  const flags = await getFeatureFlags({ fresh: true });
  return NextResponse.json(
    { flags },
    // Not cached by browsers: a switch change must show up on the next page load
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
