import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

// GET /api/donations — returns active donation objectives (public)
// POST /api/donations — submit a new donation record (public)

export async function GET() {
  const [{ eq, asc }, { getDb }, { donationObjectives }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  const rows = await db
    .select()
    .from(donationObjectives)
    .where(eq(donationObjectives.active, true))
    .orderBy(asc(donationObjectives.displayOrder), asc(donationObjectives.createdAt));

  return NextResponse.json({ objectives: rows });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { objectiveId, donorName, donorEmail, donorPhone, amount, message } = body as Record<string, unknown>;

  if (!donorName || typeof donorName !== 'string' || donorName.trim().length === 0) {
    return NextResponse.json({ error: 'Donor name is required' }, { status: 400 });
  }
  if (!donorEmail || typeof donorEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
    return NextResponse.json({ error: 'Valid donor email is required' }, { status: 400 });
  }
  const amountNum = Number(amount);
  if (!amountNum || amountNum < 1) {
    return NextResponse.json({ error: 'Amount must be at least $1' }, { status: 400 });
  }

  const [{ getDb }, { donations, donationObjectives }, { eq }] = await Promise.all([
    import('@/db'),
    import('@/db/schema'),
    import('drizzle-orm'),
  ]);
  const db = getDb();

  const id = randomUUID();
  const now = new Date().toISOString();
  const resolvedObjectiveId = typeof objectiveId === 'string' && objectiveId ? objectiveId : null;
  const amountCents = Math.round(amountNum * 100);

  await db.insert(donations).values({
    id,
    objectiveId: resolvedObjectiveId,
    donorName: (donorName as string).trim(),
    donorEmail: (donorEmail as string).trim().toLowerCase(),
    donorPhone: typeof donorPhone === 'string' && donorPhone.trim() ? donorPhone.trim() : null,
    amount: amountCents,
    message: typeof message === 'string' && message.trim() ? message.trim() : null,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });

  // Look up objective title for email
  let objectiveTitle: string | null = null;
  if (resolvedObjectiveId) {
    const obj = await db
      .select({ title: donationObjectives.title })
      .from(donationObjectives)
      .where(eq(donationObjectives.id, resolvedObjectiveId))
      .limit(1)
      .then((r) => r[0]);
    objectiveTitle = obj?.title ?? null;
  }

  import('@/lib/email').then(({ sendDonationReceivedEmail, sendDonationAdminEmail }) => {
    sendDonationReceivedEmail({
      to: (donorEmail as string).trim().toLowerCase(),
      donorName: (donorName as string).trim(),
      amountCents,
      objectiveTitle,
    }).catch((err: unknown) => console.error('[email] donation received email failed:', err));

    sendDonationAdminEmail({
      donorName: (donorName as string).trim(),
      donorEmail: (donorEmail as string).trim().toLowerCase(),
      amountCents,
      objectiveTitle,
      message: typeof message === 'string' && message.trim() ? message.trim() : null,
    }).catch((err: unknown) => console.error('[email] donation admin email failed:', err));
  }).catch((err: unknown) => console.error('[email] import failed:', err));

  return NextResponse.json({ success: true, id }, { status: 201 });
}
