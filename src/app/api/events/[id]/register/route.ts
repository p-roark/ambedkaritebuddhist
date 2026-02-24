import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { eventRegistrations, events, users } from '@/db/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const email = token?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: eventId } = await params;
  const body = (await request.json()) as {
    volunteering?: boolean;
    includeFamily?: boolean;
    adultsCount?: number;
    childrenCount?: number;
  };

  const db = getDb();

  const event = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  if (event.status !== 'Registration Started') {
    return NextResponse.json({ error: 'Registration is not open for this event' }, { status: 400 });
  }

  let user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user) {
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
    user = { id: userId };
  }

  const adultsCount = Math.max(1, Number(body.adultsCount ?? 1));
  const childrenCount = Math.max(0, Number(body.childrenCount ?? 0));
  const includeFamily = Boolean(body.includeFamily);
  const effectiveAdults = includeFamily ? adultsCount : 1;
  const effectiveChildren = includeFamily ? childrenCount : 0;
  const totalAmount = event.isPaid
    ? effectiveAdults * Number(event.adultPrice ?? 0) + effectiveChildren * Number(event.childPrice ?? 0)
    : 0;
  const now = new Date().toISOString();

  const existing = await db
    .select({ id: eventRegistrations.id })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, user.id)))
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) {
    await db
      .update(eventRegistrations)
      .set({
        volunteering: Boolean(body.volunteering),
        includeFamily,
        adultsCount: effectiveAdults,
        childrenCount: effectiveChildren,
        totalAmount,
        paymentStatus: event.isPaid ? 'Unpaid' : 'Paid',
        registrationStatus: 'Pending Registration',
        updatedAt: now,
      })
      .where(eq(eventRegistrations.id, existing.id));
  } else {
    await db.insert(eventRegistrations).values({
      id: crypto.randomUUID(),
      eventId,
      userId: user.id,
      volunteering: Boolean(body.volunteering),
      includeFamily,
      adultsCount: effectiveAdults,
      childrenCount: effectiveChildren,
      totalAmount,
      paymentStatus: event.isPaid ? 'Unpaid' : 'Paid',
      registrationStatus: 'Pending Registration',
      createdAt: now,
      updatedAt: now,
    });
  }

  return NextResponse.json({ message: 'Pending Registration', totalAmount }, { status: 200 });
}
