import { NextRequest, NextResponse } from 'next/server';
import { isValidReferralCodeFormat } from '@/lib/referral';
import { pickDisplayName } from '@/lib/user-name';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    const email = String(session?.user?.email ?? '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { referralCode?: string };
    const referralCode = body.referralCode?.trim().toUpperCase();

    if (!referralCode || !isValidReferralCodeFormat(referralCode)) {
      return NextResponse.json({ error: 'Invalid referral code format' }, { status: 400 });
    }

    const [{ and, eq, isNull, sql }, { getDb }, { referralCodes, users }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    const db = getDb();

    let dbUser = await db
      .select({ id: users.id, role: users.role, referredBy: users.referredBy })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((rows) => rows[0]);

    if (!dbUser) {
      const now = new Date().toISOString();
      const userId = crypto.randomUUID();

      await db.insert(users).values({
        id: userId,
        name: pickDisplayName({
          sessionName: session?.user?.name,
          email,
        }),
        email,
        passwordHash: '',
        role: 'MEMBER',
        image: String(session?.user?.image ?? '') || null,
        emailVerified: now,
        createdAt: now,
        updatedAt: now,
      });

      dbUser = { id: userId, role: 'MEMBER', referredBy: null };
    }

    if (dbUser.referredBy || dbUser.role === 'ADMIN' || dbUser.role === 'LEADER') {
      return NextResponse.json({ message: 'Already a verified member' }, { status: 200 });
    }

    const referral = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, referralCode))
      .limit(1)
      .then((rows) => rows[0]);

    if (!referral) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    if (!referral.active) {
      return NextResponse.json({ error: 'Referral code is inactive' }, { status: 400 });
    }

    if (referral.currentUses >= referral.maxUses) {
      return NextResponse.json({ error: 'Referral code has reached maximum uses' }, { status: 400 });
    }

    const now = new Date().toISOString();

    await db
      .update(users)
      .set({
        referredBy: referralCode,
        updatedAt: now,
      })
      .where(and(eq(users.id, dbUser.id), isNull(users.referredBy)));

    await db
      .update(referralCodes)
      .set({ currentUses: sql`${referralCodes.currentUses} + 1` })
      .where(eq(referralCodes.id, referral.id));

    return NextResponse.json({ message: 'Referral code verified' }, { status: 200 });
  } catch (error) {
    console.error('Referral verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
