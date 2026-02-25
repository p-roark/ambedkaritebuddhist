import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { users, contactMessages } from '@/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(_request: NextRequest) {
  const session = await auth();
  const email = String(session?.user?.email ?? '').trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
  const messageId = crypto.randomUUID();

  await db.insert(contactMessages).values({
    id: messageId,
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
}
