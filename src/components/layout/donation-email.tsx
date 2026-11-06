'use client';

import { useEffect, useState } from 'react';
import { fetchDonationEmail } from '@/lib/org-settings-client';

/**
 * The Interac e-Transfer address for donations, set by admins in
 * Settings → Email → Donations (or the organization email when blank).
 */
export function useDonationEmail(): string | null {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetchDonationEmail()
      .then((value) => alive && setEmail(value))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return email;
}

/** Inline address; shows "…" for the moment it takes to load. */
export function DonationEmail() {
  const email = useDonationEmail();
  return <>{email ?? '…'}</>;
}
