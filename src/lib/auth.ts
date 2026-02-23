import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : [],

  session: { strategy: 'jwt' },

  callbacks: {
    async signIn({ user, account }) {
      return account?.provider === 'google' && Boolean(user.email);
    },

    async jwt({ token }) {
      const adminEmails = (process.env.ADMIN_EMAIL ?? '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
      const tokenEmail = String(token.email ?? '').toLowerCase();
      const isAdminEmail = tokenEmail.length > 0 && adminEmails.includes(tokenEmail);

      token.sub = token.sub ?? (token.email as string | undefined);
      if (!token.role) token.role = 'MEMBER';
      if (typeof token.isMember !== 'boolean') token.isMember = false;
      if (isAdminEmail) {
        token.role = 'ADMIN';
        token.isMember = true;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = (token.role as string) ?? 'MEMBER';
        session.user.isMember = Boolean(token.isMember);
      }
      return session;
    },
  },

  pages: { signIn: '/auth/login' },
};
