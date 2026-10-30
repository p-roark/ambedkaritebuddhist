'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { readPendingInviteCode } from '@/lib/pending-invite';
import type { RegistrationStatus } from '@/lib/registration';

// Pages a signed-in but unregistered user may still visit. /about holds ABCC's
// purposes, which the registration form links to before the consent.
const UNGATED_PATHS = ['/join', '/auth/login', '/about', '/contact', '/maintenance'];

export function MembershipGate() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);

  const isAdmin = session?.user?.role === 'ADMIN';
  const isUngatedPath = UNGATED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (status !== 'authenticated') {
      setRegistrationStatus(null);
      return;
    }
    if (isAdmin || registrationStatus === 'complete') return;

    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/me/status', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load registration status');
        const data = (await res.json()) as { registrationStatus: RegistrationStatus };
        if (alive) setRegistrationStatus(data.registrationStatus);
      } catch {
        if (alive) setRegistrationStatus(session?.user?.registrationStatus ?? null);
      }
    };
    void load();
    return () => {
      alive = false;
    };
    // Re-check on navigation until registration is complete (e.g. right after /join)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAdmin, pathname]);

  // Send users who can register straight to the registration form
  useEffect(() => {
    if (isUngatedPath || isAdmin) return;
    if (registrationStatus === 'profile_required') {
      router.replace('/join');
    } else if (registrationStatus === 'invite_required') {
      const code = readPendingInviteCode();
      if (code) router.replace(`/join?code=${encodeURIComponent(code)}`);
    }
  }, [registrationStatus, isUngatedPath, isAdmin, router]);

  const shouldShow =
    status === 'authenticated' &&
    !isAdmin &&
    !isUngatedPath &&
    registrationStatus === 'invite_required' &&
    !readPendingInviteCode();

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-only-title"
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
      >
        <div className="px-6 py-4 border-b">
          <h2 id="invite-only-title" className="text-lg font-semibold text-gray-900">
            Membership is by invitation
          </h2>
        </div>

        <div className="px-6 py-5 space-y-3 text-base text-gray-700">
          <p>
            You are signed in as <span className="font-medium">{session?.user?.email}</span>, but this account is
            not registered yet.
          </p>
          <p>
            To join, please open the invite link you received from the community. If you don&apos;t have one,
            contact us and we&apos;ll help you.
          </p>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Sign Out
          </button>
          <Link
            href="/contact"
            className="px-4 py-2 text-sm text-white bg-primary-blue rounded-md hover:bg-primary-blue/90"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
