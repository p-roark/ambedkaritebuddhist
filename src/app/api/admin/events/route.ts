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
    description?: string;
    coverImage?: string;
    date?: string;
    time?: string;
    location?: string;
    eventType?: string;
    isPaid?: boolean;
    adultPrice?: number;
    childPrice?: number;
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
    description: String(body.description ?? '').trim(),
    coverImage: String(body.coverImage ?? '/images/events/covers/dcpd.jpg').trim(),
    date: body.date,
    time: String(body.time ?? '18:00').trim(),
    location: body.location.trim(),
    eventType: String(body.eventType ?? 'General').trim(),
    isPaid: Boolean(body.isPaid),
    adultPrice: Number(body.adultPrice ?? 0),
    childPrice: Number(body.childPrice ?? 0),
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
    archived?: boolean;
  };

  if (!body.id || (typeof body.status === 'undefined' && typeof body.archived === 'undefined')) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const patch: { status?: EventStatus; archived?: boolean; updatedAt: string } = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof body.status !== 'undefined') {
    const validStatuses: EventStatus[] = ['Upcoming', 'Registration Started', 'Event Ended'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    patch.status = body.status;
  }

  if (typeof body.archived !== 'undefined') {
    patch.archived = Boolean(body.archived);
  }

  const db = getDb();
  await db
    .update(events)
    .set(patch)
    .where(eq(events.id, body.id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
