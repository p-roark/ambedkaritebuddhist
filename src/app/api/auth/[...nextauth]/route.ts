import { handlers } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(req: Request, ctx: unknown) {
  try {
    return await handlers.GET(req, ctx as never);
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}\n${e.stack}` : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export async function POST(req: Request, ctx: unknown) {
  try {
    return await handlers.POST(req, ctx as never);
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}\n${e.stack}` : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
