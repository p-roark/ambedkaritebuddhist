import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { eventRegistrations, events, users } from '@/db/schema';

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const db = getDb();

  const event = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const registrations = await db
    .select({
      id: eventRegistrations.id,
      userId: eventRegistrations.userId,
      name: users.name,
      email: users.email,
      volunteering: eventRegistrations.volunteering,
      includeFamily: eventRegistrations.includeFamily,
      adultsCount: eventRegistrations.adultsCount,
      childrenCount: eventRegistrations.childrenCount,
      totalAmount: eventRegistrations.totalAmount,
      paymentStatus: eventRegistrations.paymentStatus,
      registrationStatus: eventRegistrations.registrationStatus,
      createdAt: eventRegistrations.createdAt,
    })
    .from(eventRegistrations)
    .innerJoin(users, eq(users.id, eventRegistrations.userId))
    .where(eq(eventRegistrations.eventId, id));

  return NextResponse.json({ event, registrations }, { status: 200 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await requireAdmin(request);
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = (await request.json()) as {
    action?: 'updateEvent' | 'updateRegistration';
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
    eventImages?: string[];
    registrationId?: string;
    paymentStatus?: 'Paid' | 'Unpaid';
    registrationStatus?: 'Pending Registration' | 'Confirmed' | 'Rejected';
  };

  const db = getDb();

  if (body.action === 'updateEvent' || (!body.registrationId && body.status)) {
    const validStatuses: EventStatus[] = ['Upcoming', 'Registration Started', 'Event Ended'];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const imageKeys = (body.eventImages ?? [])
      .map((key) => String(key).trim())
      .filter((key) => key.length > 0);
    if (imageKeys.length > 25) {
      return NextResponse.json({ error: 'You can add up to 25 images' }, { status: 400 });
    }

    await db
      .update(events)
      .set({
        title: String(body.title ?? '').trim(),
        description: String(body.description ?? '').trim(),
        coverImage: String(body.coverImage ?? '').trim(),
        date: String(body.date ?? '').trim(),
        time: String(body.time ?? '').trim(),
        location: String(body.location ?? '').trim(),
        eventType: String(body.eventType ?? '').trim(),
        isPaid: Boolean(body.isPaid),
        adultPrice: Number(body.adultPrice ?? 0),
        childPrice: Number(body.childPrice ?? 0),
        status: body.status,
        eventImages: JSON.stringify(imageKeys),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(events.id, id));

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (!body.registrationId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  await db
    .update(eventRegistrations)
    .set({
      paymentStatus: body.paymentStatus ?? 'Unpaid',
      registrationStatus: body.registrationStatus ?? 'Pending Registration',
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(eventRegistrations.id, body.registrationId), eq(eventRegistrations.eventId, id)));

  return NextResponse.json({ ok: true }, { status: 200 });
}
