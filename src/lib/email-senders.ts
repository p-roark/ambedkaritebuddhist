/**
 * Purposes the website sends email for. Each can have its own sender address
 * (Dashboard → Settings → Email); when blank, the organization email is used.
 *
 * With Google Workspace, every sender address must be a real Workspace mailbox
 * (not a group or alias), because the website signs in as that mailbox.
 */
export const EMAIL_PURPOSES = {
  registrations: {
    label: 'Member registrations',
    description: 'Sends welcome emails to new members. New-registration notices are sent to this address.',
  },
  signIn: {
    label: 'Sign-in links',
    description: 'One-time email sign-in links (when the "Email sign-in link" feature is on).',
  },
  donations: {
    label: 'Donations',
    description: 'Donation acknowledgements and receipts.',
  },
  events: {
    label: 'Events',
    description: 'Event registration confirmations and updates.',
  },
  familyInvites: {
    label: 'Family invites',
    description: 'Invitations to link a family member’s account.',
  },
} as const satisfies Record<string, { label: string; description: string }>;

export type EmailPurpose = keyof typeof EMAIL_PURPOSES;
export const EMAIL_PURPOSE_KEYS = Object.keys(EMAIL_PURPOSES) as EmailPurpose[];

export function isEmailPurpose(value: unknown): value is EmailPurpose {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(EMAIL_PURPOSES, value);
}

export function isValidEmailAddress(value: string): boolean {
  return value.length <= 254 && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(value);
}
