import { PROVINCE_OPTIONS, RESIDENCY_STATUS_OPTIONS, type ResidencyStatus } from '@/lib/registration-config';
import { isValidReferralCodeFormat } from '@/lib/referral';

/**
 * Where a signed-in user is in the registration flow:
 * - complete:         registration form submitted (or admin)
 * - profile_required: already used an invite code (or is a leader) but has not
 *                     submitted the registration form yet
 * - invite_required:  needs a valid invite link before they can register
 */
export type RegistrationStatus = 'complete' | 'profile_required' | 'invite_required';

export type RegistrationUserFields = {
  role: string;
  referredBy: string | null;
  registrationCompletedAt: string | null;
};

export function getRegistrationStatus(
  user: RegistrationUserFields | null | undefined,
  options: { isAdmin?: boolean } = {},
): RegistrationStatus {
  if (options.isAdmin || user?.role === 'ADMIN') return 'complete';
  if (!user) return 'invite_required';
  if (user.registrationCompletedAt) return 'complete';
  if (user.referredBy || user.role === 'LEADER') return 'profile_required';
  return 'invite_required';
}

export type ProfileFields = {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  province: string;
  postalCode: string;
  residencyStatus: ResidencyStatus;
};

export type ProfileFieldName = keyof ProfileFields;
export type RegistrationFieldName = ProfileFieldName | 'ageConfirmed' | 'disclaimerAccepted';

/** Profile fields plus the registration-only answers. */
export type RegistrationFields = ProfileFields & { boardInterest: boolean };

export type ValidationResult<T, K extends string> =
  | { ok: true; value: T }
  | { ok: false; errors: Partial<Record<K, string>> };

const MAX_LENGTH = 200;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Accepts a province code ("ON") or name ("Ontario"), case-insensitive. */
export function normalizeProvince(value: unknown): string | null {
  const input = text(value).toLowerCase();
  if (!input) return null;
  const match = PROVINCE_OPTIONS.find(
    (p) => p.value.toLowerCase() === input || p.label.toLowerCase() === input,
  );
  return match?.value ?? null;
}

/** Canadian postal code, normalised to "A1A 1A1". */
export function normalizePostalCode(value: unknown): string | null {
  const compact = text(value).toUpperCase().replace(/[\s-]/g, '');
  if (!/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/.test(compact)) return null;
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

// Letters in any script (with accents/combining marks)
const LETTER = /\p{L}/gu;
const letterCount = (value: string) => (value.match(LETTER) ?? []).length;

/** Person's name: letters, spaces, hyphens, apostrophes and periods; at least 2 letters. */
export function isValidPersonName(value: unknown): boolean {
  const input = text(value);
  return /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u.test(input) && letterCount(input) >= 2;
}

/** City or town: letters, spaces, hyphens, apostrophes and periods (no digits); at least 2 letters. */
export function isValidCity(value: unknown): boolean {
  const input = text(value);
  return /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u.test(input) && letterCount(input) >= 2;
}

// Characters that appear in Canadian addresses: letters, digits, spaces and . , ' ’ # / -
const ADDRESS_CHARS = /^[\p{L}\p{M}\d .,'’#/-]+$/u;

/** Street address: a civic number (or PO box / rural route number) plus a street name. */
export function isValidStreetAddress(value: unknown): boolean {
  const input = text(value);
  return ADDRESS_CHARS.test(input) && /\d/.test(input) && letterCount(input) >= 2;
}

/** Apartment, unit, buzzer, etc. — same characters as an address. */
export function isValidAddressLine2(value: unknown): boolean {
  const input = text(value);
  return ADDRESS_CHARS.test(input) && /[\p{L}\d]/u.test(input);
}

// First letter of a Canadian postal code → province/territory
const POSTAL_PREFIX_PROVINCES: Record<string, string[]> = {
  A: ['NL'], B: ['NS'], C: ['PE'], E: ['NB'], G: ['QC'], H: ['QC'], J: ['QC'],
  K: ['ON'], L: ['ON'], M: ['ON'], N: ['ON'], P: ['ON'],
  R: ['MB'], S: ['SK'], T: ['AB'], V: ['BC'], X: ['NT', 'NU'], Y: ['YT'],
};

/** Whether a (normalised) postal code belongs to the province, e.g. "M5H 2N2" is in ON. */
export function postalCodeMatchesProvince(postalCode: string, province: string): boolean {
  return POSTAL_PREFIX_PROVINCES[postalCode.charAt(0)]?.includes(province) ?? false;
}

const INVALID = {
  name: 'Enter your name using letters (spaces, hyphens and apostrophes are fine).',
  addressLine1: 'Enter a street address with a number and street name, e.g. 100 Queen St W.',
  addressLine2: 'Use letters and numbers only, e.g. Unit 1203.',
  city: 'Enter a city or town name using letters, e.g. Toronto.',
  postalMismatch: 'This postal code isn’t in the selected province. Please check both.',
} as const;

/** Allows common formatting characters; requires 10–15 digits. */
export function isValidPhone(value: unknown): boolean {
  const input = text(value);
  if (!/^\+?[\d\s().-]+$/.test(input)) return false;
  const digits = input.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

export function isResidencyStatus(value: unknown): value is ResidencyStatus {
  return RESIDENCY_STATUS_OPTIONS.some((o) => o.value === value);
}

/** Validates the mandatory member profile fields (shared by registration and profile edit). */
export function validateProfileFields(raw: unknown): ValidationResult<ProfileFields, ProfileFieldName> {
  const body = (raw ?? {}) as Record<string, unknown>;
  const errors: Partial<Record<ProfileFieldName, string>> = {};

  const name = text(body.name);
  if (!name) errors.name = 'Full name is required.';
  else if (name.length > MAX_LENGTH) errors.name = 'Full name is too long.';
  else if (!isValidPersonName(name)) errors.name = INVALID.name;

  const phone = text(body.phone);
  if (!phone) errors.phone = 'Phone number is required.';
  else if (!isValidPhone(phone)) errors.phone = 'Enter a valid phone number, e.g. 416-555-0123.';

  const addressLine1 = text(body.addressLine1);
  if (!addressLine1) errors.addressLine1 = 'Street address is required.';
  else if (addressLine1.length > MAX_LENGTH) errors.addressLine1 = 'Street address is too long.';
  else if (!isValidStreetAddress(addressLine1)) errors.addressLine1 = INVALID.addressLine1;

  const addressLine2 = text(body.addressLine2);
  if (addressLine2.length > MAX_LENGTH) errors.addressLine2 = 'Address line 2 is too long.';
  else if (addressLine2 && !isValidAddressLine2(addressLine2)) errors.addressLine2 = INVALID.addressLine2;

  const city = text(body.city);
  if (!city) errors.city = 'City is required.';
  else if (city.length > MAX_LENGTH) errors.city = 'City is too long.';
  else if (!isValidCity(city)) errors.city = INVALID.city;

  const province = normalizeProvince(body.province);
  if (!province) errors.province = 'Select your province or territory.';

  const postalCode = normalizePostalCode(body.postalCode);
  if (!postalCode) errors.postalCode = 'Enter a valid Canadian postal code, e.g. M5V 2T6.';
  else if (province && !postalCodeMatchesProvince(postalCode, province)) errors.postalCode = INVALID.postalMismatch;

  const residencyStatus = body.residencyStatus;
  if (!isResidencyStatus(residencyStatus)) errors.residencyStatus = 'Select your residency status in Canada.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      phone,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      province: province as string,
      postalCode: postalCode as string,
      residencyStatus: residencyStatus as ResidencyStatus,
    },
  };
}

// Name is always required; other fields may be blank for unregistered members
export type PartialProfileFields = { name: string } & { [K in Exclude<keyof ProfileFields, 'name'>]: ProfileFields[K] | null };

/**
 * Validates profile fields for an admin edit. For members who have completed
 * registration the mandatory fields stay mandatory; for members who haven't,
 * blank fields are allowed but anything entered must still be valid.
 */
export function validateProfileUpdate(
  raw: unknown,
  options: { requireComplete: boolean },
): ValidationResult<PartialProfileFields, ProfileFieldName> {
  if (options.requireComplete) return validateProfileFields(raw);

  const body = (raw ?? {}) as Record<string, unknown>;
  const errors: Partial<Record<ProfileFieldName, string>> = {};
  const optional = (field: ProfileFieldName) => text(body[field]) || null;

  const name = text(body.name);
  if (!name) errors.name = 'Full name is required.';
  else if (name.length > MAX_LENGTH) errors.name = 'Full name is too long.';
  else if (!isValidPersonName(name)) errors.name = INVALID.name;

  const phone = optional('phone');
  if (phone && !isValidPhone(phone)) errors.phone = 'Enter a valid phone number, e.g. 416-555-0123.';

  const formatChecks = { addressLine1: isValidStreetAddress, addressLine2: isValidAddressLine2, city: isValidCity } as const;
  for (const field of ['addressLine1', 'addressLine2', 'city'] as const) {
    const value = optional(field);
    if (!value) continue;
    if (value.length > MAX_LENGTH) errors[field] = 'This value is too long.';
    else if (!formatChecks[field](value)) errors[field] = INVALID[field];
  }

  const provinceInput = optional('province');
  const province = provinceInput ? normalizeProvince(provinceInput) : null;
  if (provinceInput && !province) errors.province = 'Select a province or territory.';

  const postalInput = optional('postalCode');
  const postalCode = postalInput ? normalizePostalCode(postalInput) : null;
  if (postalInput && !postalCode) errors.postalCode = 'Enter a valid Canadian postal code, e.g. M5V 2T6.';
  else if (postalCode && province && !postalCodeMatchesProvince(postalCode, province)) errors.postalCode = INVALID.postalMismatch;

  const residencyInput = optional('residencyStatus');
  if (residencyInput && !isResidencyStatus(residencyInput)) errors.residencyStatus = 'Select a residency status.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      phone,
      addressLine1: optional('addressLine1'),
      addressLine2: optional('addressLine2'),
      city: optional('city'),
      province,
      postalCode,
      residencyStatus: (residencyInput as ResidencyStatus | null) ?? null,
    },
  };
}

/**
 * Validates the registration form: profile fields, the required age
 * confirmation and consent, and the optional board/committee interest.
 */
export function validateRegistration(raw: unknown): ValidationResult<RegistrationFields, RegistrationFieldName> {
  const body = (raw ?? {}) as Record<string, unknown>;
  const profile = validateProfileFields(body);
  const ageConfirmed = body.ageConfirmed === true;
  const disclaimerAccepted = body.disclaimerAccepted === true;

  if (profile.ok && ageConfirmed && disclaimerAccepted) {
    return { ok: true, value: { ...profile.value, boardInterest: body.boardInterest === true } };
  }

  const errors: Partial<Record<RegistrationFieldName, string>> = profile.ok ? {} : { ...profile.errors };
  if (!ageConfirmed) errors.ageConfirmed = 'You must be 18 years of age or older to become a member.';
  if (!disclaimerAccepted) errors.disclaimerAccepted = 'Please give your consent to submit your application.';
  return { ok: false, errors };
}

export function normalizeInviteCode(value: unknown): string | null {
  const code = text(value).toUpperCase();
  return isValidReferralCodeFormat(code) ? code : null;
}

/** Builds the pre-filled invite link admins share with new members. */
export function buildInviteLink(origin: string, code: string): string {
  return `${origin.replace(/\/+$/, '')}/join?code=${encodeURIComponent(code)}`;
}

/** Only allow same-site relative redirects after sign-in. */
export function safeCallbackUrl(value: string | null | undefined, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
}
