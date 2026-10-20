'use client';

import { Suspense, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmailSignInForm } from '@/components/auth/email-sign-in-form';
import { safeCallbackUrl } from '@/lib/registration';
import { useFeature } from '@/lib/use-feature';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginCard />
    </Suspense>
  );
}

// Auth.js error codes (?error=…) → what the visitor should read
function signInErrorMessage(code: string | null): string | null {
  if (!code) return null;
  if (code === 'CredentialsSignin') return 'This sign-in link has expired or was already used. Please request a new one.';
  if (code === 'AccessDenied') return 'This Google account can’t be used to sign in. Please try a different account.';
  if (code === 'OAuthCallbackError' || code === 'Configuration' || code === 'OAuthSignin' || code === 'Callback') {
    return 'Sign-in was cancelled or didn’t finish. Please try again.';
  }
  return 'Something went wrong while signing in. Please try again, and contact us if it keeps happening.';
}

function LoginCard() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'));
  const errorMessage = signInErrorMessage(searchParams.get('error'));
  // Arrived from an invite link (/join?code=…): they're accepting an invitation
  const isInvite = callbackUrl === '/join' || callbackUrl.startsWith('/join?') || callbackUrl.startsWith('/join/');
  const emailSignIn = useFeature('emailSignIn') === true;
  const { status } = useSession();
  const router = useRouter();

  // Already signed in — including in another tab, e.g. from an emailed sign-in
  // link — so there's nothing to do here: continue to where they were going
  useEffect(() => {
    if (status === 'authenticated') router.replace(callbackUrl);
  }, [status, callbackUrl, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #2D4D9B 0%, #7F56D9 55%, #FF6B35 100%)' }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5" />

      <div className="max-w-md w-full relative z-10">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          {/* Brand header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src="/images/logo.png" alt="ABCC logo" className="w-16 h-16 rounded-none object-contain shadow-md" />
            </div>
            <h1 className="text-3xl font-bold text-text-dark font-poppins mb-2">
              {isInvite ? 'Sign in to accept your invitation' : 'Members sign in'}
            </h1>
            <p className="text-text-medium text-base">
              {isInvite
                ? `Use the ${emailSignIn ? 'Google account or email address' : 'Google account'} you would like to register with. You will then complete a short registration form.`
                : emailSignIn
                  ? 'Sign in with Google or with a link sent to your email.'
                  : 'Sign in with your Google account to access the community.'}
            </p>
          </div>

          {errorMessage && (
            <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorMessage}
            </div>
          )}

          {!isInvite && (
            <div role="note" className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span aria-hidden="true" className="text-lg leading-5">🪷</span>
              <p>
                <strong>Not a member yet?</strong> Membership is by invitation. Please use the invite link you received
                to register.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-slate-200 rounded-2xl text-text-dark font-semibold hover:border-primary-blue hover:bg-blue-50 transition-all"
            >
              <svg aria-hidden="true" className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          {emailSignIn && (
            <>
              <div className="my-6 flex items-center gap-3 text-sm text-text-medium" aria-hidden="true">
                <span className="h-px flex-1 bg-slate-200" />
                or
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <EmailSignInForm callbackUrl={callbackUrl} />
            </>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-text-medium">
              Questions?{' '}
              <Link href="/contact" className="text-primary-blue font-semibold hover:text-primary-saffron transition-colors">
                Contact us
              </Link>
            </p>
          </div>
        </div>

        {/* Tagline below card */}
        <p className="text-center text-white/70 text-sm mt-6">
          ☸️ Ambedkarite Buddhist Community Canada
        </p>
      </div>
    </div>
  );
}
