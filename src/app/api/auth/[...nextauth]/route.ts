import { handlers } from '@/lib/auth';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const res = await handlers.GET(req);
    if (res.status >= 500) {
      const body = await res.text();
      return new Response(JSON.stringify({ status: res.status, body }), {
        status: res.status,
        headers: { 'content-type': 'application/json' },
      });
    }
    return res;
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}\n${e.stack}` : String(e);
    return new Response(JSON.stringify({ threw: msg }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const res = await handlers.POST(req);
    if (res.status >= 500) {
      const body = await res.text();
      return new Response(JSON.stringify({ status: res.status, body }), {
        status: res.status,
        headers: { 'content-type': 'application/json' },
      });
    }
    return res;
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}\n${e.stack}` : String(e);
    return new Response(JSON.stringify({ threw: msg }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
