'use client';

import { useState } from 'react';

interface EmailSignInFormProps {
  callbackUrl: string;
}

export function EmailSignInForm({ callbackUrl }: EmailSignInFormProps) {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/sign-in-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, callbackUrl }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Could not send a sign-in link. Please try again.');
        return;
      }
      setSentTo(email.trim());
    } catch {
      setError('Could not send a sign-in link. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <div role="status" className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 space-y-2">
        <p className="font-semibold">Check your email</p>
        <p>
          If <strong className="break-all">{sentTo}</strong>{' '}
          belongs to a member (or you came from an invite link), a sign-in link is on its way. It works once and expires in 15 minutes. Check your spam folder if it doesn&apos;t arrive.
        </p>
        <button type="button" onClick={() => setSentTo(null)} className="font-semibold text-primary-blue underline">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <label htmlFor="sign-in-email" className="block text-sm font-semibold text-text-dark">
        Email address
      </label>
      <input
        id="sign-in-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'sign-in-email-error' : undefined}
        className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:border-primary-blue"
      />
      {error && (
        <p id="sign-in-email-error" role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={sending || !email.trim()}
        className="w-full py-3.5 px-4 rounded-2xl bg-primary-blue text-white font-semibold hover:bg-primary-blue/90 disabled:opacity-60 transition-colors"
      >
        {sending ? 'Sending…' : 'Email me a sign-in link'}
      </button>
    </form>
  );
}
