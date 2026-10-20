import { NextResponse } from 'next/server';
import { getRegistrationStatus, type RegistrationStatus } from '@/lib/registration';

function getAdminEmails() {
  return (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export type CurrentUser = {
  email: string;
  sessionName: string | null;
  sessionImage: string | null;
  isAdmin: boolean;
  user: {
    id: string;
    name: string;
    role: string;
    image: string | null;
    referredBy: string | null;
    registrationCompletedAt: string | null;
  } | null;
  registrationStatus: RegistrationStatus;
};

/**
 * Resolves the signed-in user and their registration status.
 * Never creates a User row — only the registration endpoint does that.
 * Returns null when nobody is signed in.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  const email = String(session?.user?.email ?? '').trim().toLowerCase();
  if (!email) return null;

  const [{ eq }, { getDb }, { users }] = await Promise.all([
    import('drizzle-orm'),
    import('@/db'),
    import('@/db/schema'),
  ]);
  const db = getDb();
  const user = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      image: users.image,
      referredBy: users.referredBy,
      registrationCompletedAt: users.registrationCompletedAt,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  const isAdmin = session?.user?.role === 'ADMIN' || getAdminEmails().includes(email);

  return {
    email,
    sessionName: session?.user?.name ?? null,
    sessionImage: session?.user?.image ?? null,
    isAdmin,
    user,
    registrationStatus: getRegistrationStatus(user, { isAdmin }),
  };
}

/**
 * For member-only API routes: returns the registered user's id, or an error
 * response (401 when signed out, 403 when registration is not complete).
 */
export async function requireRegisteredUser(): Promise<
  { ok: true; userId: string; current: CurrentUser } | { ok: false; response: NextResponse }
> {
  const current = await getCurrentUser();
  if (!current) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!current.user || current.registrationStatus !== 'complete') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Please complete your member registration first.', registrationStatus: current.registrationStatus },
        { status: 403 },
      ),
    };
  }
  return { ok: true, userId: current.user.id, current };
}
