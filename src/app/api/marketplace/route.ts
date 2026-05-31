import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

// GET /api/marketplace — public listing of available items
// POST /api/marketplace — submit a listing request (authenticated or guest)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  const [{ eq, asc, and }, { getDb }, { marketplaceItems }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  const conditions = [eq(marketplaceItems.status, 'available')];
  if (category && category !== 'All') {
    conditions.push(eq(marketplaceItems.category, category));
  }

  const items = await db
    .select()
    .from(marketplaceItems)
    .where(and(...conditions))
    .orderBy(asc(marketplaceItems.createdAt));

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    submitterName,
    submitterEmail,
    submitterPhone,
    itemTitle,
    itemDescription,
    itemCategory,
    askingPrice,
    message,
    userId,
  } = body as Record<string, unknown>;

  if (!submitterName || typeof submitterName !== 'string' || !submitterName.trim()) {
    return NextResponse.json({ error: 'Your name is required' }, { status: 400 });
  }
  if (!submitterEmail || typeof submitterEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }
  if (!itemTitle || typeof itemTitle !== 'string' || !itemTitle.trim()) {
    return NextResponse.json({ error: 'Item title is required' }, { status: 400 });
  }

  const [{ getDb }, { marketplaceRequests }] = await Promise.all([
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(marketplaceRequests).values({
    id,
    userId: typeof userId === 'string' && userId ? userId : null,
    submitterName: (submitterName as string).trim(),
    submitterEmail: (submitterEmail as string).trim().toLowerCase(),
    submitterPhone: typeof submitterPhone === 'string' && submitterPhone.trim() ? submitterPhone.trim() : null,
    itemTitle: (itemTitle as string).trim(),
    itemDescription: typeof itemDescription === 'string' ? itemDescription.trim() : '',
    itemCategory: typeof itemCategory === 'string' && itemCategory.trim() ? itemCategory.trim() : 'Other',
    askingPrice: typeof askingPrice === 'string' && askingPrice.trim() ? askingPrice.trim() : null,
    message: typeof message === 'string' && message.trim() ? message.trim() : null,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ success: true, id }, { status: 201 });
}
