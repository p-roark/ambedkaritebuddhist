import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { eventCoordinators, eventRegistrations, events, familyMembers, users } from '@/db/schema';
import { requireAdminOrCoordinator } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';
type EventStatus = 'Upcoming' | 'Registration Started' | 'Event Ended';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdminOrCoordinator(request, id);
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = getDb();

  const event = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // Fetch coordinators for this event
  const coords = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
    })
    .from(eventCoordinators)
    .innerJoin(users, eq(eventCoordinators.userId, users.id))
    .where(eq(eventCoordinators.eventId, id));

  const registrations = await db
    .select({
      id: eventRegistrations.id,
      userId: eventRegistrations.userId,
      name: users.name,
      email: users.email,
      volunteering: eventRegistrations.volunteering,
      includeFamily: eventRegistrations.includeFamily,
      selectedFamilyMemberIds: eventRegistrations.selectedFamilyMemberIds,
      nonMemberGuestDetails: eventRegistrations.nonMemberGuestDetails,
      nonMemberAdultGuests: eventRegistrations.nonMemberAdultGuests,
      nonMemberChildGuests: eventRegistrations.nonMemberChildGuests,
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

  const userIds = Array.from(new Set(registrations.map((r) => r.userId)));
  const families = userIds.length
    ? await db
        .select({
          id: familyMembers.id,
          userId: familyMembers.userId,
          name: familyMembers.name,
          age: familyMembers.age,
        })
        .from(familyMembers)
        .where(inArray(familyMembers.userId, userIds))
    : [];

  const familyById = new Map(families.map((f) => [f.id, f]));
  const registrationsWithFamilyNames = registrations.map((r) => {
    let selectedFamilyIds: string[] = [];
    try {
      const parsed = JSON.parse(r.selectedFamilyMemberIds || '[]') as unknown;
      if (Array.isArray(parsed)) {
        selectedFamilyIds = parsed.map((fid) => String(fid));
      }
    } catch {
      selectedFamilyIds = [];
    }

    const selectedFamilyMembers = selectedFamilyIds
      .map((fid) => familyById.get(fid))
      .filter((member): member is { id: string; userId: string; name: string; age: number | null } => Boolean(member));

    return { ...r, selectedFamilyMembers };
  });

  return NextResponse.json({
    event,
    coordinators: coords,
    registrations: registrationsWithFamilyNames,
    isAdmin: auth.isAdmin,
  }, { status: 200 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdminOrCoordinator(request, id);
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await request.json()) as {
    action?: 'updateEvent' | 'updateRegistration' | 'addCoordinator' | 'removeCoordinator';
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
    userId?: string;
    registrationId?: string;
    paymentStatus?: 'Paid' | 'Unpaid';
    registrationStatus?: 'Pending Registration' | 'Confirmed' | 'Rejected';
  };

  const db = getDb();

  // addCoordinator — admin or coordinator
  if (body.action === 'addCoordinator') {
    if (!body.userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    await db
      .insert(eventCoordinators)
      .values({ eventId: id, userId: body.userId })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // removeCoordinator — admin or coordinator
  if (body.action === 'removeCoordinator') {
    if (!body.userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    await db
      .delete(eventCoordinators)
      .where(and(
        eq(eventCoordinators.eventId, id),
        eq(eventCoordinators.userId, body.userId),
      ));
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // updateEvent — admin or coordinator
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

  // updateRegistration — admin or coordinator
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
