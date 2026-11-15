'use client';

import { useMemo, useState } from 'react';
import type { EmailableMember } from './types';

type Filter = 'all' | 'registered' | 'board';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All active members' },
  { id: 'registered', label: 'Registered only' },
  { id: 'board', label: 'Interested in board/committee' },
];

interface RecipientPickerProps {
  /** Active members (inactive ones can't be emailed) */
  members: EmailableMember[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
}

export function RecipientPicker({ members, selected, onChange }: RecipientPickerProps) {
  const [filter, setFilter] = useState<Filter>('registered');
  const [search, setSearch] = useState('');

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => filter === 'all' || (filter === 'registered' ? Boolean(m.registrationCompletedAt) : Boolean(m.boardInterest)))
      .filter((m) => !q || [m.name, m.email, m.city ?? ''].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, filter, search]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };
  const selectShown = () => onChange(new Set([...selected, ...shown.map((m) => m.id)]));
  const clearAll = () => onChange(new Set());

  return (
    <section aria-labelledby="recipients-title" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="recipients-title" className="text-base font-semibold text-gray-900">2. Choose recipients</h3>
        <p className="text-sm text-gray-700" aria-live="polite">
          <strong>{selected.size}</strong> of {members.length} selected
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border ${filter === f.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="recipient-search" className="sr-only">Search members</label>
        <input
          id="recipient-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or city"
          className="flex-1 min-w-[12rem] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="button" onClick={selectShown} disabled={shown.length === 0} className="px-3 py-2 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50">
          Select all shown ({shown.length})
        </button>
        <button type="button" onClick={clearAll} disabled={selected.size === 0} className="px-3 py-2 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50">
          Clear
        </button>
      </div>

      <ul className="max-h-72 overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100 bg-white">
        {shown.map((m) => (
          <li key={m.id}>
            <label className="flex items-start gap-3 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-400" />
              <span className="min-w-0">
                <span className="font-medium text-gray-900">{m.name}</span>
                <span className="block text-xs text-gray-500 break-all">
                  {m.email}
                  {m.city ? ` · ${m.city}` : ''}
                  {!m.registrationCompletedAt ? ' · registration pending' : ''}
                </span>
              </span>
            </label>
          </li>
        ))}
        {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-gray-500">No members match.</li>}
      </ul>
    </section>
  );
}
