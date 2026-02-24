import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { eventRegistrations, events, familyMembers, users } from '@/db/schema';
import { pickDisplayName } from '@/lib/user-name';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });
  const email = String(session?.user?.email ?? token?.email ?? '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: eventId } = await params;
  const body = (await request.json()) as {
    volunteering?: boolean;
    includeFamily?: boolean;
    selectedFamilyMemberIds?: string[];
    nonMemberGuests?: Array<{ name?: string; age?: number }>;
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
      name: pickDisplayName({
        sessionName: session?.user?.name,
        tokenName: String(token?.name ?? ''),
        email,
      }),
      email,
      passwordHash: '',
      role: 'MEMBER',
      image: String(session?.user?.image ?? token?.picture ?? '') || null,
      emailVerified: now,
      createdAt: now,
      updatedAt: now,
    });
    user = { id: userId };
  }

  const includeFamily = Boolean(body.includeFamily);
  const selectedFamilyMemberIds = Array.from(
    new Set((body.selectedFamilyMemberIds ?? []).map((id) => String(id).trim()).filter(Boolean)),
  );
  const nonMemberGuests = (body.nonMemberGuests ?? [])
    .map((guest) => ({
      name: String(guest.name ?? '').trim(),
      age: Number(guest.age ?? -1),
    }))
    .filter((guest) => guest.name.length > 0 && Number.isFinite(guest.age) && guest.age >= 0)
    .slice(0, 20);

  let familyAdults = 0;
  let familyChildren = 0;
  let effectiveFamilyIds: string[] = [];

  if (includeFamily && selectedFamilyMemberIds.length > 0) {
    const rows = await db
      .select({ id: familyMembers.id, age: familyMembers.age })
      .from(familyMembers)
      .where(eq(familyMembers.userId, user.id));

    const allowedById = new Map(rows.map((row) => [row.id, row]));
    effectiveFamilyIds = selectedFamilyMemberIds.filter((id) => allowedById.has(id));

    for (const id of effectiveFamilyIds) {
      const member = allowedById.get(id);
      if (!member) continue;
      if (member.age == null || Number(member.age) >= 18) {
        familyAdults += 1;
      } else {
        familyChildren += 1;
      }
    }
  }

  const nonMemberAdultGuests = includeFamily
    ? nonMemberGuests.filter((guest) => guest.age >= 18).length
    : 0;
  const nonMemberChildGuests = includeFamily
    ? nonMemberGuests.filter((guest) => guest.age < 18).length
    : 0;

  const effectiveAdults = 1 + (includeFamily ? familyAdults + nonMemberAdultGuests : 0);
  const effectiveChildren = includeFamily ? familyChildren + nonMemberChildGuests : 0;
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
        selectedFamilyMemberIds: JSON.stringify(includeFamily ? effectiveFamilyIds : []),
        nonMemberGuestDetails: JSON.stringify(includeFamily ? nonMemberGuests : []),
        nonMemberAdultGuests: includeFamily ? nonMemberAdultGuests : 0,
        nonMemberChildGuests: includeFamily ? nonMemberChildGuests : 0,
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
      selectedFamilyMemberIds: JSON.stringify(includeFamily ? effectiveFamilyIds : []),
      nonMemberGuestDetails: JSON.stringify(includeFamily ? nonMemberGuests : []),
      nonMemberAdultGuests: includeFamily ? nonMemberAdultGuests : 0,
      nonMemberChildGuests: includeFamily ? nonMemberChildGuests : 0,
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
