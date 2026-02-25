import { and, eq } from 'drizzle-orm';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { users, eventCoordinators } from '@/db/schema';

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

export async function requireAdmin(request: NextRequest): Promise<AdminContext | null> {
  const session = await auth();
  const sessionEmail = String(session?.user?.email ?? '').trim().toLowerCase();
  const sessionRole = String(session?.user?.role ?? '').trim().toUpperCase();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });
  const tokenEmail = String(token?.email ?? '').trim().toLowerCase();
  const tokenRole = String(token?.role ?? '').trim().toUpperCase();

  const email = sessionEmail || tokenEmail;
  if (!email) return null;

  if (sessionRole === 'ADMIN' || tokenRole === 'ADMIN' || getAdminEmails().includes(email)) {
    return { email };
  }

  try {
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

  // Use auth() first (NextAuth v5 compatible), fall back to getToken
  const session = await auth();
  const sessionEmail = String(session?.user?.email ?? '').trim().toLowerCase();
  const sessionUserId = String(session?.user?.id ?? '').trim();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });
  const tokenEmail = String(token?.email ?? '').trim().toLowerCase();
  const tokenUserId = String(token?.sub ?? '').trim();

  const email = sessionEmail || tokenEmail;
  const userId = sessionUserId || tokenUserId;

  if (!email || !userId) return null;

  try {
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
 * Returns the authenticated user's DB id (sub) from the JWT token,
 * without requiring admin role. Used for coordinator-only endpoints.
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  // Use auth() first (NextAuth v5 compatible)
  const session = await auth();
  const sessionUserId = String(session?.user?.id ?? '').trim();
  if (sessionUserId) return sessionUserId;

  // Fallback to getToken
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });
  const userId = String(token?.sub ?? '').trim();
  return userId || null;
}
