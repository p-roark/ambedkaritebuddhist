import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { contactMessages } from '@/db/schema';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
  };

  if (!body.id) {
    return NextResponse.json({ error: 'Message id is required' }, { status: 400 });
  }

  const patch: {
    status?: 'PENDING' | 'RESOLVED';
    adminNote?: string | null;
    updatedAt: string;
  } = { updatedAt: new Date().toISOString() };

  if (body.status) {
    if (body.status !== 'PENDING' && body.status !== 'RESOLVED') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    patch.status = body.status;
  }

  if (typeof body.adminNote !== 'undefined') {
    patch.adminNote = String(body.adminNote).trim() || null;
  }

  const db = getDb();
  await db.update(contactMessages).set(patch).where(eq(contactMessages.id, body.id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
