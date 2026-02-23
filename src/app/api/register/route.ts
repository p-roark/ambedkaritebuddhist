import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, referralCodes } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name: string; email: string; password: string; referralCode: string;
    };
    const { name, email, password, referralCode } = body;

    // Validate required fields
    if (!name || !email || !password || !referralCode) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Referral code must start with BHIM-
    if (!referralCode.startsWith('BHIM-')) {
      return NextResponse.json({ error: 'Invalid referral code format' }, { status: 400 });
    }

    const db = getDb();

    // Check if user already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
    }

    // Validate referral code
    const referral = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, referralCode))
      .limit(1)
      .then((r) => r[0]);

    if (!referral) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }
    if (!referral.active) {
      return NextResponse.json({ error: 'Referral code is inactive' }, { status: 400 });
    }
    if (referral.currentUses >= referral.maxUses) {
      return NextResponse.json({ error: 'Referral code has reached maximum uses' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();
    const userId = crypto.randomUUID();

    // D1 doesn't support true transactions yet — run sequentially
    await db.insert(users).values({
      id:           userId,
      name,
      email,
      passwordHash,
      role:         'MEMBER',
      referredBy:   referralCode,
      createdAt:    now,
      updatedAt:    now,
    });

    await db
      .update(referralCodes)
      .set({ currentUses: sql`${referralCodes.currentUses} + 1` })
      .where(eq(referralCodes.code, referralCode));

    return NextResponse.json(
      { message: 'User registered successfully', user: { id: userId, name, email, role: 'MEMBER' } },
      { status: 201 },
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
