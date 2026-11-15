'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchOrgSettings } from '@/lib/org-settings-client';
import { checkMemberEmail, renderMemberEmail, unfilledBlanks } from '@/lib/member-email';
import { EmailHistory } from './email-history';
import { RecipientPicker } from './recipient-picker';
import { TemplatesManager } from './templates-manager';
import type { EmailableMember, EmailProgress, EmailTemplate, MemberEmailSummary } from './types';

interface EmailMembersPanelProps {
  /** Members from the dashboard; only active ones are offered */
  members: EmailableMember[];
  adminEmail: string;
}

type Notice = { ok: boolean; text: string } | null;

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Dashboard → Email Members: write (from a template), choose members, preview, test and send. */
export function EmailMembersPanel({ members, adminEmail }: EmailMembersPanelProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [history, setHistory] = useState<MemberEmailSummary[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [branding, setBranding] = useState({ orgName: 'Ambedkarite Buddhist Community of Canada', contactEmail: '' });
  const [confirming, setConfirming] = useState(false);
  const [progress, setProgress] = useState<EmailProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const activeMembers = useMemo(() => members.filter((m) => m.status === 'active'), [members]);
  const loadTemplates = useCallback(async () => {
    const res = await fetch('/api/admin/email-templates', { cache: 'no-store' });
    if (res.ok) setTemplates(((await res.json()) as { templates: EmailTemplate[] }).templates);
  }, []);
  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/admin/member-emails', { cache: 'no-store' });
    if (res.ok) setHistory(((await res.json()) as { emails: MemberEmailSummary[] }).emails);
  }, []);

  useEffect(() => {
    void loadTemplates();
    void loadHistory();
    fetchOrgSettings<{ orgName?: string; email?: string }>()
      .then(({ settings }) => settings && setBranding({ orgName: settings.orgName || 'Ambedkarite Buddhist Community of Canada', contactEmail: settings.email ?? '' }))
      .catch(() => {});
  }, [loadTemplates, loadHistory]);

  // Leaving mid-send stops it (it can be resumed from Sent emails)
  useEffect(() => {
    if (!progress || progress.pending === 0) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [progress]);

  const pickTemplate = (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return setTemplateId('');
    if ((subject.trim() || body.trim()) && !window.confirm('Replace the subject and message you have written with this template?')) return;
    setTemplateId(id);
    setSubject(template.subject);
    setBody(template.body);
  };

  const blanks = unfilledBlanks(`${subject}\n${body}`);
  const check = checkMemberEmail(subject, body);
  const previewMember = activeMembers.find((m) => selected.has(m.id)) ?? { name: 'Savitri Phule' };
  const preview = check.ok ? renderMemberEmail({ subject, body }, previewMember, branding) : null;

  /** Sends batch after batch until nothing is pending (or something goes wrong). */
  const runSend = async (emailId: string) => {
    setBusy(true);
    setNotice(null);
    let idle = 0;
    let last: EmailProgress | null = null;
    try {
      for (;;) {
        const res = await fetch(`/api/admin/member-emails/${emailId}/send`, { method: 'POST' });
        const data = (await res.json().catch(() => ({}))) as { progress?: EmailProgress; error?: string };
        if (!res.ok || !data.progress) {
          setNotice({ ok: false, text: `${data.error ?? 'Sending stopped.'} You can resume it from Sent emails.` });
          return;
        }
        const before = last;
        last = data.progress;
        setProgress(data.progress);
        if (data.progress.pending === 0) {
          const { sent, failed } = data.progress;
          setNotice(failed > 0
            ? { ok: false, text: `Sent to ${sent} members; ${failed} failed. You can retry them from Sent emails.` }
            : { ok: true, text: `Sent to all ${sent} members.` });
          return;
        }
        // Nothing moved (another window may be sending the rest): wait, then give up after a few tries
        idle = before && before.sent + before.failed === data.progress.sent + data.progress.failed ? idle + 1 : 0;
        if (idle >= 3) {
          setNotice({ ok: false, text: 'The rest is being sent from another window, or is stuck. Check Sent emails in a few minutes.' });
          return;
        }
        if (idle > 0) await sleep(3000);
      }
    } catch {
      setNotice({ ok: false, text: 'Lost connection while sending. You can resume it from Sent emails.' });
    } finally {
      setBusy(false);
      void loadHistory();
    }
  };

  const send = async () => {
    setConfirming(false);
    setBusy(true);
    const res = await fetch('/api/admin/member-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, templateId: templateId || null, userIds: [...selected] }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { id?: string; recipientCount?: number; error?: string } | undefined;
    if (!res?.ok || !data?.id) {
      setBusy(false);
      setNotice({ ok: false, text: data?.error ?? 'Could not start sending. Please try again.' });
      return;
    }
    setProgress({ total: data.recipientCount ?? selected.size, sent: 0, failed: 0, pending: data.recipientCount ?? selected.size });
    await runSend(data.id);
  };

  const sendTest = async () => {
    setBusy(true);
    setNotice(null);
    const res = await fetch('/api/admin/member-emails/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
    setBusy(false);
    setNotice(res?.ok ? { ok: true, text: `Test email sent to ${adminEmail}.` } : { ok: false, text: data?.error ?? 'Could not send the test email.' });
  };

  const retryFailed = async (email: MemberEmailSummary) => {
    const res = await fetch(`/api/admin/member-emails/${email.id}/retry`, { method: 'POST' }).catch(() => null);
    if (!res?.ok) return setNotice({ ok: false, text: 'Could not retry. Please try again.' });
    setProgress({ total: email.total, sent: email.sent, failed: 0, pending: email.pending + email.failed });
    await runSend(email.id);
  };

  const resume = async (email: MemberEmailSummary) => {
    setProgress({ total: email.total, sent: email.sent, failed: email.failed, pending: email.pending });
    await runSend(email.id);
  };

  const done = progress ? progress.sent + progress.failed : 0;

  return (
    <div className="space-y-6">
      <section aria-labelledby="compose-title" className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-6">
        <div>
          <h2 id="compose-title" className="text-lg font-semibold text-gray-900">Email members</h2>
          <p className="text-sm text-gray-600">Each member gets their own copy, sent from the Member announcements address in Settings → Email.</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-900">1. Write the email</h3>
          <div>
            <label htmlFor="compose-template" className="block text-sm font-medium text-gray-700 mb-1">Start from a template</label>
            <select id="compose-template" value={templateId} onChange={(e) => pickTemplate(e.target.value)} className={inputClass}>
              <option value="">— Blank email —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="compose-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input id="compose-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="compose-body" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea id="compose-body" rows={14} value={body} onChange={(e) => setBody(e.target.value)} className={`${inputClass} font-mono`} aria-describedby="compose-help" />
            <p id="compose-help" className="mt-1 text-xs text-gray-500">
              {'{{first_name}}'}, {'{{name}}'} and {'{{org_name}}'} are filled in for each member. Leave a blank line between paragraphs; web addresses become links.
            </p>
          </div>
          {blanks.length > 0 && (
            <p role="note" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Still to fill in: <strong>{blanks.join(', ')}</strong>
            </p>
          )}
          {!check.ok && (subject || body) && <p className="text-sm text-red-700">{check.error}</p>}
        </div>

        <RecipientPicker members={activeMembers} selected={selected} onChange={setSelected} />

        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-900">3. Preview and send</h3>
          {preview ? (
            <>
              <p className="text-sm text-gray-700">
                As {previewMember.name} will see it · <strong>Subject:</strong> {preview.subject}
              </p>
              <iframe title="Email preview" sandbox="" srcDoc={preview.html} className="w-full h-96 rounded-md border border-gray-200 bg-white" />
            </>
          ) : (
            <p className="text-sm text-gray-500">Write a subject and message to see a preview.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void sendTest()} disabled={!check.ok || busy} className="px-4 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Send test to me
            </button>
            <button type="button" onClick={() => setConfirming(true)} disabled={!check.ok || busy || selected.size === 0} className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
              Send to {selected.size} {selected.size === 1 ? 'member' : 'members'}
            </button>
          </div>

          {progress && (
            <div aria-live="polite" className="space-y-1">
              <div className="h-2 w-full rounded-full bg-gray-200" role="progressbar" aria-label="Sending" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={done}>
                <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${progress.total ? (done / progress.total) * 100 : 0}%` }} />
              </div>
              <p className="text-sm text-gray-700">
                {progress.pending > 0 && busy ? `Sending… ${done} of ${progress.total}. Please keep this page open.` : `${progress.sent} sent${progress.failed ? `, ${progress.failed} failed` : ''} of ${progress.total}.`}
              </p>
            </div>
          )}
          {notice && <p role={notice.ok ? 'status' : 'alert'} className={`text-sm ${notice.ok ? 'text-green-800' : 'text-red-700'}`}>{notice.text}</p>}
        </div>
      </section>

      <EmailHistory emails={history} sending={busy} onResume={(e) => void resume(e)} onRetryFailed={(e) => void retryFailed(e)} />
      <TemplatesManager templates={templates} onChanged={loadTemplates} />

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="confirm-send-title" className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="space-y-3 px-6 py-5">
              <h3 id="confirm-send-title" className="text-base font-semibold text-gray-900">Send to {selected.size} {selected.size === 1 ? 'member' : 'members'}?</h3>
              <p className="text-sm text-gray-700"><strong>Subject:</strong> {subject}</p>
              {blanks.length > 0 && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  The email still contains <strong>{blanks.join(', ')}</strong>. Fill these in before sending?
                </p>
              )}
              <p className="text-sm text-gray-600">This can’t be undone. Each member receives their own copy.</p>
            </div>
            <div className="flex justify-end gap-3 rounded-b-xl border-t bg-gray-50 px-6 py-4">
              <button type="button" onClick={() => setConfirming(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={() => void send()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Send now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
