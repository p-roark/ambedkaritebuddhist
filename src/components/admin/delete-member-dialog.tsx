'use client';

import { useState } from 'react';

interface DeleteMemberDialogProps {
  member: { id: string; name: string; email: string };
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteMemberDialog({ member, onClose, onDeleted }: DeleteMemberDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirmed = confirmText.trim().toLowerCase() === member.email.toLowerCase();

  const handleDelete = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/members/${encodeURIComponent(member.id)}`, { method: 'DELETE' });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? 'Could not delete this member.');
        return;
      }
      onDeleted();
    } catch {
      setError('Could not delete this member. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="delete-member-title" className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 space-y-3">
          <h3 id="delete-member-title" className="text-base font-semibold text-gray-900">Permanently delete {member.name}?</h3>
          <p className="text-sm text-gray-600">
            This deletes the member&apos;s account and everything linked to it: profile details, family members and event
            registrations. It cannot be undone. Invite codes they created move to you; their messages are kept.
          </p>
          <p className="text-sm text-gray-600">
            If they sign in again later, they will need a new invite link to register.
          </p>
          <div>
            <label htmlFor="delete-member-confirm" className="block text-sm font-medium text-gray-900">
              Type <span className="font-mono">{member.email}</span> to confirm
            </label>
            <input
              id="delete-member-confirm"
              type="text"
              autoComplete="off"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={!confirmed || busy}
            className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 disabled:opacity-50"
          >
            {busy ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
