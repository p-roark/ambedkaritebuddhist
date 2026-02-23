import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    let user = await db
      .select({ id: users.id, role: users.role, referredBy: users.referredBy })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      const userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        name: String(token?.name ?? 'Community Member'),
        email,
        passwordHash: '',
        role: 'MEMBER',
        image: token?.picture ? String(token.picture) : null,
        emailVerified: now,
        createdAt: now,
        updatedAt: now,
      });

      user = { id: userId, role: 'MEMBER', referredBy: null };
    }

    const isMember =
      Boolean(user.referredBy) || user.role === 'ADMIN' || user.role === 'LEADER';

    return NextResponse.json(
      { id: user.id, role: user.role, isMember },
      { status: 200 },
    );
  } catch (error) {
    console.error('Get status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
