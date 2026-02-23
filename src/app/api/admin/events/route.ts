import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { events } from '@/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

type EventStatus = 'Upcoming' | 'Registration Started' | 'Event Ended';

async function requireAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email || token.role !== 'ADMIN') {
    return null;
  }
  return token;
}

export async function GET(request: NextRequest) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = getDb();
  const rows = await db.select().from(events).orderBy(desc(events.date));
  return NextResponse.json({ events: rows }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json()) as {
    title?: string;
    date?: string;
    location?: string;
    status?: EventStatus;
  };

  if (!body.title || !body.date || !body.location || !body.status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const validStatuses: EventStatus[] = ['Upcoming', 'Registration Started', 'Event Ended'];
  if (!validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const db = getDb();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.insert(events).values({
    id,
    title: body.title.trim(),
    date: body.date,
    location: body.location.trim(),
    status: body.status,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json()) as {
    id?: string;
    status?: EventStatus;
  };

  if (!body.id || !body.status) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const validStatuses: EventStatus[] = ['Upcoming', 'Registration Started', 'Event Ended'];
  if (!validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const db = getDb();
  await db
    .update(events)
    .set({ status: body.status, updatedAt: new Date().toISOString() })
    .where(eq(events.id, body.id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
