import NextAuth from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

// The jwt callback runs on every session read (each page view and API call).
// Re-read role/membership from D1 at most this often; sign-in and an explicit
// session update() always re-read immediately.
const TOKEN_SYNC_INTERVAL_MS = 60_000;

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

// One-time links emailed from /api/sign-in-link (feature switch "Email sign-in
// link"). The link opens /auth/email-link, which posts the email and token here.
providers.push(
  CredentialsProvider({
    id: 'email-link',
    name: 'Email link',
    credentials: { email: {}, token: {} },
    async authorize(credentials) {
      const email = String(credentials?.email ?? '').trim().toLowerCase();
      const token = String(credentials?.token ?? '');
      const [{ isFeatureEnabled }, { consumeSignInLink }] = await Promise.all([
        import('@/lib/feature-flags-server'),
        import('@/lib/email-sign-in'),
      ]);
      if (!(await isFeatureEnabled('emailSignIn'))) return null;
      const verified = await consumeSignInLink(email, token);
      // Role and membership are read from the account with this email in the jwt callback
      return verified ? { id: verified, email: verified, role: 'MEMBER' } : null;
    },
  }),
);

/**
 * Email-link sign-ins carry no name or photo (Google sign-ins do), so take them
 * from the member's account; values from Google are kept.
 */
function fillProfileFromAccount(token: JWT, account: { name: string | null; image: string | null }) {
  if (!token.name && account.name) token.name = account.name;
  if (!token.picture && account.image) token.picture = account.image;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,

  trustHost: true,

  session: { strategy: 'jwt' },

  callbacks: {
    // Google, or a verified email sign-in link; always with an email
    async signIn({ user, account }) {
      return (account?.provider === 'google' || account?.provider === 'email-link') && Boolean(user.email);
    },

    async jwt({ token, trigger }) {
      const now = Date.now();
      const isFresh = typeof token.syncedAt === 'number' && now - token.syncedAt < TOKEN_SYNC_INTERVAL_MS;
      if (isFresh && trigger !== 'signIn' && trigger !== 'update') return token;

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
        token.registrationStatus = 'complete';
        try {
          const [{ eq }, { getDb }, { users }] = await Promise.all([
            import('drizzle-orm'),
            import('@/db'),
            import('@/db/schema'),
          ]);
          const db = getDb();
          const existing = await db.select({ id: users.id, role: users.role, name: users.name, image: users.image }).from(users).where(eq(users.email, tokenEmail)).limit(1).then((r) => r[0]);
          if (existing) {
            token.sub = existing.id;
            fillProfileFromAccount(token, existing);
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
        token.syncedAt = now;
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
          .select({
            role: users.role,
            id: users.id,
            status: users.status,
            activationRequestStatus: users.activationRequestStatus,
            referredBy: users.referredBy,
            registrationCompletedAt: users.registrationCompletedAt,
            name: users.name,
            image: users.image,
          })
          .from(users)
          .where(eq(users.email, tokenEmail))
          .limit(1)
          .then((r) => r[0]);

        if (row) {
          const { getRegistrationStatus } = await import('@/lib/registration');
          token.role                    = row.role;
          token.registrationStatus      = getRegistrationStatus(row);
          token.isMember                = token.registrationStatus === 'complete';
          token.sub                     = row.id;
          token.status                  = row.status;
          token.activationRequestStatus = row.activationRequestStatus;
          fillProfileFromAccount(token, row);

          // Check if this user is a coordinator of any event
          const coordRows = await db
            .select({ eventId: eventCoordinators.eventId })
            .from(eventCoordinators)
            .where(eq(eventCoordinators.userId, row.id))
            .limit(1);
          token.isCoordinator = coordRows.length > 0;

          // Check for a pending family invite matching this email (Option 2: email-match)
          const { isFeatureEnabled } = await import('@/lib/feature-flags-server');
          if (await isFeatureEnabled('family')) {
            const { familyMembers } = await import('@/db/schema');
            const { and } = await import('drizzle-orm');
            const pendingInvite = await db
              .select({ inviteCode: familyMembers.inviteCode })
              .from(familyMembers)
              .where(and(
                eq(familyMembers.email, tokenEmail),
                eq(familyMembers.inviteStatus, 'pending'),
              ))
              .limit(1)
              .then(r => r[0]);
            token.pendingFamilyInvite = pendingInvite?.inviteCode ?? null;
          } else {
            token.pendingFamilyInvite = null;
          }
          token.syncedAt = now;
        } else {
          // New Google user — not yet in DB, must register via an invite link
          token.registrationStatus = 'invite_required';
          token.isMember = false;
          token.isCoordinator = false;
          token.syncedAt = now;
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
        session.user.pendingFamilyInvite    = (token.pendingFamilyInvite as string | null | undefined) ?? null;
        session.user.registrationStatus     = token.registrationStatus ?? 'invite_required';
      }
      return session;
    },
  },

  // Sign-in problems (e.g. cancelling on Google's screen) land back on our login
  // page with ?error=…, instead of Auth.js's generic "Server error" page
  pages: { signIn: '/auth/login', error: '/auth/login' },
});
