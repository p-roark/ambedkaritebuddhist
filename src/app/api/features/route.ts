import { NextResponse } from 'next/server';
import { getFeatureFlags } from '@/lib/feature-flags-server';

export const dynamic = 'force-dynamic';

// GET /api/features — public on/off state of every feature switch
export async function GET() {
  const flags = await getFeatureFlags();
  return NextResponse.json(
    { flags },
    { status: 200, headers: { 'Cache-Control': 'public, max-age=30' } },
  );
}
