import { DefaultSession } from 'next-auth';
import type { RegistrationStatus } from '@/lib/registration';

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
      registrationStatus?: RegistrationStatus;
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
    registrationStatus?: RegistrationStatus;
    /** When role/membership were last read from D1 (ms since epoch) */
    syncedAt?: number;
  }
}
