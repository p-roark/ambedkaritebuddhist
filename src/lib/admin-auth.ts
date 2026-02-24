import { eq } from 'drizzle-orm';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/db';
import { users } from '@/db/schema';

export type AdminContext = {
  email: string;
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
