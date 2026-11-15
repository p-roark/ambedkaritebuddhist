'use client';

import type { MemberEmailSummary } from './types';

interface EmailHistoryProps {
  emails: MemberEmailSummary[];
  /** An email is being sent right now (buttons are disabled meanwhile) */
  sending: boolean;
  onResume: (email: MemberEmailSummary) => void;
  onRetryFailed: (email: MemberEmailSummary) => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** Recent emails to members, with delivery counts and resume / retry actions. */
export function EmailHistory({ emails, sending, onResume, onRetryFailed }: EmailHistoryProps) {
  return (
    <section aria-labelledby="history-title" className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-3">
      <h2 id="history-title" className="text-lg font-semibold text-gray-900">Sent emails</h2>
      {emails.length === 0 ? (
        <p className="text-sm text-gray-500">No emails sent to members yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {emails.map((e) => (
            <li key={e.id} className="py-3 space-y-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 break-words">{e.subject}</p>
                  <p className="text-xs text-gray-500">{formatDate(e.createdAt)} · by {e.sentBy}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {e.pending > 0 && (
                    <button type="button" disabled={sending} onClick={() => onResume(e)} className="px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                      Resume sending ({e.pending} left)
                    </button>
                  )}
                  {e.failed > 0 && (
                    <button type="button" disabled={sending} onClick={() => onRetryFailed(e)} className="px-3 py-1.5 text-xs font-medium rounded bg-amber-100 text-amber-900 hover:bg-amber-200 disabled:opacity-50">
                      Retry {e.failed} failed
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-700">
                <span className="text-green-800 font-medium">{e.sent} delivered</span>
                {e.failed > 0 && <span className="text-red-700 font-medium"> · {e.failed} failed</span>}
                {e.pending > 0 && <span className="text-amber-800 font-medium"> · {e.pending} not sent yet</span>}
                <span className="text-gray-500"> · {e.total} recipients</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
