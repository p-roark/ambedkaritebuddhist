import { NextRequest, NextResponse } from 'next/server';
import { pickDisplayName } from '@/lib/user-name';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  const email = String(session?.user?.email ?? '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: eventId } = await params;
  const [{ and, eq }, { getDb }, { eventRegistrations, users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((r) => r[0]);

  if (!user) return NextResponse.json({ registration: null });

  const registration = await db
    .select()
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, user.id)))
    .limit(1)
    .then((r) => r[0] ?? null);

  return NextResponse.json({ registration }, { status: 200 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  const email = String(session?.user?.email ?? '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: eventId } = await params;
  const body = (await request.json()) as {
    volunteering?: boolean;
    volunteeringCultural?: boolean;
    photoConsent?: boolean;
    needsRide?: boolean;
    ridePickupAddress?: string;
    donationAmount?: number;
    notes?: string;
    includeFamily?: boolean;
    selectedFamilyMemberIds?: string[];
    nonMemberGuests?: Array<{ name?: string; age?: number }>;
  };

  const [{ and, eq }, { getDb }, { eventRegistrations, events, familyMembers, users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
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

  // Check max attendees (only for new registrations — existing ones are updates)
  if (event.maxAttendees != null) {
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((r) => r[0]);
    const alreadyRegistered = existingUser
      ? await db
          .select({ id: eventRegistrations.id })
          .from(eventRegistrations)
          .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, existingUser.id)))
          .limit(1)
          .then((r) => r[0])
      : null;
    if (!alreadyRegistered) {
      const totalRegistered = await db
        .select({ id: eventRegistrations.id })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, eventId))
        .then((r) => r.length);
      if (totalRegistered >= event.maxAttendees) {
        return NextResponse.json({ error: 'This event has reached its maximum number of attendees' }, { status: 409 });
      }
    }
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
        email,
      }),
      email,
      passwordHash: '',
      role: 'MEMBER',
      image: String(session?.user?.image ?? '') || null,
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

  const volunteeringCultural = Boolean(body.volunteeringCultural);
  const photoConsent = body.photoConsent !== false;
  const needsRide = Boolean(body.needsRide);
  const ridePickupAddress = needsRide ? String(body.ridePickupAddress ?? '').trim() || null : null;
  const donationAmount = Math.max(0, Number(body.donationAmount ?? 0)) || 0;
  const notes = String(body.notes ?? '').trim() || null;

  const effectiveAdults = 1 + (includeFamily ? familyAdults + nonMemberAdultGuests : 0);
  const effectiveChildren = includeFamily ? familyChildren + nonMemberChildGuests : 0;
  const totalAmount = event.isPaid
    ? effectiveAdults * Number(event.adultPrice ?? 0) + effectiveChildren * Number(event.childPrice ?? 0)
    : 0;
  const now = new Date().toISOString();

  const existing = await db
    .select({
      id: eventRegistrations.id,
      paymentStatus: eventRegistrations.paymentStatus,
      totalAmount: eventRegistrations.totalAmount,
      refundDue: eventRegistrations.refundDue,
    })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, user.id)))
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) {
    const alreadyPaid = existing.paymentStatus === 'Paid';
    const paidAmount = Number(existing.totalAmount) + Number(existing.refundDue ?? 0);
    const runningRefund = alreadyPaid ? paidAmount - totalAmount : -1;

    let newPaymentStatus: string;
    let newRegistrationStatus: string;
    let newRefundDue: number;

    if (alreadyPaid && runningRefund > 0) {
      newPaymentStatus = 'Paid';
      newRegistrationStatus = existing.paymentStatus === 'Paid' ? 'Confirmed' : 'Pending Registration';
      newRefundDue = runningRefund;
    } else if (alreadyPaid && runningRefund === 0) {
      newPaymentStatus = 'Paid';
      newRegistrationStatus = 'Confirmed';
      newRefundDue = 0;
    } else {
      newPaymentStatus = event.isPaid ? 'Unpaid' : 'Paid';
      newRegistrationStatus = 'Pending Registration';
      newRefundDue = 0;
    }

    await db
      .update(eventRegistrations)
      .set({
        volunteering: Boolean(body.volunteering),
        volunteeringCultural,
        photoConsent,
        needsRide,
        ridePickupAddress,
        donationAmount,
        notes,
        includeFamily,
        selectedFamilyMemberIds: JSON.stringify(includeFamily ? effectiveFamilyIds : []),
        nonMemberGuestDetails: JSON.stringify(includeFamily ? nonMemberGuests : []),
        nonMemberAdultGuests: includeFamily ? nonMemberAdultGuests : 0,
        nonMemberChildGuests: includeFamily ? nonMemberChildGuests : 0,
        adultsCount: effectiveAdults,
        childrenCount: effectiveChildren,
        totalAmount,
        refundDue: newRefundDue,
        paymentStatus: newPaymentStatus,
        registrationStatus: newRegistrationStatus,
        updatedAt: now,
      })
      .where(eq(eventRegistrations.id, existing.id));

    return NextResponse.json({
      message: newPaymentStatus === 'Paid' ? 'Registration updated.' : 'Pending Registration',
      totalAmount,
      refundDue: newRefundDue,
    }, { status: 200 });
  } else {
    await db.insert(eventRegistrations).values({
      id: crypto.randomUUID(),
      eventId,
      userId: user.id,
      volunteering: Boolean(body.volunteering),
      volunteeringCultural,
      photoConsent,
      needsRide,
      ridePickupAddress,
      donationAmount,
      notes,
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

    // Send registration confirmation to user and notification to admins
    const userName = session?.user?.name ?? email;
    const eventInfo = { title: event.title, date: event.date, time: event.time, location: event.location };
    import('@/lib/email').then(({ sendEventRegistrationEmail, sendEventRegistrationAdminEmail }) => {
      sendEventRegistrationEmail({
        to: email,
        userName,
        event: eventInfo,
        adultsCount: effectiveAdults,
        childrenCount: effectiveChildren,
        totalAmount,
        isPaid: event.isPaid,
        paymentInstructions: event.paymentInstructions,
      }).catch((err: unknown) => console.error('[email] event registration user email failed:', err));

      sendEventRegistrationAdminEmail({
        event: eventInfo,
        registrantName: userName,
        registrantEmail: email,
        adultsCount: effectiveAdults,
        childrenCount: effectiveChildren,
        totalAmount,
        isPaid: event.isPaid,
      }).catch((err: unknown) => console.error('[email] event registration admin email failed:', err));
    }).catch((err: unknown) => console.error('[email] import failed:', err));
  }

  return NextResponse.json({ message: 'Pending Registration', totalAmount }, { status: 200 });
}
