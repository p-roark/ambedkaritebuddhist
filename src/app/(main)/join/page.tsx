'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmailSignInForm } from '@/components/auth/email-sign-in-form';
import { RegistrationForm, type RegistrationFormValues } from '@/components/auth/registration-form';
import { clearPendingInviteCode, readPendingInviteCode, savePendingInviteCode } from '@/lib/pending-invite';
import { normalizeInviteCode, type RegistrationStatus } from '@/lib/registration';
import { useFeature } from '@/lib/use-feature';

type ViewState =
  | { kind: 'loading' }
  | { kind: 'no-invite' }
  | { kind: 'invalid-invite'; reason: string }
  | { kind: 'sign-in' }
  | { kind: 'form'; prefill: RegistrationFormValues; isExistingMember: boolean }
  | { kind: 'done' }
  | { kind: 'error' };

const INVALID_INVITE_MESSAGES: Record<string, string> = {
  paused: 'New member registration is paused at the moment. Please try your invite link again later, or contact us.',
  invalid: 'This invite link is not valid. Please check that you opened the full link you received.',
  inactive: 'This invite link has been disabled.',
  exhausted: 'This invite link has already been used the maximum number of times.',
};

async function checkInvite(code: string): Promise<{ valid: boolean; reason?: string }> {
  const res = await fetch(`/api/registration/validate?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to validate invite');
  return (await res.json()) as { valid: boolean; reason?: string };
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinFlow />
    </Suspense>
  );
}

function JoinFlow() {
  const { status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = normalizeInviteCode(searchParams.get('code'));
  const inviteCallbackUrl = `/join?code=${encodeURIComponent(code ?? '')}`;
  const emailSignIn = useFeature('emailSignIn') === true;
  const [view, setView] = useState<ViewState>({ kind: 'loading' });
  // Refreshing the session after submit briefly changes `status`; don't re-resolve then
  const completedRef = useRef(false);

  useEffect(() => {
    if (status === 'loading' || completedRef.current) return;
    let alive = true;

    const resolveView = async (): Promise<ViewState> => {
      if (code) savePendingInviteCode(code);

      let registrationStatus: RegistrationStatus = 'invite_required';
      let prefill: RegistrationFormValues | null = null;

      if (status === 'authenticated') {
        const res = await fetch('/api/registration', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load registration');
        const data = (await res.json()) as { registrationStatus: RegistrationStatus; prefill: RegistrationFormValues };
        registrationStatus = data.registrationStatus;
        prefill = data.prefill;

        if (registrationStatus === 'complete') {
          clearPendingInviteCode();
          router.replace('/');
          return { kind: 'loading' };
        }
        if (registrationStatus === 'profile_required') {
          return { kind: 'form', prefill, isExistingMember: true };
        }
      }

      // New member: an invite code is required
      if (!code) return { kind: 'no-invite' };
      const invite = await checkInvite(code);
      if (!invite.valid) {
        // Keep the code while registration is only paused, so the link still works later
        if (invite.reason !== 'paused') clearPendingInviteCode();
        return { kind: 'invalid-invite', reason: invite.reason ?? 'invalid' };
      }
      if (status !== 'authenticated' || !prefill) return { kind: 'sign-in' };
      return { kind: 'form', prefill, isExistingMember: false };
    };

    resolveView()
      .then((next) => alive && setView(next))
      .catch(() => alive && setView({ kind: 'error' }));
    return () => {
      alive = false;
    };
  }, [status, code, router]);

  const handleSuccess = async () => {
    completedRef.current = true;
    clearPendingInviteCode();
    await update();
    setView({ kind: 'done' });
  };

  const fallbackCode = code ?? readPendingInviteCode();

  return (
    <div className="min-h-screen bg-background-light">
      <div
        className="py-10 md:py-14"
        style={{ background: 'linear-gradient(135deg, #2D4D9B 0%, #7F56D9 55%, #FF6B35 100%)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white font-poppins">Member Registration</h1>
          <p className="text-base text-white/90 mt-1">Ambedkarite Buddhist Community of Canada ☸️</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-background-gray shadow-sm p-6 md:p-8" aria-live="polite">
          {view.kind === 'loading' && (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-blue" role="status" aria-label="Loading" />
            </div>
          )}

          {view.kind === 'sign-in' && (
            <div className="text-center space-y-5 py-4">
              <h2 className="text-xl font-bold text-text-dark">You&apos;re invited to join our community 🪷</h2>
              <p className="text-base text-text-medium">
                {emailSignIn
                  ? 'Sign in with Google or with a link sent to your email to continue.'
                  : 'Sign in securely with your Google account to continue.'}{' '}
                You&apos;ll then complete a short registration form.
              </p>
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: inviteCallbackUrl })}
                className="inline-flex items-center justify-center gap-3 py-3 px-6 border-2 border-slate-200 rounded-2xl text-text-dark font-semibold hover:border-primary-blue hover:bg-blue-50 transition-all"
              >
                Continue with Google
              </button>
              {emailSignIn && (
                <div className="mx-auto max-w-sm text-left">
                  <div className="my-5 flex items-center gap-3 text-sm text-text-medium" aria-hidden="true">
                    <span className="h-px flex-1 bg-slate-200" />
                    or
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                  <EmailSignInForm callbackUrl={inviteCallbackUrl} />
                </div>
              )}
            </div>
          )}

          {view.kind === 'form' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-text-dark">Complete your registration</h2>
                <p className="text-base text-text-medium mt-1">
                  {view.isExistingMember
                    ? 'We have updated our membership records. Please confirm your details and give your consent to continue.'
                    : 'Please fill in your details below. Your registration is complete once this form is submitted.'}
                </p>
              </div>
              <RegistrationForm initialValues={view.prefill} inviteCode={view.isExistingMember ? null : code} onSuccess={handleSuccess} />
              <p className="text-sm text-text-medium">
                Not {view.prefill.email}?{' '}
                <button type="button" onClick={() => signOut({ callbackUrl: fallbackCode ? `/join?code=${encodeURIComponent(fallbackCode)}` : '/' })} className="text-primary-blue font-semibold underline">
                  Sign out
                </button>
              </p>
            </div>
          )}

          {view.kind === 'done' && (
            <div className="text-center space-y-4 py-4">
              <h2 className="text-xl font-bold text-text-dark">Welcome to the community! 🪷</h2>
              <p className="text-base text-text-medium">Your registration is complete. Jai Bhim!</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/events" className="px-6 py-2.5 rounded-xl bg-primary-blue text-white font-bold hover:bg-primary-blue/90">See upcoming events</Link>
                <Link href="/profile" className="px-6 py-2.5 rounded-xl border-2 border-slate-200 text-text-dark font-semibold hover:border-primary-blue">View your profile</Link>
              </div>
            </div>
          )}

          {(view.kind === 'no-invite' || view.kind === 'invalid-invite' || view.kind === 'error') && (
            <div className="space-y-4 py-2">
              <h2 className="text-xl font-bold text-text-dark">
                {view.kind === 'error'
                  ? 'Something went wrong'
                  : view.kind === 'invalid-invite' && view.reason === 'paused'
                    ? 'Registration is paused'
                    : 'An invite link is required'}
              </h2>
              <p className="text-base text-text-medium">
                {view.kind === 'invalid-invite' && (INVALID_INVITE_MESSAGES[view.reason] ?? INVALID_INVITE_MESSAGES.invalid)}
                {view.kind === 'no-invite' && 'Membership registration is by invitation. Please open the invite link you received from the community.'}
                {view.kind === 'error' && 'We could not load the registration page. Please refresh and try again.'}
              </p>
              <p className="text-base text-text-medium">
                Need help?{' '}
                <Link href="/contact" className="text-primary-blue font-semibold underline">Contact us</Link>
              </p>
              {status === 'authenticated' && (
                <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
