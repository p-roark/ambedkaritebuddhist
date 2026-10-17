'use client';

import { useState } from 'react';
import type { EmailTestResult } from '@/lib/email';

const STAGE_LABELS: Record<string, string> = {
  config: 'Setup',
  key: 'Private key',
  token: 'Google sign-in',
  send: 'Sending',
};

interface EmailTestPanelProps {
  adminEmail: string;
}

export function EmailTestPanel({ adminEmail }: EmailTestPanelProps) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<EmailTestResult | null>(null);
  const [requestError, setRequestError] = useState('');

  const sendTest = async () => {
    setSending(true);
    setResult(null);
    setRequestError('');
    try {
      const res = await fetch('/api/admin/email-test', { method: 'POST' });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setResult((await res.json()) as EmailTestResult);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <section aria-labelledby="email-test-title" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 id="email-test-title" className="text-lg font-semibold text-gray-900">Email delivery</h3>
          <p className="text-sm text-gray-600 mt-1">
            Send a test email to <strong>{adminEmail}</strong> to check that the website can send email through Google
            Workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void sendTest()}
          disabled={sending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send test email'}
        </button>
      </div>

      <div aria-live="polite">
        {result?.ok && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            <p className="font-semibold">✓ Google accepted the email.</p>
            <p className="mt-1">
              Sent from {result.from} to {result.to}. Check that inbox (and the spam folder) — it should arrive within a
              minute.
            </p>
          </div>
        )}

        {result && !result.ok && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 space-y-2">
            <p className="font-semibold">✗ Failed at: {STAGE_LABELS[result.stage] ?? result.stage}</p>
            <p className="break-words">{result.message}</p>
            <p>
              <span className="font-semibold">What to do: </span>
              {result.hint}
            </p>
            {result.from && <p className="text-xs text-red-800">Sender address used: {result.from}</p>}
          </div>
        )}

        {requestError && (
          <p role="alert" className="text-sm text-red-800">
            Could not run the test: {requestError}
          </p>
        )}
      </div>
    </section>
  );
}
