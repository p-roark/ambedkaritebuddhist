/**
 * Member registration form configuration.
 *
 * Field options and consent text live here so they can be updated without
 * touching the form or API code. When the consent wording changes, bump
 * DISCLAIMER_VERSION — each member's accepted version is stored on their record.
 */

export const RESIDENCY_STATUS_OPTIONS = [
  { value: 'CITIZEN', label: 'Canadian Citizen' },
  { value: 'PERMANENT_RESIDENT', label: 'Permanent Resident' },
  { value: 'WORK_PERMIT', label: 'Work Permit' },
  { value: 'STUDY_PERMIT', label: 'Study Permit' },
  { value: 'VISITOR', label: 'Visitor' },
  { value: 'OTHER', label: 'Other' },
] as const;

export type ResidencyStatus = (typeof RESIDENCY_STATUS_OPTIONS)[number]['value'];

export const PROVINCE_OPTIONS = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' },
] as const;

export const DISCLAIMER_VERSION = 'consent-2026-10';

export const DISCLAIMER_TITLE = 'Consent';

export const DISCLAIMER_CHECKBOX_LABEL =
  "I support the purposes of the Ambedkarite Buddhist Community of Canada (ABCC) as set out in its Articles of Incorporation, and confirm the information I've provided is true. I consent to ABCC using my information to process my application, manage my membership, keep its register of members, and contact me about meetings, elections and events. ABCC will not sell my information, and members may be entitled by law to request the list of members' names and details.";

export const AGE_CONFIRMATION_LABEL = 'I confirm I am 18 years of age or older.';

export const BOARD_INTEREST_LABEL = 'Interested in serving on board or committee.';

/** Province pre-selected on the registration form when the member has none saved. */
export const DEFAULT_PROVINCE = 'ON';
