import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAuthenticatedUserId } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

type EventStatus = 'Upcoming' | 'Registration Started' | 'Event Ended';

type CoordinatorInfo = { id: string; name: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function attachCoordinators(
  db: any,
  eventRows: Array<{ id: string }>,
): Promise<Map<string, CoordinatorInfo[]>> {
  const map = new Map<string, CoordinatorInfo[]>();
  if (eventRows.length === 0) return map;

  const [{ eq, inArray }, { eventCoordinators, users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db/schema'),
  ]);

  const eventIds = eventRows.map((e) => e.id);
  const coords = await db
    .select({
      eventId: eventCoordinators.eventId,
      userId: users.id,
      name: users.name,
    })
    .from(eventCoordinators)
    .innerJoin(users, eq(eventCoordinators.userId, users.id))
    .where(inArray(eventCoordinators.eventId, eventIds));

  for (const c of coords) {
    if (!map.has(c.eventId)) map.set(c.eventId, []);
    map.get(c.eventId)!.push({ id: c.userId, name: c.name });
  }
  return map;
}

export async function GET(request: NextRequest) {
  const [{ desc, eq, inArray }, { getDb }, { events, eventCoordinators }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  // Admin: return all events
  const admin = await requireAdmin(request);
  if (admin) {
    const rows = await db.select().from(events).orderBy(desc(events.date));
    const coordMap = await attachCoordinators(db, rows);
    return NextResponse.json({
      events: rows.map((e) => ({ ...e, coordinators: coordMap.get(e.id) ?? [] })),
    }, { status: 200 });
  }

  // Coordinator: return only their assigned events
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const myCoords = await db
    .select({ eventId: eventCoordinators.eventId })
    .from(eventCoordinators)
    .where(eq(eventCoordinators.userId, userId));

  if (myCoords.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const myEventIds = myCoords.map((c) => c.eventId);
  const rows = await db
    .select()
    .from(events)
    .where(inArray(events.id, myEventIds))
    .orderBy(desc(events.date));

  const coordMap = await attachCoordinators(db, rows);
  return NextResponse.json({
    events: rows.map((e) => ({ ...e, coordinators: coordMap.get(e.id) ?? [] })),
  }, { status: 200 });
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
    maxAttendees?: number | null;
    externalLink?: string | null;
    paymentInstructions?: string | null;
    status?: EventStatus;
    coordinatorIds?: string[];
  };

  if (!body.title || !body.date || !body.location || !body.status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const validStatuses: EventStatus[] = ['Upcoming', 'Registration Started', 'Event Ended'];
  if (!validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const [{ getDb }, { events, eventCoordinators }] = await Promise.all([
    import('@/db'),
    import('@/db/schema'),
  ]);
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
    maxAttendees: body.maxAttendees != null ? Number(body.maxAttendees) : null,
    externalLink: body.externalLink?.trim() || null,
    paymentInstructions: body.paymentInstructions?.trim() || null,
    status: body.status,
    createdAt: now,
    updatedAt: now,
  });

  // Insert coordinators
  const coordIds = (body.coordinatorIds ?? []).filter(Boolean);
  if (coordIds.length > 0) {
    await db.insert(eventCoordinators).values(
      coordIds.map((userId) => ({ eventId: id, userId })),
    );
  }

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

  const [{ eq }, { getDb }, { events }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  await db.update(events).set(patch).where(eq(events.id, body.id));

  return NextResponse.json({ ok: true }, { status: 200 });
}
