import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { referralCodes, users } from '@/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

async function requireAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email || token.role !== 'ADMIN') {
    return null;
  }
  return token;
}

async function ensureOwnerId(email: string) {
  const db = getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) return existing.id;

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    name: 'Admin User',
    email,
    passwordHash: '',
    role: 'ADMIN',
    emailVerified: now,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `BHIM-${seg(3)}-${seg(4)}`;
}

export async function GET(request: NextRequest) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = getDb();
  const rows = await db.select().from(referralCodes).orderBy(desc(referralCodes.createdAt));
  return NextResponse.json({ referralCodes: rows }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json()) as { maxUses?: number; code?: string };
  const maxUses = Number(body.maxUses ?? 10);
  if (!Number.isFinite(maxUses) || maxUses < 1 || maxUses > 1000) {
    return NextResponse.json({ error: 'Invalid maxUses' }, { status: 400 });
  }

  const ownerId = await ensureOwnerId(String(token.email));
  const db = getDb();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const code = (body.code?.trim().toUpperCase() || generateCode());
  if (!/^BHIM-[A-Z]{3}-[A-Z0-9]{4}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid referral code format' }, { status: 400 });
  }

  await db.insert(referralCodes).values({
    id,
    code,
    ownerId,
    maxUses,
    currentUses: 0,
    active: true,
    createdAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json()) as { id?: string; active?: boolean };
  if (!body.id || typeof body.active !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const db = getDb();
  await db.update(referralCodes).set({ active: body.active }).where(eq(referralCodes.id, body.id));
  return NextResponse.json({ ok: true }, { status: 200 });
}
