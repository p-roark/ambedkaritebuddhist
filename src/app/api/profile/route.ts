import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getToken } from 'next-auth/jwt';
import { getDb } from '@/db';
import { users } from '@/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

async function getOrCreateUserId(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });
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
  const profile = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      altPhone: users.altPhone,
      addressLine1: users.addressLine1,
      addressLine2: users.addressLine2,
      city: users.city,
      province: users.province,
      postalCode: users.postalCode,
      education: users.education,
      interests: users.interests,
      notes: users.notes,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  return NextResponse.json({ profile }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const userId = await getOrCreateUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as {
    name?: string;
    phone?: string;
    altPhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    education?: string;
    interests?: string;
    notes?: string;
  };

  const db = getDb();
  await db
    .update(users)
    .set({
      name: String(body.name ?? '').trim() || 'Community Member',
      phone: String(body.phone ?? '').trim() || null,
      altPhone: String(body.altPhone ?? '').trim() || null,
      addressLine1: String(body.addressLine1 ?? '').trim() || null,
      addressLine2: String(body.addressLine2 ?? '').trim() || null,
      city: String(body.city ?? '').trim() || null,
      province: String(body.province ?? '').trim() || null,
      postalCode: String(body.postalCode ?? '').trim() || null,
      education: String(body.education ?? '').trim() || null,
      interests: String(body.interests ?? '').trim() || null,
      notes: String(body.notes ?? '').trim() || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));

  return NextResponse.json({ ok: true }, { status: 200 });
}

