import { NextRequest } from 'next/server';
import { getEventImagesBucket } from '@/lib/r2';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

function inferImageContentType(key: string) {
  const lower = key.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.avif')) return 'image/avif';
  return 'application/octet-stream';
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key) {
    return new Response('Missing image key', { status: 400 });
  }

  const bucket = getEventImagesBucket();
  const object = await bucket.get(key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(object.body, {
    status: 200,
    headers: {
      'content-type': object.httpMetadata?.contentType ?? inferImageContentType(key),
      'cache-control': 'public, max-age=3600',
    },
  });
}

