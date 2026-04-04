import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ALWAYS_ALLOW = ['/auth/login', '/api/auth', '/maintenance', '/_next', '/favicon'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow auth, maintenance, and Next.js internals
  if (ALWAYS_ALLOW.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Decode JWT — NextAuth v5 uses authjs.session-token (with __Secure- prefix on HTTPS)
  const isSecure = req.nextUrl.protocol === 'https:';
  const cookieName = isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token';
  const token = await getToken({ req, secret: process.env.AUTH_SECRET, cookieName });
  const role = (token?.role as string | undefined) ?? null;
  if (role === 'ADMIN') return NextResponse.next();

  // Check maintenance mode from D1 for all other users
  try {
    const [{ eq }, { getDb }, { organizationSettings }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);

    const db = getDb();
    const rows = await db
      .select({
        maintenanceMode: organizationSettings.maintenanceMode,
        maintenanceMessage: organizationSettings.maintenanceMessage,
        orgName: organizationSettings.orgName,
      })
      .from(organizationSettings)
      .where(eq(organizationSettings.id, 'main'))
      .limit(1);

    if (rows[0]?.maintenanceMode === 1) {
      const dest = new URL('/maintenance', req.url);
      if (rows[0].orgName) dest.searchParams.set('org', rows[0].orgName);
      if (rows[0].maintenanceMessage) dest.searchParams.set('msg', rows[0].maintenanceMessage);
      return NextResponse.redirect(dest);
    }
  } catch {
    // D1 unavailable — fail open (don't block the site)
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.ico$).*)'],
};
