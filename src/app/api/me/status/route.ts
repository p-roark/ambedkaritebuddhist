import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/registration-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!current.user) {
      return NextResponse.json(
        { id: null, role: 'MEMBER', isMember: current.isAdmin, registrationStatus: current.registrationStatus, status: 'active', activationRequestStatus: 'none' },
        { status: 200 },
      );
    }

    const [{ eq }, { getDb }, { users }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    const db = getDb();
    const user = await db
      .select({ status: users.status, activationRequestStatus: users.activationRequestStatus })
      .from(users)
      .where(eq(users.id, current.user.id))
      .limit(1)
      .then((rows) => rows[0]);

    return NextResponse.json(
      {
        id: current.user.id,
        role: current.user.role,
        isMember: current.registrationStatus === 'complete',
        registrationStatus: current.registrationStatus,
        status: user?.status ?? 'active',
        activationRequestStatus: user?.activationRequestStatus ?? 'none',
      },
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
