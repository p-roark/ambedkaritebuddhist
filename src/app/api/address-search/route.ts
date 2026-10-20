import { NextRequest, NextResponse } from 'next/server';
import { requireFeature } from '@/lib/feature-flags-server';

export const dynamic = 'force-dynamic';

// GET /api/address-search?q=100 Queen St W
// Signed-in users only (it serves the registration and profile forms).
// Replies { suggestions: [...] }; if the lookup service fails the reply is
// { suggestions: [], unavailable: true } so the form falls back to manual entry.
export async function GET(request: NextRequest) {
  const disabled = await requireFeature('addressLookup');
  if (disabled) return disabled;

  const { auth } = await import('@/lib/auth');
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const query = (request.nextUrl.searchParams.get('q') ?? '').replace(/\s+/g, ' ').trim();
  // Needs a house number and a few letters of the street before searching
  if (query.length < 5 || query.length > 120 || !/\d/.test(query)) {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }

  try {
    const { searchAddresses } = await import('@/lib/address-search');
    const suggestions = await searchAddresses(query);
    return NextResponse.json({ suggestions }, { status: 200, headers: { 'Cache-Control': 'private, max-age=300' } });
  } catch (error) {
    console.error('[address-search] lookup failed:', error);
    return NextResponse.json({ suggestions: [], unavailable: true }, { status: 200 });
  }
}
