'use client';

import { useState } from 'react';
import type { EmailTemplate } from './types';

interface TemplatesManagerProps {
  templates: EmailTemplate[];
  /** Reload templates after a change */
  onChanged: () => Promise<void>;
}

type Draft = { id: string | null; name: string; subject: string; body: string };

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

/** Add, edit and delete the reusable email templates. */
export function TemplatesManager({ templates, onChanged }: TemplatesManagerProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(draft.id ? `/api/admin/email-templates/${draft.id}` : '/api/admin/email-templates', {
        method: draft.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: draft.name, subject: draft.subject, body: draft.body }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? 'Could not save the template.' });
        return;
      }
      await onChanged();
      setMessage({ ok: true, text: `Template “${draft.name.trim()}” saved.` });
      setDraft(null);
    } catch {
      setMessage({ ok: false, text: 'Could not save the template. Please check your connection.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (template: EmailTemplate) => {
    if (!window.confirm(`Delete the template “${template.name}”? Emails already sent are not affected.`)) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/admin/email-templates/${template.id}`, { method: 'DELETE' }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setMessage({ ok: false, text: 'Could not delete the template.' });
      return;
    }
    await onChanged();
    setMessage({ ok: true, text: `Template “${template.name}” deleted.` });
  };

  return (
    <section aria-labelledby="templates-title" className="bg-white shadow rounded-lg p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="templates-title" className="text-lg font-semibold text-gray-900">Templates</h2>
        {!draft && (
          <button type="button" onClick={() => setDraft({ id: null, name: '', subject: '', body: '' })} className="px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700">
            + New template
          </button>
        )}
      </div>

      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={`text-sm ${message.ok ? 'text-green-800' : 'text-red-700'}`}>{message.text}</p>
      )}

      {draft && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">{draft.id ? 'Edit template' : 'New template'}</h3>
          <div>
            <label htmlFor="tpl-name" className="block text-sm font-medium text-gray-700 mb-1">Template name</label>
            <input id="tpl-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label htmlFor="tpl-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input id="tpl-subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label htmlFor="tpl-body" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea id="tpl-body" rows={12} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className={`${inputClass} font-mono`} />
            <p className="mt-1 text-xs text-gray-500">
              Use {'{{first_name}}'}, {'{{name}}'} and {'{{org_name}}'} to personalise. Put blanks to fill in later in capitals and brackets, like [DATE].
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void save()} disabled={busy} className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
              {busy ? 'Saving…' : 'Save template'}
            </button>
            <button type="button" onClick={() => setDraft(null)} disabled={busy} className="px-4 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-gray-100">
        {templates.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{t.name}</p>
              <p className="text-xs text-gray-500 truncate">Subject: {t.subject}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDraft({ id: t.id, name: t.name, subject: t.subject, body: t.body })} disabled={busy} className="px-3 py-1.5 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100">
                Edit<span className="sr-only"> {t.name}</span>
              </button>
              <button type="button" onClick={() => void remove(t)} disabled={busy} className="px-3 py-1.5 text-xs font-medium rounded bg-red-50 text-red-700 hover:bg-red-100">
                Delete<span className="sr-only"> {t.name}</span>
              </button>
            </div>
          </li>
        ))}
        {templates.length === 0 && <li className="py-6 text-center text-sm text-gray-500">No templates yet.</li>}
      </ul>
    </section>
  );
}
