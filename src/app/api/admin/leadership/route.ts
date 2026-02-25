import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { leadershipRoles, users } from '@/db/schema';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = getDb();
  const rows = await db
    .select({
      id: leadershipRoles.id,
      roleName: leadershipRoles.roleName,
      displayOrder: leadershipRoles.displayOrder,
      userId: leadershipRoles.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(leadershipRoles)
    .leftJoin(users, eq(leadershipRoles.userId, users.id))
    .orderBy(asc(leadershipRoles.displayOrder));

  return NextResponse.json({ roles: rows }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json()) as { roleName?: string };
  if (!body.roleName?.trim()) {
    return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
  }

  const db = getDb();
  const now = new Date().toISOString();

  // Set display order to max + 1
  const existing = await db
    .select({ displayOrder: leadershipRoles.displayOrder })
    .from(leadershipRoles)
    .orderBy(asc(leadershipRoles.displayOrder));
  const nextOrder = existing.length > 0
    ? (existing[existing.length - 1].displayOrder + 1)
    : 0;

  const id = crypto.randomUUID();
  await db.insert(leadershipRoles).values({
    id,
    roleName: body.roleName.trim(),
    displayOrder: nextOrder,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json()) as {
    id?: string;
    roleName?: string;
    userId?: string | null;
    displayOrder?: number;
  };

  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const db = getDb();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updatedAt: now };

  if (body.roleName !== undefined) patch.roleName = body.roleName.trim();
  if ('userId' in body) patch.userId = body.userId ?? null;
  if (body.displayOrder !== undefined) patch.displayOrder = body.displayOrder;

  await db.update(leadershipRoles).set(patch).where(eq(leadershipRoles.id, body.id));

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const db = getDb();
  await db.delete(leadershipRoles).where(eq(leadershipRoles.id, id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
