'use client';

import { useEffect, useState } from 'react';
import type { EmailTestResult } from '@/lib/email';
import type { EmailPurpose } from '@/lib/email-senders';

const STAGE_LABELS: Record<string, string> = {
  config: 'Setup',
  key: 'Private key',
  token: 'Google sign-in',
  send: 'Sending',
};

type SenderRow = {
  purpose: EmailPurpose;
  label: string;
  description: string;
  address: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
};

type SendersResponse = { defaultAddress: string | null; senders: SenderRow[] };

const DEFAULT_KEY = 'default';
type TargetKey = EmailPurpose | typeof DEFAULT_KEY;

interface EmailTestPanelProps {
  adminEmail: string;
}

function TestResult({ result }: { result: EmailTestResult }) {
  if (result.ok) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
        <p className="font-semibold">✓ Google accepted the email.</p>
        <p className="mt-1">Sent from {result.from} to {result.to}. Check that inbox (and spam) — it should arrive within a minute.</p>
      </div>
    );
  }
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 space-y-2">
      <p className="font-semibold">✗ Failed at: {STAGE_LABELS[result.stage] ?? result.stage}</p>
      <p className="break-words">{result.message}</p>
      <p><span className="font-semibold">What to do: </span>{result.hint}</p>
      {result.from && <p className="text-xs text-red-800">Sender address used: {result.from}</p>}
    </div>
  );
}

export function EmailTestPanel({ adminEmail }: EmailTestPanelProps) {
  const [data, setData] = useState<SendersResponse | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<EmailPurpose, string>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Partial<Record<TargetKey, EmailTestResult>>>({});
  const [messages, setMessages] = useState<Partial<Record<TargetKey, string>>>({});

  const applyData = (next: SendersResponse) => {
    setData(next);
    setDrafts(Object.fromEntries(next.senders.map((s) => [s.purpose, s.address ?? ''])));
  };

  useEffect(() => {
    fetch('/api/admin/email-senders', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        applyData((await res.json()) as SendersResponse);
      })
      .catch(() => setMessages({ [DEFAULT_KEY]: 'Could not load email settings. Please refresh the page.' }));
  }, []);

  const sendTest = async (key: TargetKey) => {
    setBusy(`test-${key}`);
    setResults((prev) => ({ ...prev, [key]: undefined }));
    setMessages((prev) => ({ ...prev, [key]: undefined }));
    try {
      const res = await fetch('/api/admin/email-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(key === DEFAULT_KEY ? {} : { purpose: key }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const result = (await res.json()) as EmailTestResult;
      setResults((prev) => ({ ...prev, [key]: result }));
    } catch (error) {
      setMessages((prev) => ({ ...prev, [key]: `Could not run the test: ${error instanceof Error ? error.message : 'request failed'}` }));
    } finally {
      setBusy(null);
    }
  };

  const save = async (purpose: EmailPurpose) => {
    setBusy(`save-${purpose}`);
    setMessages((prev) => ({ ...prev, [purpose]: undefined }));
    try {
      const res = await fetch('/api/admin/email-senders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose, address: drafts[purpose] ?? '' }),
      });
      const body = (await res.json()) as SendersResponse & { error?: string };
      if (!res.ok) {
        setMessages((prev) => ({ ...prev, [purpose]: body.error ?? 'Could not save.' }));
        return;
      }
      applyData(body);
      setMessages((prev) => ({ ...prev, [purpose]: 'Saved.' }));
    } catch {
      setMessages((prev) => ({ ...prev, [purpose]: 'Could not save. Please try again.' }));
    } finally {
      setBusy(null);
    }
  };

  const defaultAddress = data?.defaultAddress ?? 'the organization email';

  return (
    <section aria-labelledby="email-settings-title" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      <div>
        <h3 id="email-settings-title" className="text-lg font-semibold text-gray-900">Email</h3>
        <p className="text-sm text-gray-600 mt-1">
          The website sends email through Google Workspace. Test emails go to <strong>{adminEmail}</strong>. Every sender
          address must be a real Workspace mailbox (not a group or alias).
        </p>
      </div>

      {/* Default sender */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Default sender</p>
            <p className="text-sm text-gray-600">
              {data?.defaultAddress ?? '…'} <span className="text-gray-500">— the organization email (edit it in Organization Settings below)</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => void sendTest(DEFAULT_KEY)}
            disabled={busy !== null}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {busy === `test-${DEFAULT_KEY}` ? 'Sending…' : 'Send test email'}
          </button>
        </div>
        <div aria-live="polite">
          {results[DEFAULT_KEY] && <TestResult result={results[DEFAULT_KEY]} />}
          {messages[DEFAULT_KEY] && <p role="alert" className="text-sm text-red-800">{messages[DEFAULT_KEY]}</p>}
        </div>
      </div>

      {/* Per-purpose senders */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">Sender per purpose</p>
        <p className="text-sm text-gray-600 -mt-2">Leave blank to send from the default sender.</p>
        {data?.senders.map((row) => {
          const inputId = `sender-${row.purpose}`;
          const effective = row.address ?? defaultAddress;
          return (
            <div key={row.purpose} className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div>
                <label htmlFor={inputId} className="text-sm font-semibold text-gray-900">{row.label}</label>
                <p id={`${inputId}-desc`} className="text-sm text-gray-600">{row.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id={inputId}
                  type="email"
                  value={drafts[row.purpose] ?? ''}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [row.purpose]: e.target.value }))}
                  placeholder={`Uses ${defaultAddress}`}
                  aria-describedby={`${inputId}-desc`}
                  className="flex-1 min-w-[16rem] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => void save(row.purpose)}
                  disabled={busy !== null || (drafts[row.purpose] ?? '') === (row.address ?? '')}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {busy === `save-${row.purpose}` ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => void sendTest(row.purpose)}
                  disabled={busy !== null}
                  aria-label={`Send test email for ${row.label}`}
                  className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50"
                >
                  {busy === `test-${row.purpose}` ? 'Sending…' : 'Test'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Sends from {effective}
                {row.updatedBy && row.updatedAt ? ` · last changed by ${row.updatedBy} on ${new Date(row.updatedAt).toLocaleDateString('en-CA')}` : ''}
              </p>
              <div aria-live="polite">
                {results[row.purpose] && <TestResult result={results[row.purpose]!} />}
                {messages[row.purpose] && (
                  <p role={messages[row.purpose] === 'Saved.' ? 'status' : 'alert'} className={`text-sm ${messages[row.purpose] === 'Saved.' ? 'text-green-800' : 'text-red-800'}`}>
                    {messages[row.purpose]}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
