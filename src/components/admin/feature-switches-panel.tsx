'use client';

import { useEffect, useState } from 'react';
import { FEATURE_PAGES, type FeatureKey, type FeaturePage } from '@/lib/feature-flags';
import { resetFeatureFlags } from '@/lib/use-feature';

type FeatureRow = {
  key: FeatureKey;
  label: string;
  page: FeaturePage;
  description: string;
  defaultEnabled: boolean;
  enabled: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
};

function formatChange(row: FeatureRow) {
  if (!row.updatedAt) return `Default (${row.defaultEnabled ? 'on' : 'off'}) — never changed`;
  const when = new Date(row.updatedAt).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
  return `Last changed by ${row.updatedBy ?? 'unknown'} on ${when}`;
}

export function FeatureSwitchesPanel() {
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<FeatureKey | null>(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    const res = await fetch('/api/admin/features', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load features');
    const data = (await res.json()) as { features: FeatureRow[] };
    setFeatures(data.features);
  };

  useEffect(() => {
    load()
      .catch(() => setMessage('Could not load feature switches. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (row: FeatureRow) => {
    const enabled = !row.enabled;
    setSavingKey(row.key);
    setMessage('');
    try {
      const res = await fetch('/api/admin/features', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: row.key, enabled }),
      });
      if (!res.ok) throw new Error('Failed to save');
      await load();
      resetFeatureFlags();
      setMessage(`${row.label} turned ${enabled ? 'on' : 'off'}. It can take up to a minute to apply for all visitors.`);
    } catch {
      setMessage(`Could not update ${row.label}. Please try again.`);
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading feature switches…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Features</h2>
        <p className="text-sm text-gray-600 mt-1">
          Turn parts of the website on or off. Changes apply to all visitors within about a minute.
        </p>
      </div>

      {message && (
        <p role="status" className="text-sm text-primary-blue bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          {message}
        </p>
      )}

      {FEATURE_PAGES.map((page) => {
        const rows = features.filter((f) => f.page === page);
        if (rows.length === 0) return null;
        return (
          <section key={page} aria-labelledby={`features-${page}`} className="bg-white shadow rounded-lg">
            <h3 id={`features-${page}`} className="px-6 py-3 border-b text-sm font-semibold text-gray-700 uppercase tracking-wider">
              {page}
            </h3>
            <ul className="divide-y divide-gray-200">
              {rows.map((row) => (
                <li key={row.key} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div>
                    <p id={`feature-${row.key}-label`} className="text-base font-medium text-gray-900">{row.label}</p>
                    <p id={`feature-${row.key}-desc`} className="text-sm text-gray-600 mt-0.5">{row.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatChange(row)}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={row.enabled}
                    aria-labelledby={`feature-${row.key}-label`}
                    aria-describedby={`feature-${row.key}-desc`}
                    disabled={savingKey !== null}
                    onClick={() => void toggle(row)}
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2 disabled:opacity-60 ${
                      row.enabled ? 'bg-primary-blue' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        row.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
