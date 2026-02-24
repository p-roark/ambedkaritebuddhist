import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNotNull, ne, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { requireAdmin } from '@/lib/admin-auth';
import { pickDisplayName } from '@/lib/user-name';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = getDb();
  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      joinedAt: users.createdAt,
    })
    .from(users)
    .where(
      and(
        ne(users.role, 'STUDENT'),
        or(
          isNotNull(users.referredBy),
          eq(users.role, 'ADMIN'),
          eq(users.role, 'LEADER'),
        ),
      ),
    );

  const normalizedMembers = members.map((member) => ({
    ...member,
    name: pickDisplayName({
      dbName: member.name,
      email: member.email,
    }),
  }));

  return NextResponse.json({ members: normalizedMembers }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json()) as {
    action?: 'setRole' | 'removeMember';
    userId?: string;
    role?: 'ADMIN' | 'MEMBER';
  };

  const { action, userId, role } = body;
  if (!action || !userId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const db = getDb();
  const now = new Date().toISOString();

  const targetUser = await db
    .select({ email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (targetUser.email.toLowerCase() === String(token.email).toLowerCase()) {
    return NextResponse.json({ error: 'Admin cannot modify their own account' }, { status: 400 });
  }

  if (action === 'setRole') {
    if (role !== 'ADMIN' && role !== 'MEMBER') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await db
      .update(users)
      .set({ role, updatedAt: now })
      .where(eq(users.id, userId));

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (action === 'removeMember') {
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Admins cannot remove other admins' }, { status: 400 });
    }
    await db.delete(users).where(eq(users.id, userId));
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
