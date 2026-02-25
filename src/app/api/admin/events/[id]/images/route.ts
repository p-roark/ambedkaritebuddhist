import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { events } from '@/db/schema';
import { requireAdminOrCoordinator } from '@/lib/admin-auth';
import { getEventImagesBucket, parseEventImageKeys } from '@/lib/r2';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const MAX_IMAGES_PER_EVENT = 25;

function inferImageContentType(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.avif')) return 'image/avif';
  return 'application/octet-stream';
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdminOrCoordinator(request, id);
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = getDb();
  const bucket = getEventImagesBucket();

  const event = await db
    .select({ id: events.id, eventImages: events.eventImages })
    .from(events)
    .where(eq(events.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const form = await request.formData();
  const files = form.getAll('images').filter((item): item is File => item instanceof File);
  if (files.length === 0) return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });

  const existingKeys = parseEventImageKeys(event.eventImages);
  if (existingKeys.length + files.length > MAX_IMAGES_PER_EVENT) {
    return NextResponse.json({ error: `Maximum ${MAX_IMAGES_PER_EVENT} images allowed per event` }, { status: 400 });
  }

  const uploadedKeys: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }
    const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
    const key = `events/${id}/${crypto.randomUUID()}.${extension}`;
    const contentType = file.type || inferImageContentType(file.name);
    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType },
    });
    uploadedKeys.push(key);
  }

  const nextKeys = [...existingKeys, ...uploadedKeys];
  await db
    .update(events)
    .set({
      eventImages: JSON.stringify(nextKeys),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(events.id, id));

  return NextResponse.json({ imageKeys: nextKeys }, { status: 200 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdminOrCoordinator(request, id);
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = getDb();
  const bucket = getEventImagesBucket();

  const body = (await request.json()) as { key?: string };
  if (!body.key) return NextResponse.json({ error: 'Missing image key' }, { status: 400 });

  const event = await db
    .select({ id: events.id, eventImages: events.eventImages })
    .from(events)
    .where(eq(events.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const keys = parseEventImageKeys(event.eventImages);
  if (!keys.includes(body.key)) {
    return NextResponse.json({ error: 'Image key not found for event' }, { status: 404 });
  }

  await bucket.delete(body.key);
  const nextKeys = keys.filter((key) => key !== body.key);

  await db
    .update(events)
    .set({
      eventImages: JSON.stringify(nextKeys),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(events.id, id));

  return NextResponse.json({ imageKeys: nextKeys }, { status: 200 });
}

