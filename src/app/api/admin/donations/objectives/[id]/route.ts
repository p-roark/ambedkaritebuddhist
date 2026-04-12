import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// PUT /api/admin/donations/objectives/[id] — update a donation objective
// DELETE /api/admin/donations/objectives/[id] — delete a donation objective

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, description, targetAmount, currentAmount, active, displayOrder } = body as Record<string, unknown>;

  const [{ eq }, { getDb }, { donationObjectives }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: now };

  if (typeof title === 'string' && title.trim()) updates.title = title.trim();
  if (typeof description === 'string') updates.description = description.trim();
  if (typeof targetAmount === 'number') updates.targetAmount = Math.round(targetAmount * 100);
  if (typeof currentAmount === 'number') updates.currentAmount = Math.round(currentAmount * 100);
  if (typeof active === 'boolean') updates.active = active;
  if (typeof displayOrder === 'number') updates.displayOrder = displayOrder;

  await db.update(donationObjectives).set(updates).where(eq(donationObjectives.id, id));

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  const [{ eq }, { getDb }, { donationObjectives }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  await db.delete(donationObjectives).where(eq(donationObjectives.id, id));

  return NextResponse.json({ success: true });
}
