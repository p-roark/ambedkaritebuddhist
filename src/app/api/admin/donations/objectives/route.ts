import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

// GET /api/admin/donations/objectives — list all objectives (including inactive)
// POST /api/admin/donations/objectives — create a new objective

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [{ asc }, { getDb }, { donationObjectives }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  const rows = await db
    .select()
    .from(donationObjectives)
    .orderBy(asc(donationObjectives.displayOrder), asc(donationObjectives.createdAt));

  return NextResponse.json({ objectives: rows });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, description, targetAmount, active, displayOrder } = body as Record<string, unknown>;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const [{ getDb }, { donationObjectives }] = await Promise.all([
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(donationObjectives).values({
    id,
    title: title.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    targetAmount: typeof targetAmount === 'number' ? Math.round(targetAmount * 100) : 0,
    currentAmount: 0,
    active: active !== false,
    displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ success: true, id }, { status: 201 });
}
