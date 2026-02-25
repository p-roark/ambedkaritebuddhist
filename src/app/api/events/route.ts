import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { eventCoordinators, eventRegistrations, events, users } from '@/db/schema';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
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
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });
  const email = String(session?.user?.email ?? token?.email ?? '').trim().toLowerCase();

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
