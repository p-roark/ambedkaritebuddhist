'use client';

import { useEffect, useRef, useState } from 'react';
import { PROVINCE_OPTIONS, RESIDENCY_STATUS_OPTIONS } from '@/lib/registration-config';

type MemberDetails = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  altPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  residencyStatus: string | null;
  education: string | null;
  interests: string | null;
  notes: string | null;
  role: string;
  status: string;
  referredBy: string | null;
  registrationCompletedAt: string | null;
  disclaimerAcceptedAt: string | null;
  disclaimerVersion: string | null;
  ageConfirmedAt: string | null;
  boardInterest: boolean;
  createdAt: string;
  updatedAt: string;
};

type EditableField =
  | 'name' | 'phone' | 'altPhone' | 'addressLine1' | 'addressLine2' | 'city' | 'province'
  | 'postalCode' | 'residencyStatus' | 'education' | 'interests' | 'notes';

interface MemberDetailsDialogProps {
  memberId: string;
  onClose: () => void;
  /** Called after a successful save so the member list can refresh */
  onSaved?: () => void;
}

const FIELDS: Array<{ key: EditableField; label: string; type?: 'select-province' | 'select-residency' | 'textarea'; wide?: boolean }> = [
  { key: 'name', label: 'Full name' },
  { key: 'phone', label: 'Phone' },
  { key: 'altPhone', label: 'Alternate phone' },
  { key: 'residencyStatus', label: 'Residency status', type: 'select-residency' },
  { key: 'addressLine1', label: 'Street address', wide: true },
  { key: 'addressLine2', label: 'Apartment, unit, etc.', wide: true },
  { key: 'city', label: 'City' },
  { key: 'province', label: 'Province / territory', type: 'select-province' },
  { key: 'postalCode', label: 'Postal code' },
  { key: 'education', label: 'Education' },
  { key: 'interests', label: 'Interests', wide: true },
  { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
];

const RESIDENCY_LABELS = new Map<string, string>(RESIDENCY_STATUS_OPTIONS.map((o) => [o.value, o.label]));
const PROVINCE_LABELS = new Map<string, string>(PROVINCE_OPTIONS.map((o) => [o.value, o.label]));

function displayValue(key: EditableField, value: string | null) {
  if (!value) return '—';
  if (key === 'residencyStatus') return RESIDENCY_LABELS.get(value) ?? value;
  if (key === 'province') return PROVINCE_LABELS.get(value) ?? value;
  return value;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
}

const inputClass = 'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export function MemberDetailsDialog({ memberId, onClose, onSaved }: MemberDetailsDialogProps) {
  const [member, setMember] = useState<MemberDetails | null>(null);
  const [draft, setDraft] = useState<Record<EditableField, string>>({} as Record<EditableField, string>);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<EditableField, string>>>({});
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    fetch(`/api/admin/members/${encodeURIComponent(memberId)}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('load failed');
        setMember(((await res.json()) as { member: MemberDetails }).member);
      })
      .catch(() => setError('Could not load this member. Please try again.'));
  }, [memberId]);

  const startEdit = () => {
    if (!member) return;
    setDraft(Object.fromEntries(FIELDS.map((f) => [f.key, member[f.key] ?? ''])) as Record<EditableField, string>);
    setFieldErrors({});
    setError('');
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/members/${encodeURIComponent(memberId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as { member?: MemberDetails; error?: string; fieldErrors?: Partial<Record<EditableField, string>> };
      if (!res.ok || !data.member) {
        setFieldErrors(data.fieldErrors ?? {});
        setError(data.error ?? 'Could not save changes.');
        return;
      }
      setMember(data.member);
      setEditing(false);
      onSaved?.();
    } catch {
      setError('Could not save changes. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (field: (typeof FIELDS)[number]) => {
    const common = {
      id: `member-${field.key}`,
      value: draft[field.key] ?? '',
      'aria-invalid': fieldErrors[field.key] ? true : undefined,
      'aria-describedby': fieldErrors[field.key] ? `member-${field.key}-error` : undefined,
      className: `${inputClass} ${fieldErrors[field.key] ? 'border-red-500' : 'border-gray-300'}`,
    };
    const onChange = (value: string) => setDraft((prev) => ({ ...prev, [field.key]: value }));
    if (field.type === 'textarea') return <textarea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />;
    if (field.type === 'select-province' || field.type === 'select-residency') {
      const options = field.type === 'select-province' ? PROVINCE_OPTIONS : RESIDENCY_STATUS_OPTIONS;
      return (
        <select {...common} className={`${common.className} bg-white`} onChange={(e) => onChange(e.target.value)}>
          <option value="">Not set</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    return <input {...common} onChange={(e) => onChange(e.target.value)} />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-details-title"
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-start justify-between gap-4">
          <div>
            <h2 id="member-details-title" className="text-lg font-semibold text-gray-900">{member?.name ?? 'Member details'}</h2>
            {member && <p className="text-sm text-gray-600">{member.email}</p>}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-gray-800 text-xl leading-none px-2">
            ×
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {error && <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
          {!member && !error && <p className="text-sm text-gray-500">Loading…</p>}

          {member && (
            <>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {[
                  ['Role', member.role],
                  ['Account status', member.status],
                  ['Registration', member.registrationCompletedAt ? `Completed ${formatDate(member.registrationCompletedAt)}` : 'Pending'],
                  ['Consent', member.disclaimerAcceptedAt ? `${formatDate(member.disclaimerAcceptedAt)} (${member.disclaimerVersion ?? '—'})` : 'Not given'],
                  ['18 or older', member.ageConfirmedAt ? `Confirmed ${formatDate(member.ageConfirmedAt)}` : 'Not confirmed'],
                  ['Board / committee interest', member.boardInterest ? 'Yes' : 'No'],
                  ['Invite code', member.referredBy ?? '—'],
                  ['Joined', formatDate(member.createdAt)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
                    <dd className="text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-5">
                {FIELDS.map((field) => (
                  <div key={field.key} className={field.wide ? 'sm:col-span-2' : undefined}>
                    {editing ? (
                      <>
                        <label htmlFor={`member-${field.key}`} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                        {renderInput(field)}
                        {fieldErrors[field.key] && (
                          <p id={`member-${field.key}-error`} className="mt-1 text-sm text-red-700">{fieldErrors[field.key]}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</p>
                        <p className="text-sm text-gray-900 whitespace-pre-line">{displayValue(field.key, member[field.key])}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {editing && !member.registrationCompletedAt && (
                <p className="text-xs text-gray-500">This member hasn&apos;t completed registration, so fields can be left blank.</p>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)} disabled={saving} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={() => void save()} disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </>
          ) : (
            <button type="button" onClick={startEdit} disabled={!member} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              Edit details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
