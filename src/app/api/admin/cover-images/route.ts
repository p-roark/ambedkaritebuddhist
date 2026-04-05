import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getEventImagesBucket } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export type CoverImage = {
  key: string;
  name: string;
  url: string;
};

function toCoverImageUrl(key: string): string {
  return `/api/events/image?key=${encodeURIComponent(key)}`;
}

export async function GET(request: NextRequest) {
  const adminCtx = await requireAdmin(request);
  if (!adminCtx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const bucket = getEventImagesBucket();
  // include customMetadata is valid at runtime but missing from the TS type definition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listed = await bucket.list({ prefix: 'covers/', include: ['customMetadata'] } as any);

  const images: CoverImage[] = listed.objects.map((obj) => ({
    key: obj.key,
    name: (obj.customMetadata?.name as string | undefined) ?? obj.key.split('/').pop() ?? obj.key,
    url: toCoverImageUrl(obj.key),
  }));

  return NextResponse.json({ images }, { status: 200 });
}

function inferContentType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.avif')) return 'image/avif';
  return 'application/octet-stream';
}

export async function POST(request: NextRequest) {
  const adminCtx = await requireAdmin(request);
  if (!adminCtx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const form = await request.formData();
  const file = form.get('file');
  const name = String(form.get('name') ?? '').trim();

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: 'File is required' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 400 });
  }

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const key = `covers/${crypto.randomUUID()}.${ext}`;
  const contentType = file.type || inferContentType(file.name);

  const bucket = getEventImagesBucket();
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType },
    customMetadata: { name },
  });

  const image: CoverImage = { key, name, url: toCoverImageUrl(key) };
  return NextResponse.json({ image }, { status: 201 });
}
