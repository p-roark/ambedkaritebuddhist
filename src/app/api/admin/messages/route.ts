import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [{ desc }, { getDb }, { contactMessages }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));

  return NextResponse.json({ messages: rows }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json()) as {
    id?: string;
    status?: 'PENDING' | 'RESOLVED';
    adminNote?: string;
    action?: 'accept' | 'reject';
  };

  if (!body.id) {
    return NextResponse.json({ error: 'Message id is required' }, { status: 400 });
  }

  const [{ eq }, { getDb }, { contactMessages, users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  const now = new Date().toISOString();

  // Handle activation request accept/reject
  if (body.action === 'accept' || body.action === 'reject') {
    const message = await db
      .select({ type: contactMessages.type, userId: contactMessages.userId })
      .from(contactMessages)
      .where(eq(contactMessages.id, body.id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.type !== 'ACTIVATION_REQUEST' || !message.userId) {
      return NextResponse.json({ error: 'Not an activation request' }, { status: 400 });
    }

    if (body.action === 'accept') {
      await db
        .update(users)
        .set({
          status: 'active',
          activationRequestCount: 0,
          activationRequestStatus: 'none',
          updatedAt: now,
        })
        .where(eq(users.id, message.userId));
    } else {
      // reject — check if this is the 3rd request
      const user = await db
        .select({ activationRequestCount: users.activationRequestCount })
        .from(users)
        .where(eq(users.id, message.userId))
        .limit(1)
        .then((rows) => rows[0]);

      if (user && user.activationRequestCount >= 3) {
        await db
          .update(users)
          .set({ status: 'blocked', updatedAt: now })
          .where(eq(users.id, message.userId));
      } else {
        await db
          .update(users)
          .set({ activationRequestStatus: 'rejected', updatedAt: now })
          .where(eq(users.id, message.userId));
      }
    }

    // Mark message resolved
    await db
      .update(contactMessages)
      .set({ status: 'RESOLVED', updatedAt: now })
      .where(eq(contactMessages.id, body.id));

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Standard status/note update
  const patch: {
    status?: 'PENDING' | 'RESOLVED';
    adminNote?: string | null;
    updatedAt: string;
  } = { updatedAt: now };

  if (body.status) {
    if (body.status !== 'PENDING' && body.status !== 'RESOLVED') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    patch.status = body.status;
  }

  if (typeof body.adminNote !== 'undefined') {
    patch.adminNote = String(body.adminNote).trim() || null;
  }

  await db.update(contactMessages).set(patch).where(eq(contactMessages.id, body.id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
