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

  const [{ getDb }, { donations }] = await Promise.all([
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(donations).values({
    id,
    objectiveId: typeof objectiveId === 'string' && objectiveId ? objectiveId : null,
    donorName: donorName.trim(),
    donorEmail: donorEmail.trim().toLowerCase(),
    donorPhone: typeof donorPhone === 'string' && donorPhone.trim() ? donorPhone.trim() : null,
    amount: Math.round(amountNum * 100), // store in cents
    message: typeof message === 'string' && message.trim() ? message.trim() : null,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ success: true, id }, { status: 201 });
}
