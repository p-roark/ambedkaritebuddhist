import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ALWAYS_ALLOW = ['/auth/login', '/api/auth', '/maintenance', '/_next', '/favicon'];

// The maintenance flag is cached per Worker isolate so most requests skip D1.
// Toggling maintenance mode takes effect within this window.
const MAINTENANCE_CACHE_MS = 30_000;

type MaintenanceState = { enabled: boolean; message: string | null; orgName: string | null };

let maintenanceCache: { at: number; state: MaintenanceState } | null = null;

async function getMaintenanceState(): Promise<MaintenanceState> {
  const now = Date.now();
  if (maintenanceCache && now - maintenanceCache.at < MAINTENANCE_CACHE_MS) return maintenanceCache.state;

  const [{ eq }, { getDb }, { organizationSettings }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);

  const rows = await getDb()
    .select({
      maintenanceMode: organizationSettings.maintenanceMode,
      maintenanceMessage: organizationSettings.maintenanceMessage,
      orgName: organizationSettings.orgName,
    })
    .from(organizationSettings)
    .where(eq(organizationSettings.id, 'main'))
    .limit(1);

  const state = {
    enabled: rows[0]?.maintenanceMode === 1,
    message: rows[0]?.maintenanceMessage ?? null,
    orgName: rows[0]?.orgName ?? null,
  };
  maintenanceCache = { at: now, state };
  return state;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow auth, maintenance, and Next.js internals
  if (ALWAYS_ALLOW.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  let state: MaintenanceState;
  try {
    state = await getMaintenanceState();
  } catch {
    // D1 unavailable — fail open (don't block the site)
    return NextResponse.next();
  }
  if (!state.enabled) return NextResponse.next();

  // Admins bypass maintenance mode. Decrypting the session costs CPU, so only
  // do it while maintenance is on and a session cookie is present.
  // NextAuth v5 uses authjs.session-token (with __Secure- prefix on HTTPS)
  const isSecure = req.nextUrl.protocol === 'https:';
  const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token';
  if (req.cookies.has(cookieName)) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET, cookieName });
    if (token?.role === 'ADMIN') return NextResponse.next();
  }

  const dest = new URL('/maintenance', req.url);
  if (state.orgName) dest.searchParams.set('org', state.orgName);
  if (state.message) dest.searchParams.set('msg', state.message);
  return NextResponse.redirect(dest);
}

export const config = {
  // Pages only: skip API routes, Next.js internals and any path with a file
  // extension (images, robots.txt, sitemap.xml, …) so they don't pay for this.
  matcher: ['/((?!api/|_next/|.*\\.[a-zA-Z0-9]+$).*)'],
};
