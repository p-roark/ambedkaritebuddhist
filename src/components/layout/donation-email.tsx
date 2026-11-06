'use client';

import { useEffect, useState } from 'react';
import { fetchDonationEmail } from '@/lib/org-settings-client';

/** Shown in place of the address if it couldn't be loaded at all. */
const UNAVAILABLE_TEXT = 'the address on our Contact page';

/**
 * The Interac e-Transfer address for donations, set by admins in
 * Settings → Email → Donations (or the organization email when blank).
 * "…" while loading; a pointer to the Contact page if it can't be loaded.
 */
export function useDonationEmail(): string {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    fetchDonationEmail()
      .then((value) => alive && setEmail(value))
      .catch(() => alive && setEmail(null));
    return () => {
      alive = false;
    };
  }, []);
  if (email === undefined) return '…';
  return email ?? UNAVAILABLE_TEXT;
}

/** Inline address for server-rendered pages. */
export function DonationEmail() {
  return <>{useDonationEmail()}</>;
}
