'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { FeatureFlags, FeatureKey } from '@/lib/feature-flags';

// Components that check switches at the same time share one request; it isn't
// reused afterwards, so every page shows the switches' current state.
let pending: Promise<FeatureFlags> | null = null;
// Mounted useFeature() hooks, re-run when the switches are reloaded
const listeners = new Set<() => void>();

function loadFeatureFlags(): Promise<FeatureFlags> {
  if (!pending) {
    pending = fetch('/api/features', { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load features (${r.status})`);
        return r.json() as Promise<{ flags: FeatureFlags }>;
      })
      .then((data) => data.flags)
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

/** Reload the switches everywhere on the page (e.g. after an admin changes one). */
export function resetFeatureFlags() {
  pending = null;
  listeners.forEach((listener) => listener());
}

/**
 * Whether a feature switch is on. Returns null while loading, so callers can
 * keep gated UI hidden until the answer is known. If loading fails, the
 * feature is treated as off.
 */
export function useFeature(key: FeatureKey): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      loadFeatureFlags()
        .then((flags) => alive && setEnabled(flags[key]))
        .catch(() => alive && setEnabled(false));
    };
    load();
    listeners.add(load);
    return () => {
      alive = false;
      listeners.delete(load);
    };
  }, [key]);

  return enabled;
}

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  /** Shown when the feature is off (nothing while loading) */
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const enabled = useFeature(feature);
  if (enabled === null) return null;
  return <>{enabled ? children : fallback}</>;
}
