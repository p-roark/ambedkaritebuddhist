import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getEventImagesBucket } from '@/lib/r2';
import type { CoverImage } from '../route';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

function toCoverImageUrl(key: string): string {
  return `/api/events/image?key=${encodeURIComponent(key)}`;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const adminCtx = await requireAdmin(request);
  if (!adminCtx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { key: keySegment } = await params;
  const fullKey = `covers/${decodeURIComponent(keySegment)}`;

  const body = (await request.json()) as { name?: string };
  const name = String(body.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const bucket = getEventImagesBucket();
  const existing = await bucket.get(fullKey);
  if (!existing) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

  // R2 has no metadata-only update — re-put the object with new metadata
  await bucket.put(fullKey, existing.body, {
    httpMetadata: existing.httpMetadata,
    customMetadata: { name },
  });

  const image: CoverImage = { key: fullKey, name, url: toCoverImageUrl(fullKey) };
  return NextResponse.json({ image }, { status: 200 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const adminCtx = await requireAdmin(request);
  if (!adminCtx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { key: keySegment } = await params;
  const fullKey = `covers/${decodeURIComponent(keySegment)}`;

  const bucket = getEventImagesBucket();
  const existing = await bucket.head(fullKey);
  if (!existing) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

  await bucket.delete(fullKey);
  return NextResponse.json({ ok: true }, { status: 200 });
}
