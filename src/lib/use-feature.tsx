'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { FeatureFlags, FeatureKey } from '@/lib/feature-flags';

// One shared request per page load for every component that checks a switch
let pending: Promise<FeatureFlags> | null = null;

function loadFeatureFlags(): Promise<FeatureFlags> {
  if (!pending) {
    pending = fetch('/api/features')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load features (${r.status})`);
        return r.json() as Promise<{ flags: FeatureFlags }>;
      })
      .then((data) => data.flags)
      .catch((error: unknown) => {
        pending = null; // allow a retry on the next call
        throw error;
      });
  }
  return pending;
}

/** Forget the loaded switches (e.g. after an admin changes one). */
export function resetFeatureFlags() {
  pending = null;
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
    loadFeatureFlags()
      .then((flags) => alive && setEnabled(flags[key]))
      .catch(() => alive && setEnabled(false));
    return () => {
      alive = false;
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
