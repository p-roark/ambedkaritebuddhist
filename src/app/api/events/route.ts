import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, isNotNull } from 'drizzle-orm';
import { getDb } from '@/db';
import { eventCoordinators, eventRegistrations, events, leadershipRoles, organizationSettings, users } from '@/db/schema';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Public leadership resource — no auth required
  const { searchParams } = new URL(request.url);
  if (searchParams.get('resource') === 'org-settings') {
    const db = getDb();
    const row = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.id, 'main'))
      .limit(1)
      .then((rows) => rows[0]);
    // Return row or sensible defaults if not seeded yet
    return NextResponse.json({
      settings: row ?? {
        id: 'main',
        orgName: 'Ambedkarite Buddhist Organization Canada',
        shortName: 'ABC Canada',
        email: 'info@ambedkaritebuddhist.ca',
        phone: null,
        altPhone: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        province: null,
        postalCode: null,
        country: 'Canada',
        website: null,
        description: null,
      },
    }, { status: 200 });
  }

  const eventId = searchParams.get('id');
  if (eventId) {
    const db = getDb();
    const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1).then((r) => r[0]);
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const coordinators = await db
      .select({ userId: eventCoordinators.userId, userName: users.name })
      .from(eventCoordinators)
      .innerJoin(users, eq(users.id, eventCoordinators.userId))
      .where(eq(eventCoordinators.eventId, eventId));
    return NextResponse.json({ event, coordinators }, { status: 200 });
  }

  if (searchParams.get('resource') === 'leadership') {
    const db = getDb();
    const rows = await db
      .select({
        id: leadershipRoles.id,
        roleName: leadershipRoles.roleName,
        displayOrder: leadershipRoles.displayOrder,
        userId: leadershipRoles.userId,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
        userJoinedAt: users.createdAt,
      })
      .from(leadershipRoles)
      .leftJoin(users, eq(leadershipRoles.userId, users.id))
      .where(isNotNull(leadershipRoles.userId))
      .orderBy(asc(leadershipRoles.displayOrder));
    return NextResponse.json({ roles: rows }, { status: 200 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.archived, false))
    .orderBy(desc(events.date));
  const registrationRows = await db.select({
    eventId: eventRegistrations.eventId,
  }).from(eventRegistrations);
  const registrationCounts = registrationRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.eventId] = (acc[row.eventId] ?? 0) + 1;
    return acc;
  }, {});

  const session = await auth();
  const email = String(session?.user?.email ?? '').trim().toLowerCase();

  let registrations: Array<{
    eventId: string;
    registrationStatus: string;
    paymentStatus: string;
  }> = [];
  let coordinatedEventIds: string[] = [];

  if (email) {
    const dbUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((r) => r[0]);

    if (dbUser) {
      registrations = await db
        .select({
          eventId: eventRegistrations.eventId,
          registrationStatus: eventRegistrations.registrationStatus,
          paymentStatus: eventRegistrations.paymentStatus,
        })
        .from(eventRegistrations)
        .where(and(eq(eventRegistrations.userId, dbUser.id)));

      const coordRows = await db
        .select({ eventId: eventCoordinators.eventId })
        .from(eventCoordinators)
        .where(eq(eventCoordinators.userId, dbUser.id));
      coordinatedEventIds = coordRows.map((r) => r.eventId);
    }
  }

  return NextResponse.json({ events: rows, registrations, registrationCounts, coordinatedEventIds }, { status: 200 });
}
