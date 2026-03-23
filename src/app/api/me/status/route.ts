import { NextResponse } from 'next/server';
import { pickDisplayName } from '@/lib/user-name';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    const email = String(session?.user?.email ?? '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [{ eq }, { getDb }, { users }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
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

export async function POST() {
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    const email = String(session?.user?.email ?? '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [{ eq }, { getDb }, { users, contactMessages }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    const db = getDb();

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        activationRequestCount: users.activationRequestCount,
        activationRequestStatus: users.activationRequestStatus,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.status === 'blocked') {
      return NextResponse.json({ error: 'Account is blocked. Contact admins directly.' }, { status: 403 });
    }

    if (user.status !== 'inactive') {
      return NextResponse.json({ error: 'Account is not deactivated' }, { status: 400 });
    }

    if (user.activationRequestStatus === 'pending') {
      return NextResponse.json({ error: 'Activation request already pending' }, { status: 400 });
    }

    if (user.activationRequestCount >= 3) {
      return NextResponse.json({ error: 'Maximum activation requests reached' }, { status: 403 });
    }

    const now = new Date().toISOString();

    await db.insert(contactMessages).values({
      id: crypto.randomUUID(),
      name: user.name,
      email: user.email,
      subject: 'Account Activation Request',
      message: `Member ${user.name} (${user.email}) is requesting account reactivation. This is request #${user.activationRequestCount + 1}.`,
      type: 'ACTIVATION_REQUEST',
      userId: user.id,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    });

    await db
      .update(users)
      .set({
        activationRequestStatus: 'pending',
        activationRequestCount: user.activationRequestCount + 1,
        updatedAt: now,
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Activation request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
