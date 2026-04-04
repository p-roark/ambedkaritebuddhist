import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const ALWAYS_ALLOW = ['/auth/login', '/api/auth', '/maintenance', '/_next', '/favicon'];

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  // Always allow auth, maintenance, and Next.js internals
  if (ALWAYS_ALLOW.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Admins pass through — role is in the JWT, no DB hit
  const role = (req.auth as { user?: { role?: string } } | null)?.user?.role;
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
      .select({ maintenanceMode: organizationSettings.maintenanceMode })
      .from(organizationSettings)
      .where(eq(organizationSettings.id, 'main'))
      .limit(1);

    if (rows[0]?.maintenanceMode === 1) {
      return NextResponse.redirect(new URL('/maintenance', req.url));
    }
  } catch {
    // D1 unavailable — fail open (don't block the site)
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.ico$).*)'],
};
