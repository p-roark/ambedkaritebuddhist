import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';

export const authOptions: NextAuthOptions = {
  // No DB adapter needed — we use JWT sessions and query the DB directly.
  // If you add OAuth providers later, wire up @auth/drizzle-adapter here.

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const db   = getDb();
        const rows = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        const user = rows[0];
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id:    user.id,
          email: user.email,
          name:  user.name,
          role:  user.role,
          image: user.image ?? undefined,
        };
      },
    }),

    // OAuth providers — enabled only when keys are present in env
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId:     process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),

    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [FacebookProvider({
          clientId:     process.env.FACEBOOK_CLIENT_ID,
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        })]
      : []),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers (Google etc.) — create the user in D1 if new
      if (account?.provider && account.provider !== 'credentials') {
        try {
          const db = getDb();
          const existing = await db
            .select({ id: users.id, role: users.role })
            .from(users)
            .where(eq(users.email, user.email!))
            .limit(1);

          if (existing.length === 0) {
            const now = new Date().toISOString();
            await db.insert(users).values({
              id:           crypto.randomUUID(),
              name:         user.name  ?? 'Community Member',
              email:        user.email!,
              passwordHash: '', // OAuth users don't have a password
              role:         'MEMBER',
              image:        user.image ?? null,
              emailVerified: now,
              createdAt:    now,
              updatedAt:    now,
            });
          } else {
            // Carry role forward onto the user object for the jwt callback
            (user as { role?: string }).role = existing[0].role;
          }
        } catch (err) {
          console.error('OAuth signIn DB error:', err);
          return false; // Block sign-in on DB failure
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role ?? 'MEMBER';
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id   = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: { signIn: '/auth/login' },
};
