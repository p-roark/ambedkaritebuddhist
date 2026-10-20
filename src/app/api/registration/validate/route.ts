import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/feature-flags-server';
import { normalizeInviteCode } from '@/lib/registration';

export const dynamic = 'force-dynamic';

// GET /api/registration/validate?code=BHIM-XXX-XXXX
// Public: checks an invite code without using it, so /join can show a
// friendly message before the user signs in.
export async function GET(request: NextRequest) {
  if (!(await isFeatureEnabled('memberRegistration'))) {
    return NextResponse.json({ valid: false, reason: 'paused' }, { status: 200 });
  }
  const code = normalizeInviteCode(request.nextUrl.searchParams.get('code'));
  if (!code) return NextResponse.json({ valid: false, reason: 'invalid' }, { status: 200 });

  try {
    const [{ eq }, { getDb }, { referralCodes }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    const db = getDb();
    const referral = await db
      .select({ active: referralCodes.active, currentUses: referralCodes.currentUses, maxUses: referralCodes.maxUses })
      .from(referralCodes)
      .where(eq(referralCodes.code, code))
      .limit(1)
      .then((rows) => rows[0]);

    if (!referral) return NextResponse.json({ valid: false, reason: 'invalid' }, { status: 200 });
    if (!referral.active) return NextResponse.json({ valid: false, reason: 'inactive' }, { status: 200 });
    if (referral.currentUses >= referral.maxUses) {
      return NextResponse.json({ valid: false, reason: 'exhausted' }, { status: 200 });
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error('Validate invite code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
