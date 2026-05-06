'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

type InviteDetails = {
  memberName: string;
  relationship: string;
  ownerName: string;
};

type PageState = 'loading' | 'ready' | 'not-found' | 'expired' | 'already-accepted' | 'success' | 'error';

export default function AcceptInvitePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? '';

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [manualCode, setManualCode] = useState(code);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!code) {
      setPageState('ready');
      return;
    }
    void fetchInvite(code);
  }, [code]);

  async function fetchInvite(inviteCode: string) {
    setPageState('loading');
    const res = await fetch(`/api/profile/family/accept-invite?code=${encodeURIComponent(inviteCode)}`);
    if (res.status === 404) { setPageState('not-found'); return; }
    if (res.status === 409) { setPageState('already-accepted'); return; }
    if (res.status === 410) { setPageState('expired'); return; }
    if (!res.ok) { setPageState('error'); return; }
    const data = (await res.json()) as InviteDetails;
    setInvite(data);
    setPageState('ready');
  }

  async function handleAccept(inviteCode: string) {
    if (status !== 'authenticated') {
      void signIn(undefined, { callbackUrl: `/family/accept-invite?code=${inviteCode}` });
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    const res = await fetch('/api/profile/family/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: inviteCode }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErrorMessage(data.error ?? 'Something went wrong. Please try again.');
      setSubmitting(false);
      return;
    }
    // Refresh the JWT so pendingFamilyInvite is cleared from session
    await update();
    setPageState('success');
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = manualCode.trim();
    if (!trimmed) return;
    await fetchInvite(trimmed);
  }

  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-primary-blue px-8 py-6">
          <h1 className="text-xl font-bold text-primary-saffron font-poppins">Family Account Linking</h1>
          <p className="text-sm text-white/80 mt-1">Ambedkarite Buddhist Community of Canada</p>
        </div>

        <div className="px-8 py-8">
          {pageState === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-text-dark">Accounts linked!</h2>
              <p className="text-sm text-text-medium">
                Your account is now linked to <strong>{invite?.ownerName ?? 'your family member'}</strong>'s family profile.
                You can view your shared family on your profile page.
              </p>
              <button
                onClick={() => router.push('/profile')}
                className="mt-2 w-full py-2.5 bg-primary-blue text-white rounded-xl font-bold text-sm hover:bg-primary-blue/90 transition-colors"
              >
                Go to my profile
              </button>
            </div>
          )}

          {pageState === 'already-accepted' && (
            <div className="text-center space-y-3">
              <p className="text-text-dark font-semibold">This invite has already been accepted.</p>
              <button onClick={() => router.push('/profile')} className="text-sm text-primary-blue underline">Go to profile</button>
            </div>
          )}

          {pageState === 'expired' && (
            <div className="text-center space-y-3">
              <p className="text-text-dark font-semibold">This invite link has expired.</p>
              <p className="text-sm text-text-medium">Please ask your family member to send a new invite from their profile page.</p>
            </div>
          )}

          {pageState === 'not-found' && (
            <div className="space-y-4">
              <p className="text-text-dark font-semibold">Invite code not found.</p>
              <p className="text-sm text-text-medium">Double-check the code from your invite email and try again.</p>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  placeholder="Paste your invite code here"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue"
                />
                <button type="submit" className="w-full py-2.5 bg-primary-blue text-white rounded-xl font-bold text-sm hover:bg-primary-blue/90 transition-colors">
                  Look up invite
                </button>
              </form>
            </div>
          )}

          {pageState === 'ready' && invite && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>{invite.ownerName}</strong> has added you as their <strong>{invite.relationship}</strong>.
                Linking accounts will give you shared access to your family profile, including any other members.
              </div>

              {errorMessage && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{errorMessage}</p>
              )}

              {status !== 'authenticated' ? (
                <div className="space-y-3">
                  <p className="text-sm text-text-medium">You need to be signed in to accept this invite.</p>
                  <button
                    onClick={() => signIn(undefined, { callbackUrl: `/family/accept-invite?code=${code}` })}
                    className="w-full py-2.5 bg-primary-blue text-white rounded-xl font-bold text-sm hover:bg-primary-blue/90 transition-colors"
                  >
                    Sign in to continue
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-text-medium">
                    Signed in as <strong>{session.user.email}</strong>. This will link your account.
                  </p>
                  <button
                    onClick={() => handleAccept(code)}
                    disabled={submitting}
                    className="w-full py-2.5 bg-primary-saffron text-text-dark rounded-xl font-bold text-sm hover:bg-primary-saffron/90 transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Linking…' : 'Accept & link my account'}
                  </button>
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full py-2 text-sm text-text-medium hover:text-text-dark transition-colors"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          )}

          {pageState === 'ready' && !invite && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <p className="text-sm text-text-medium">Enter the invite code from your email to link your account to a family member.</p>
              <input
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="Paste your invite code here"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue"
              />
              <button type="submit" className="w-full py-2.5 bg-primary-blue text-white rounded-xl font-bold text-sm hover:bg-primary-blue/90 transition-colors">
                Look up invite
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
