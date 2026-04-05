'use client';

import { useEffect, useState } from 'react';
import { getSession, signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export function MembershipGate() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralError, setReferralError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifiedLocally, setIsVerifiedLocally] = useState(false);
  const [dbIsMember, setDbIsMember] = useState<boolean>(false);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);

  useEffect(() => {
    if (status !== 'authenticated') {
      setIsVerifiedLocally(false);
      setReferralCodeInput('');
      setReferralError('');
      setDbIsMember(false);
      setStatusLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const loadStatus = async () => {
      if (status !== 'authenticated') return;
      setStatusLoading(true);
      try {
        const res = await fetch('/api/me/status', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load membership status');
        const data = (await res.json()) as { isMember: boolean };
        setDbIsMember(Boolean(data.isMember));
      } catch {
        setDbIsMember(Boolean(session?.user?.isMember));
      } finally {
        setStatusLoading(false);
      }
    };

    void loadStatus();
  }, [status, session?.user?.isMember]);

  const shouldShow =
    status === 'authenticated' &&
    pathname !== '/auth/login' &&
    session?.user?.role !== 'ADMIN' &&
    !statusLoading &&
    !dbIsMember &&
    !isVerifiedLocally;

  const handleVerifyReferral = async () => {
    const normalizedCode = referralCodeInput.trim().toUpperCase();
    if (!normalizedCode) {
      setReferralError('Referral code is required');
      return;
    }

    setReferralError('');
    setIsVerifying(true);

    try {
      const response = await fetch('/api/referral/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: normalizedCode }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setReferralError(data.error ?? 'Unable to verify referral code');
        return;
      }

      setIsVerifiedLocally(true);
      setDbIsMember(true);
      await getSession();
    } catch {
      setReferralError('Unable to verify referral code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Referral Code Verification</h3>
          <p className="text-sm text-gray-600 mt-1">Enter your referral code to continue.</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="globalReferralCode" className="block text-sm font-medium text-gray-700 mb-1">
              Referral Code
            </label>
            <input
              id="globalReferralCode"
              type="text"
              value={referralCodeInput}
              onChange={(e) => {
                setReferralCodeInput(e.target.value.toUpperCase());
                if (referralError) setReferralError('');
              }}
              placeholder="BHIM-ABC-1234"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isVerifying}
            />
          </div>

          {referralError && <p className="text-sm text-red-600">{referralError}</p>}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end space-x-3">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            disabled={isVerifying}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Sign Out
          </button>
          <button
            onClick={handleVerifyReferral}
            disabled={isVerifying}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isVerifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}
