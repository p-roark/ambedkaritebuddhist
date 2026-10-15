import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      isMember: boolean;
      isCoordinator?: boolean;
      status?: string;
      activationRequestStatus?: string;
      pendingFamilyInvite?: string | null;
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
    isCoordinator?: boolean;
    status?: string;
    activationRequestStatus?: string;
    pendingFamilyInvite?: string | null;
    /** When role/membership were last read from D1 (ms since epoch) */
    syncedAt?: number;
  }
}
