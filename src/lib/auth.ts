import NextAuth from 'next-auth';
import FacebookProvider from 'next-auth/providers/facebook';
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

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,

  session: { strategy: 'jwt' },

  callbacks: {
    // Only allow OAuth sign-in with a real email
    async signIn({ user, account }) {
      const allowedProviders = ['google', 'facebook'];
      return allowedProviders.includes(account?.provider ?? '') && Boolean(user.email);
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

      // Admin override via env var
      if (isAdminEmail) {
        token.role = 'ADMIN';
        token.isMember = true;
        return token;
      }

      // Look up user in D1 to get live role + membership status
      try {
        const [{ eq }, { getDb }, { users }] = await Promise.all([
          import('drizzle-orm'),
          import('@/db'),
          import('@/db/schema'),
        ]);

        const db = getDb();
        const row = await db
          .select({ role: users.role, id: users.id })
          .from(users)
          .where(eq(users.email, tokenEmail))
          .limit(1)
          .then((r) => r[0]);

        if (row) {
          token.role     = row.role;
          token.isMember = true;
          token.sub      = row.id;
        } else {
          // New Google user — not yet in DB, needs referral code
          token.isMember = false;
        }
      } catch {
        // D1 not configured yet — keep defaults, don't block auth
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id       = token.sub!;
        session.user.role     = (token.role as string) ?? 'MEMBER';
        session.user.isMember = Boolean(token.isMember);
      }
      return session;
    },
  },

  pages: { signIn: '/auth/login' },
});
