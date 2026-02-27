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
      paidAmount: eventRegistrations.paidAmount,
      refundDue: eventRegistrations.refundDue,
      paymentHistory: eventRegistrations.paymentHistory,
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
    action?: 'updateEvent' | 'updateRegistration' | 'confirmRegistration' | 'addCoordinator' | 'removeCoordinator' | 'editRegistration' | 'addPayment' | 'addRefund';
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
    status?: EventStatus;
    eventImages?: string[];
    userId?: string;
    registrationId?: string;
    paymentStatus?: 'Paid' | 'Unpaid';
    registrationStatus?: 'Pending Registration' | 'Confirmed' | 'Rejected';
    // editRegistration fields
    volunteering?: boolean;
    selectedFamilyMemberIds?: string[];
    nonMemberAdultGuests?: number;
    nonMemberChildGuests?: number;
    nonMemberGuestDetails?: string;
    // addPayment / addRefund fields
    amount?: number;
    referenceNumber?: string;
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

  // addPayment / addRefund — admin or coordinator
  if (body.action === 'addPayment' || body.action === 'addRefund') {
    if (!body.registrationId) return NextResponse.json({ error: 'registrationId required' }, { status: 400 });
    const txAmount = Number(body.amount ?? 0);
    if (!txAmount || txAmount <= 0) return NextResponse.json({ error: 'amount must be positive' }, { status: 400 });

    const [reg] = await db
      .select({
        paidAmount: eventRegistrations.paidAmount,
        totalAmount: eventRegistrations.totalAmount,
        refundDue: eventRegistrations.refundDue,
        paymentHistory: eventRegistrations.paymentHistory,
      })
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.id, body.registrationId), eq(eventRegistrations.eventId, id)))
      .limit(1);
    if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    const isPayment = body.action === 'addPayment';
    const newPaidAmount = isPayment
      ? Number(reg.paidAmount) + txAmount
      : Math.max(0, Number(reg.paidAmount) - txAmount);

    const newRefundDue = Math.max(0, newPaidAmount - Number(reg.totalAmount));
    const newPaymentStatus = newPaidAmount >= Number(reg.totalAmount) ? 'Paid' : 'Unpaid';
    const newRegistrationStatus = newPaymentStatus === 'Paid' ? 'Confirmed' : 'Pending Registration';

    // Append to payment history
    type TxEntry = { type: 'payment' | 'refund'; amount: number; reference: string; date: string };
    let history: TxEntry[] = [];
    try {
      const parsed = JSON.parse(reg.paymentHistory || '[]') as unknown;
      if (Array.isArray(parsed)) history = parsed as TxEntry[];
    } catch { /* keep empty */ }
    history.push({
      type: isPayment ? 'payment' : 'refund',
      amount: txAmount,
      reference: String(body.referenceNumber ?? '').trim(),
      date: new Date().toISOString(),
    });

    await db
      .update(eventRegistrations)
      .set({
        paidAmount: newPaidAmount,
        refundDue: newRefundDue,
        paymentStatus: newPaymentStatus,
        registrationStatus: newRegistrationStatus,
        paymentHistory: JSON.stringify(history),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(eventRegistrations.id, body.registrationId));

    return NextResponse.json({ ok: true, paidAmount: newPaidAmount, refundDue: newRefundDue, paymentStatus: newPaymentStatus }, { status: 200 });
  }

  // editRegistration — admin or coordinator
  if (body.action === 'editRegistration') {
    if (!body.registrationId) return NextResponse.json({ error: 'registrationId required' }, { status: 400 });

    const [reg] = await db
      .select()
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.id, body.registrationId), eq(eventRegistrations.eventId, id)))
      .limit(1);
    if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    const [event] = await db
      .select({ isPaid: events.isPaid, adultPrice: events.adultPrice, childPrice: events.childPrice })
      .from(events)
      .where(eq(events.id, id))
      .limit(1);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const selectedIds = (body.selectedFamilyMemberIds ?? [])
      .map((s) => String(s).trim())
      .filter(Boolean);

    const familyRows = selectedIds.length
      ? await db
          .select({ id: familyMembers.id, age: familyMembers.age })
          .from(familyMembers)
          .where(inArray(familyMembers.id, selectedIds))
      : [];

    let familyAdults = 0;
    let familyChildren = 0;
    for (const f of familyRows) {
      if (f.age == null || Number(f.age) >= 18) familyAdults++;
      else familyChildren++;
    }

    const nonMemberAdultGuests = Number(body.nonMemberAdultGuests ?? 0);
    const nonMemberChildGuests = Number(body.nonMemberChildGuests ?? 0);
    const includeFamily = familyRows.length > 0 || nonMemberAdultGuests > 0 || nonMemberChildGuests > 0;
    const adultsCount = 1 + familyAdults + nonMemberAdultGuests;
    const childrenCount = familyChildren + nonMemberChildGuests;
    const newTotal = event.isPaid
      ? adultsCount * Number(event.adultPrice ?? 0) + childrenCount * Number(event.childPrice ?? 0)
      : 0;

    const alreadyPaid = reg.paymentStatus === 'Paid';
    // paidAmount tracks actual money received (set when admin marks Paid).
    // Use it directly — no need to reconstruct from totalAmount + refundDue.
    const paidAmount = Number(reg.paidAmount ?? 0);

    // Compare newTotal against paidAmount:
    // - newTotal < paidAmount  → overpaid, keep Paid/Confirmed, record refund owed
    // - newTotal > paidAmount  → underpaid, reset to Unpaid (paidAmount preserved as credit)
    // - newTotal === paidAmount → exact match, clear any pending refund
    // - Not paid yet          → statuses stay unchanged
    let paymentStatus = reg.paymentStatus;
    let registrationStatus = reg.registrationStatus;
    let refundDue = 0;

    if (alreadyPaid) {
      const runningRefund = paidAmount - newTotal;
      if (runningRefund > 0) {
        refundDue = runningRefund;
      } else if (runningRefund < 0) {
        paymentStatus = 'Unpaid';
        registrationStatus = 'Pending Registration';
        // paidAmount stays — it records the credit toward the new higher total
      }
      // runningRefund === 0 → stays Paid, refundDue stays 0
    }

    await db
      .update(eventRegistrations)
      .set({
        volunteering: Boolean(body.volunteering ?? reg.volunteering),
        includeFamily,
        selectedFamilyMemberIds: JSON.stringify(familyRows.map((f) => f.id)),
        nonMemberGuestDetails: body.nonMemberGuestDetails ?? '[]',
        nonMemberAdultGuests,
        nonMemberChildGuests,
        adultsCount,
        childrenCount,
        totalAmount: newTotal,
        refundDue,
        paymentStatus,
        registrationStatus,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(eventRegistrations.id, body.registrationId));

    return NextResponse.json({ ok: true, totalAmount: newTotal, paidAmount, refundDue }, { status: 200 });
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
        maxAttendees: body.maxAttendees != null ? Number(body.maxAttendees) : null,
        externalLink: body.externalLink?.trim() || null,
        status: body.status,
        eventImages: JSON.stringify(imageKeys),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(events.id, id));

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // confirmRegistration — for free events, sets registrationStatus = Confirmed
  if (body.action === 'confirmRegistration') {
    if (!body.registrationId) return NextResponse.json({ error: 'registrationId required' }, { status: 400 });
    await db
      .update(eventRegistrations)
      .set({ registrationStatus: 'Confirmed', updatedAt: new Date().toISOString() })
      .where(and(eq(eventRegistrations.id, body.registrationId), eq(eventRegistrations.eventId, id)));
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // updateRegistration — admin or coordinator
  if (!body.registrationId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const newPaymentStatus = body.paymentStatus ?? 'Unpaid';

  // When marking Paid, record paidAmount = totalAmount (full amount collected).
  // When marking Unpaid explicitly, preserve existing paidAmount (partial credit stays).
  const paidAmountUpdate: Record<string, unknown> = {};
  if (newPaymentStatus === 'Paid') {
    const reg = await db
      .select({ totalAmount: eventRegistrations.totalAmount })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.id, body.registrationId))
      .limit(1)
      .then((r) => r[0]);
    if (reg) paidAmountUpdate.paidAmount = Number(reg.totalAmount);
  }

  await db
    .update(eventRegistrations)
    .set({
      paymentStatus: newPaymentStatus,
      registrationStatus: body.registrationStatus ?? 'Pending Registration',
      ...paidAmountUpdate,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(eventRegistrations.id, body.registrationId), eq(eventRegistrations.eventId, id)));

  return NextResponse.json({ ok: true }, { status: 200 });
}
