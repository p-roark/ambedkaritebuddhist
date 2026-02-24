import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getToken } from 'next-auth/jwt';
import { getDb } from '@/db';
import { familyMembers, users } from '@/db/schema';

export const dynamic = 'force-dynamic';

async function getOrCreateUserId(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const email = token?.email;
  if (!email) return null;

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
    name: String(token?.name ?? 'Community Member'),
    email,
    passwordHash: '',
    role: 'MEMBER',
    image: token?.picture ? String(token.picture) : null,
    emailVerified: now,
    createdAt: now,
    updatedAt: now,
  });

  return userId;
}

export async function GET(request: NextRequest) {
  const userId = await getOrCreateUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const members = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.userId, userId));

  return NextResponse.json({ familyMembers: members }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const userId = await getOrCreateUserId(request);
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
  const userId = await getOrCreateUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as {
    id?: string;
    name?: string;
    relationship?: string;
    age?: number | null;
    notes?: string;
  };

  if (!body.id) return NextResponse.json({ error: 'Member id is required' }, { status: 400 });

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
  const userId = await getOrCreateUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: 'Member id is required' }, { status: 400 });

  const db = getDb();
  await db
    .delete(familyMembers)
    .where(and(eq(familyMembers.id, body.id), eq(familyMembers.userId, userId)));

  return NextResponse.json({ ok: true }, { status: 200 });
}


