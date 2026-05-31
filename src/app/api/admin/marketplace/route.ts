import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return session;
}

// GET /api/admin/marketplace?resource=items|requests
// POST /api/admin/marketplace — create a new marketplace item
// PATCH /api/admin/marketplace — update item or request
// DELETE /api/admin/marketplace — delete item

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get('resource') ?? 'items';

  const [{ desc, asc }, { getDb }, { marketplaceItems, marketplaceRequests }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  if (resource === 'requests') {
    const rows = await db
      .select()
      .from(marketplaceRequests)
      .orderBy(desc(marketplaceRequests.createdAt));
    return NextResponse.json({ requests: rows });
  }

  const rows = await db
    .select()
    .from(marketplaceItems)
    .orderBy(asc(marketplaceItems.createdAt));
  return NextResponse.json({ items: rows });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, description, category, price, imageUrl, contactInfo } = body as Record<string, unknown>;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const [{ getDb }, { marketplaceItems }] = await Promise.all([
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(marketplaceItems).values({
    id,
    title: (title as string).trim(),
    description: typeof description === 'string' ? description.trim() : '',
    category: typeof category === 'string' && category.trim() ? category.trim() : 'Other',
    price: typeof price === 'string' && price.trim() ? price.trim() : null,
    imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null,
    contactInfo: typeof contactInfo === 'string' && contactInfo.trim() ? contactInfo.trim() : null,
    status: 'available',
    createdBy: authResult.user?.id ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ success: true, id }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, id, ...patch } = body as Record<string, unknown>;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const [{ eq }, { getDb }, { marketplaceItems, marketplaceRequests }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  const now = new Date().toISOString();

  if (type === 'request') {
    const update: Record<string, unknown> = { updatedAt: now };
    if (typeof patch.status === 'string') update.status = patch.status;
    if (typeof patch.adminNote === 'string') update.adminNote = patch.adminNote;
    await db.update(marketplaceRequests).set(update).where(eq(marketplaceRequests.id, id));
  } else {
    const update: Record<string, unknown> = { updatedAt: now };
    if (typeof patch.title === 'string') update.title = patch.title;
    if (typeof patch.description === 'string') update.description = patch.description;
    if (typeof patch.category === 'string') update.category = patch.category;
    if (patch.price !== undefined) update.price = patch.price as string | null;
    if (patch.imageUrl !== undefined) update.imageUrl = patch.imageUrl as string | null;
    if (patch.contactInfo !== undefined) update.contactInfo = patch.contactInfo as string | null;
    if (typeof patch.status === 'string') update.status = patch.status;
    await db.update(marketplaceItems).set(update).where(eq(marketplaceItems.id, id));
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const [{ eq }, { getDb }, { marketplaceItems }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  await db.delete(marketplaceItems).where(eq(marketplaceItems.id, id));
  return NextResponse.json({ success: true });
}
