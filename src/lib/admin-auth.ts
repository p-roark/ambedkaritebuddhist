import { NextRequest } from 'next/server';

export type AdminContext = {
  email: string;
};

export type CoordinatorContext = {
  email: string;
  isAdmin: boolean;
  userId: string;
};

function getAdminEmails() {
  return (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin(_request: NextRequest): Promise<AdminContext | null> {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  const email = String(session?.user?.email ?? '').trim().toLowerCase();
  const role = String(session?.user?.role ?? '').trim().toUpperCase();

  if (!email) return null;

  if (role === 'ADMIN' || getAdminEmails().includes(email)) {
    return { email };
  }

  try {
    const [{ eq }, { getDb }, { users }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    const db = getDb();
    const user = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((rows) => rows[0]);

    if (user?.role === 'ADMIN') {
      return { email };
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Allows access if user is admin OR is a coordinator of the given event.
 * Returns isAdmin=true for admins, isAdmin=false for coordinators.
 */
export async function requireAdminOrCoordinator(
  request: NextRequest,
  eventId: string,
): Promise<CoordinatorContext | null> {
  // Admin check first (fastest path)
  const admin = await requireAdmin(request);
  if (admin) {
    return { email: admin.email, isAdmin: true, userId: '' };
  }

  const { auth } = await import('@/lib/auth');
  const session = await auth();
  const email = String(session?.user?.email ?? '').trim().toLowerCase();
  const userId = String(session?.user?.id ?? '').trim();

  if (!email || !userId) return null;

  try {
    const [{ and, eq }, { getDb }, { eventCoordinators }] = await Promise.all([
      import('drizzle-orm'),
      import('@/db'),
      import('@/db/schema'),
    ]);
    const db = getDb();
    const coord = await db
      .select({ eventId: eventCoordinators.eventId })
      .from(eventCoordinators)
      .where(and(
        eq(eventCoordinators.eventId, eventId),
        eq(eventCoordinators.userId, userId),
      ))
      .limit(1)
      .then((rows) => rows[0]);

    if (coord) {
      return { email, isAdmin: false, userId };
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Returns the authenticated user's DB id from the session,
 * without requiring admin role. Used for coordinator-only endpoints.
 */
export async function getAuthenticatedUserId(_request: NextRequest): Promise<string | null> {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  const userId = String(session?.user?.id ?? '').trim();
  return userId || null;
}
