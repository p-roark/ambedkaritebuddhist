'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';

export function AccountInactiveModal() {
  const { data: session, update } = useSession();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const userStatus = session?.user?.status;
  const activationRequestStatus = session?.user?.activationRequestStatus;

  if (!session || (userStatus !== 'inactive' && userStatus !== 'blocked')) return null;

  const hasPendingRequest = activationRequestStatus === 'pending' || sent;

  const handleRequestActivation = async () => {
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/me/status', { method: 'POST' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to send request. Please try again.');
        return;
      }
      setSent(true);
      await update();
    } catch {
      setError('Failed to send request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {userStatus === 'blocked' ? 'Account Blocked' : 'Account Deactivated'}
          </h3>
        </div>

        <div className="px-6 py-5 space-y-3">
          {userStatus === 'blocked' ? (
            <p className="text-sm text-gray-700">
              Your account has been blocked due to multiple failed reactivation attempts.
              Please contact the community administrators directly to resolve this.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-700">
                Your account has been deactivated by an administrator. You cannot access the
                site until your account is reactivated. You may send a reactivation request
                to the admins below.
              </p>
              {hasPendingRequest && (
                <div className="bg-green-50 border border-green-200 rounded-md px-4 py-3">
                  <p className="text-sm text-green-800">
                    Your reactivation request has been sent. Please wait for an admin to review it.
                    You will be notified once your account is reactivated.
                  </p>
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-between gap-3">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Sign Out
          </button>
          {userStatus === 'inactive' && !hasPendingRequest && (
            <button
              onClick={handleRequestActivation}
              disabled={sending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Request Reactivation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
