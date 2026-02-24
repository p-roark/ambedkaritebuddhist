import { eq } from 'drizzle-orm';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
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
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });

  const email = String(token?.email ?? '').trim().toLowerCase();
  if (!email) return null;

  if (getAdminEmails().includes(email)) {
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
