/**
 * Member registration form configuration.
 *
 * Field options and disclaimer text live here so they can be updated without
 * touching the form or API code. When the disclaimer wording changes, bump
 * DISCLAIMER_VERSION — each member's accepted version is stored on their record.
 *
 * TODO(registration): replace the placeholder residency options and disclaimer
 * text with the final versions from Sumit before release.
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

export const DISCLAIMER_VERSION = 'draft-2026-10';

export const DISCLAIMER_TITLE = 'Member Declaration';

// Placeholder text — to be replaced with the final disclaimer from Sumit.
export const DISCLAIMER_PARAGRAPHS = [
  'I confirm that the information I have provided is true and complete to the best of my knowledge.',
  'I understand that the Ambedkarite Buddhist Community of Canada (ABCC) will store my details securely and use them only for community communication, event planning and membership administration. My details will not be sold or shared outside ABCC without my consent.',
  'I agree to uphold the values of the community and to participate respectfully in its activities.',
];

export const DISCLAIMER_CHECKBOX_LABEL = 'I have read and accept the member declaration above.';
