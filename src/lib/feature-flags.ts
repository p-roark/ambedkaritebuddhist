/**
 * Feature switches admins can turn on/off from Dashboard → Features.
 *
 * Only released features belong here. Add an entry, then gate the UI with
 * useFeature() and enforce it in the API with requireFeature(). The default
 * applies until an admin changes the switch for the first time.
 */

export const FEATURE_PAGES = ['Home', 'Events', 'Profile', 'Membership', 'Gallery', 'Donations', 'Members'] as const;
export type FeaturePage = (typeof FEATURE_PAGES)[number];

type FeatureDefinition = {
  label: string;
  page: FeaturePage;
  description: string;
  defaultEnabled: boolean;
};

export const FEATURES = {
  eventRegistration: {
    label: 'Event registration',
    page: 'Events',
    description:
      'Members can register for events whose status is "Registration Started". When off, Register buttons are hidden and registrations are refused.',
    defaultEnabled: false,
  },
  family: {
    label: 'Family members',
    page: 'Profile',
    description:
      'Family section on the profile page, family invite links, and adding family members to event registrations.',
    defaultEnabled: false,
  },
  memberRegistration: {
    label: 'New member registration',
    page: 'Membership',
    description:
      'New members can register using an invite link. When off, invite links show a "registration paused" message. Existing members can still update their details.',
    defaultEnabled: true,
  },
  donations: {
    label: 'Donations',
    page: 'Donations',
    description: 'Donate buttons, the donations page and the donation form.',
    defaultEnabled: true,
  },
  galleryUpload: {
    label: 'Photo uploads to Google Drive',
    page: 'Gallery',
    description: 'Shows signed-in members the "Upload photos to Drive" link on event galleries.',
    defaultEnabled: true,
  },
  memberDeletion: {
    label: 'Delete deactivated members',
    page: 'Members',
    description:
      'Admins can permanently delete a member from Dashboard → Members → Inactive Members. The member must be deactivated first; deletion cannot be undone.',
    defaultEnabled: false,
  },
} as const satisfies Record<string, FeatureDefinition>;

export type FeatureKey = keyof typeof FEATURES;
export type FeatureFlags = Record<FeatureKey, boolean>;

export const FEATURE_KEYS = Object.keys(FEATURES) as FeatureKey[];

export function isFeatureKey(value: unknown): value is FeatureKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(FEATURES, value);
}

/** Applies stored switch values over the defaults; unknown stored keys are ignored. */
export function resolveFeatureFlags(stored: Array<{ key: string; enabled: boolean }>): FeatureFlags {
  const flags = Object.fromEntries(FEATURE_KEYS.map((key) => [key, FEATURES[key].defaultEnabled])) as FeatureFlags;
  for (const row of stored) {
    if (isFeatureKey(row.key)) flags[row.key] = Boolean(row.enabled);
  }
  return flags;
}
