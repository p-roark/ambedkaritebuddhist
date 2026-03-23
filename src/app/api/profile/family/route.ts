import { NextRequest, NextResponse } from 'next/server';
import { pickDisplayName } from '@/lib/user-name';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

async function getOrCreateUserId() {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  const email = String(session?.user?.email ?? '').trim().toLowerCase();
  if (!email) return null;

  const [{ eq }, { getDb }, { users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) return existing.id;

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

  return userId;
}

export async function GET(_request: NextRequest) {
  const userId = await getOrCreateUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [{ eq }, { getDb }, { familyMembers }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  const members = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.userId, userId));

  return NextResponse.json({ familyMembers: members }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const userId = await getOrCreateUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as {
    name?: string;
    relationship?: string;
    age?: number | null;
    notes?: string;
  };

  const name = String(body.name ?? '').trim();
  const relationship = String(body.relationship ?? '').trim();
  if (!name || !relationship) {
    return NextResponse.json({ error: 'Name and relationship are required' }, { status: 400 });
  }

  const [{ getDb }, { familyMembers }] = await Promise.all([
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  const now = new Date().toISOString();
  await db.insert(familyMembers).values({
    id: crypto.randomUUID(),
    userId,
    name,
    relationship,
    age: body.age == null ? null : Number(body.age),
    notes: String(body.notes ?? '').trim() || null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const userId = await getOrCreateUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as {
    id?: string;
    name?: string;
    relationship?: string;
    age?: number | null;
    notes?: string;
  };

  if (!body.id) return NextResponse.json({ error: 'Member id is required' }, { status: 400 });

  const [{ and, eq }, { getDb }, { familyMembers }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  await db
    .update(familyMembers)
    .set({
      name: String(body.name ?? '').trim(),
      relationship: String(body.relationship ?? '').trim(),
      age: body.age == null ? null : Number(body.age),
      notes: String(body.notes ?? '').trim() || null,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(familyMembers.id, body.id), eq(familyMembers.userId, userId)));

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  const userId = await getOrCreateUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: 'Member id is required' }, { status: 400 });

  const [{ and, eq }, { getDb }, { familyMembers }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  await db
    .delete(familyMembers)
    .where(and(eq(familyMembers.id, body.id), eq(familyMembers.userId, userId)));

  return NextResponse.json({ ok: true }, { status: 200 });
}
