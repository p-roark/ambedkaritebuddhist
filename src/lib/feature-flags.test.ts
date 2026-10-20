import { describe, expect, it } from 'vitest';
import { FEATURE_KEYS, FEATURES, FEATURE_PAGES, isFeatureKey, resolveFeatureFlags } from './feature-flags';

describe('feature flags registry', () => {
  it('uses defaults when nothing is stored', () => {
    const flags = resolveFeatureFlags([]);
    for (const key of FEATURE_KEYS) expect(flags[key]).toBe(FEATURES[key].defaultEnabled);
  });

  it('applies stored values over defaults and ignores unknown keys', () => {
    const flags = resolveFeatureFlags([
      { key: 'family', enabled: true },
      { key: 'donations', enabled: false },
      { key: 'removedFeature', enabled: true },
    ]);
    expect(flags.family).toBe(true);
    expect(flags.donations).toBe(false);
    expect(flags).not.toHaveProperty('removedFeature');
  });

  it('only accepts registered keys', () => {
    expect(isFeatureKey('eventRegistration')).toBe(true);
    expect(isFeatureKey('toString')).toBe(false);
    expect(isFeatureKey(42)).toBe(false);
  });

  it('assigns every feature to a known page', () => {
    for (const key of FEATURE_KEYS) expect(FEATURE_PAGES).toContain(FEATURES[key].page);
  });
});
