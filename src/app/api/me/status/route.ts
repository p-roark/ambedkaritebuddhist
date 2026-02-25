import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { auth } from '@/lib/auth';
import { pickDisplayName } from '@/lib/user-name';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  try {
    const session = await auth();
    const email = String(session?.user?.email ?? '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    let user = await db
      .select({ id: users.id, role: users.role, referredBy: users.referredBy, status: users.status, activationRequestStatus: users.activationRequestStatus })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
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

      user = { id: userId, role: 'MEMBER', referredBy: null, status: 'active', activationRequestStatus: 'none' };
    }

    const isMember =
      Boolean(user.referredBy) || user.role === 'ADMIN' || user.role === 'LEADER';

    return NextResponse.json(
      { id: user.id, role: user.role, isMember, status: user.status, activationRequestStatus: user.activationRequestStatus },
      { status: 200 },
    );
  } catch (error) {
    console.error('Get status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
