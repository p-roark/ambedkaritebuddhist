import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,

  trustHost: true,

  session: { strategy: 'jwt' },

  callbacks: {
    // Only allow OAuth sign-in with a real email
    async signIn({ user, account }) {
      return account?.provider === 'google' && Boolean(user.email);
    },

    async jwt({ token }) {
      const adminEmails = (process.env.ADMIN_EMAIL ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const tokenEmail = String(token.email ?? '').toLowerCase();
      const isAdminEmail = tokenEmail.length > 0 && adminEmails.includes(tokenEmail);

      token.sub = token.sub ?? (token.email as string | undefined);

      // Defaults
      if (!token.role) token.role = 'MEMBER';
      if (typeof token.isMember !== 'boolean') token.isMember = false;

      // Admin override via env var — ensure a user row exists in DB for member list visibility
      if (isAdminEmail) {
        token.role = 'ADMIN';
        token.isMember = true;
        try {
          const [{ eq }, { getDb }, { users }] = await Promise.all([
            import('drizzle-orm'),
            import('@/db'),
            import('@/db/schema'),
          ]);
          const db = getDb();
          const existing = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.email, tokenEmail)).limit(1).then((r) => r[0]);
          if (existing) {
            token.sub = existing.id;
            if (existing.role !== 'ADMIN') {
              const { eq: eq2 } = await import('drizzle-orm');
              await db.update(users).set({ role: 'ADMIN' }).where(eq2(users.id, existing.id));
            }
          } else {
            const now = new Date().toISOString();
            const id = crypto.randomUUID();
            await db.insert(users).values({ id, name: tokenEmail.split('@')[0], email: tokenEmail, passwordHash: '', role: 'ADMIN', emailVerified: now, createdAt: now, updatedAt: now });
            token.sub = id;
          }
        } catch {
          // D1 unavailable — continue without DB row
        }
        return token;
      }

      // Look up user in D1 to get live role + membership status
      try {
        const [{ eq }, { getDb }, { users, eventCoordinators }] = await Promise.all([
          import('drizzle-orm'),
          import('@/db'),
          import('@/db/schema'),
        ]);

        const db = getDb();
        const row = await db
          .select({ role: users.role, id: users.id, status: users.status, activationRequestStatus: users.activationRequestStatus })
          .from(users)
          .where(eq(users.email, tokenEmail))
          .limit(1)
          .then((r) => r[0]);

        if (row) {
          token.role                    = row.role;
          token.isMember                = true;
          token.sub                     = row.id;
          token.status                  = row.status;
          token.activationRequestStatus = row.activationRequestStatus;

          // Check if this user is a coordinator of any event
          const coordRows = await db
            .select({ eventId: eventCoordinators.eventId })
            .from(eventCoordinators)
            .where(eq(eventCoordinators.userId, row.id))
            .limit(1);
          token.isCoordinator = coordRows.length > 0;
        } else {
          // New Google user — not yet in DB, needs referral code
          token.isMember = false;
          token.isCoordinator = false;
        }
      } catch {
        // D1 not configured yet — keep defaults, don't block auth
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id                     = token.sub!;
        session.user.role                   = (token.role as string) ?? 'MEMBER';
        session.user.isMember               = Boolean(token.isMember);
        session.user.status                 = (token.status as string) ?? 'active';
        session.user.activationRequestStatus = (token.activationRequestStatus as string) ?? 'none';
        session.user.isCoordinator          = Boolean(token.isCoordinator);
      }
      return session;
    },
  },

  pages: { signIn: '/auth/login' },
});
