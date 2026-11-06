import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/donation-email — public. The Interac e-Transfer address shown on the
// donate forms: the Donations address in Settings → Email, or the organization
// email when that is blank. Its own short-lived response, so a change in
// Settings shows on the forms within a minute.
export async function GET() {
  try {
    const { resolveSender } = await import('@/lib/email-senders-server');
    const { address } = await resolveSender('donations');
    return NextResponse.json({ email: address }, { status: 200, headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch (error) {
    console.error('Donation email lookup failed:', error);
    return NextResponse.json({ error: 'Unavailable' }, { status: 500 });
  }
}
