import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      isMember: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    isMember?: boolean;
  }
}
