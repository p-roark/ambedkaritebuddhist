'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { safeCallbackUrl } from '@/lib/registration';

export default function EmailLinkPage() {
  return (
    <Suspense>
      <EmailLinkCard />
    </Suspense>
  );
}

// Opened from the emailed sign-in link. Signing in needs a button press, so
// email security scanners that open links can't use up the one-time link.
function EmailLinkCard() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'));
  const [signingIn, setSigningIn] = useState(false);

  const valid = Boolean(email && token);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #2D4D9B 0%, #7F56D9 55%, #FF6B35 100%)' }}
    >
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 md:p-10 text-center space-y-5">
        <img src="/images/logo.png" alt="ABCC logo" className="w-16 h-16 mx-auto object-contain" />
        {valid ? (
          <>
            <h1 className="text-2xl font-bold text-text-dark font-poppins">Sign in</h1>
            <p className="text-base text-text-medium">
              Continue as <strong className="text-text-dark break-all">{email}</strong>
            </p>
            <button
              type="button"
              disabled={signingIn}
              onClick={() => {
                setSigningIn(true);
                void signIn('email-link', { email, token, callbackUrl });
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-primary-blue text-white font-semibold hover:bg-primary-blue/90 disabled:opacity-60 transition-colors"
            >
              {signingIn ? 'Signing in…' : 'Sign in'}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-text-dark font-poppins">This link is incomplete</h1>
            <p className="text-base text-text-medium">Please open the link from your email again, or request a new one.</p>
            <Link href="/auth/login" className="inline-block font-semibold text-primary-blue underline">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
