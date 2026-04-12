import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/donations — list all donations with objective info
// (objectives CRUD is handled under /api/admin/donations/objectives)

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [{ desc, eq }, { getDb }, { donations, donationObjectives }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  const rows = await db
    .select({
      id: donations.id,
      objectiveId: donations.objectiveId,
      objectiveTitle: donationObjectives.title,
      donorName: donations.donorName,
      donorEmail: donations.donorEmail,
      donorPhone: donations.donorPhone,
      amount: donations.amount,
      message: donations.message,
      status: donations.status,
      adminNote: donations.adminNote,
      createdAt: donations.createdAt,
      updatedAt: donations.updatedAt,
    })
    .from(donations)
    .leftJoin(donationObjectives, eq(donations.objectiveId, donationObjectives.id))
    .orderBy(desc(donations.createdAt));

  return NextResponse.json({ donations: rows });
}

// PATCH /api/admin/donations — update donation status / adminNote
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, status, adminNote, confirmedAmount } = body as Record<string, unknown>;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const [{ eq }, { getDb }, { donations, donationObjectives }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  const now = new Date().toISOString();

  // If confirming a donation, fetch objective info before the update
  let objectiveIdToUpdate: string | null = null;
  if (status === 'confirmed' && typeof confirmedAmount === 'number') {
    const [existing] = await db.select({ objectiveId: donations.objectiveId }).from(donations).where(eq(donations.id, id)).limit(1);
    objectiveIdToUpdate = existing?.objectiveId ?? null;
  }

  const updates: Record<string, unknown> = { updatedAt: now };
  if (typeof status === 'string') updates.status = status;
  if (typeof adminNote === 'string') updates.adminNote = adminNote;

  await db.update(donations).set(updates).where(eq(donations.id, id));

  // Increment the objective's currentAmount after confirming
  if (objectiveIdToUpdate && typeof confirmedAmount === 'number') {
    const [obj] = await db.select({ currentAmount: donationObjectives.currentAmount }).from(donationObjectives).where(eq(donationObjectives.id, objectiveIdToUpdate)).limit(1);
    if (obj) {
      await db.update(donationObjectives).set({
        currentAmount: obj.currentAmount + confirmedAmount,
        updatedAt: now,
      }).where(eq(donationObjectives.id, objectiveIdToUpdate));
    }
  }

  return NextResponse.json({ success: true });
}
