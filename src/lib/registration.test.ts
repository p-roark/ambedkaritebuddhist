import { describe, expect, it } from 'vitest';
import {
  buildInviteLink,
  getRegistrationStatus,
  checkCanadianPhone,
  isValidPhone,
  normalizeInviteCode,
  normalizePostalCode,
  normalizeProvince,
  postalCodeMatchesProvince,
  safeCallbackUrl,
  validateProfileFields,
  validateProfileUpdate,
  validateRegistration,
} from './registration';

const validForm = {
  name: 'Savitri Phule',
  phone: '(416) 555-0123',
  addressLine1: '100 Queen St W',
  addressLine2: '',
  city: 'Toronto',
  province: 'ON',
  postalCode: 'm5h2n2',
  residencyStatus: 'PERMANENT_RESIDENT',
  ageConfirmed: true,
  disclaimerAccepted: true,
};

describe('getRegistrationStatus', () => {
  it('requires an invite when there is no user record', () => {
    expect(getRegistrationStatus(null)).toBe('invite_required');
  });

  it('requires an invite for users created without a referral code', () => {
    expect(getRegistrationStatus({ role: 'MEMBER', referredBy: null, registrationCompletedAt: null })).toBe('invite_required');
  });

  it('requires only the profile form for existing referred members', () => {
    expect(getRegistrationStatus({ role: 'MEMBER', referredBy: 'BHIM-ABC-1234', registrationCompletedAt: null })).toBe('profile_required');
  });

  it('requires only the profile form for leaders', () => {
    expect(getRegistrationStatus({ role: 'LEADER', referredBy: null, registrationCompletedAt: null })).toBe('profile_required');
  });

  it('is complete once the form has been submitted', () => {
    expect(getRegistrationStatus({ role: 'MEMBER', referredBy: 'BHIM-ABC-1234', registrationCompletedAt: '2026-10-15T00:00:00Z' })).toBe('complete');
  });

  it('treats admins as complete', () => {
    expect(getRegistrationStatus({ role: 'ADMIN', referredBy: null, registrationCompletedAt: null })).toBe('complete');
    expect(getRegistrationStatus(null, { isAdmin: true })).toBe('complete');
  });
});

describe('validateRegistration', () => {
  it('accepts a complete form and normalises values', () => {
    const result = validateRegistration(validForm);
    expect(result).toEqual({
      ok: true,
      value: {
        name: 'Savitri Phule',
        phone: '416-555-0123', // normalised
        addressLine1: '100 Queen St W',
        addressLine2: null,
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5H 2N2',
        residencyStatus: 'PERMANENT_RESIDENT',
        boardInterest: false,
      },
    });
  });

  it('requires the age confirmation', () => {
    const result = validateRegistration({ ...validForm, ageConfirmed: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(['ageConfirmed']);
  });

  it('records board/committee interest only when ticked', () => {
    const without = validateRegistration(validForm);
    const withInterest = validateRegistration({ ...validForm, boardInterest: true });
    expect(without.ok && without.value.boardInterest).toBe(false);
    expect(withInterest.ok && withInterest.value.boardInterest).toBe(true);
  });

  it('requires the consent to be given', () => {
    const result = validateRegistration({ ...validForm, disclaimerAccepted: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(['disclaimerAccepted']);
  });

  it('does not accept a truthy string as disclaimer acceptance', () => {
    expect(validateRegistration({ ...validForm, disclaimerAccepted: 'true' }).ok).toBe(false);
  });

  it('reports every missing required field', () => {
    const result = validateRegistration({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(
        ['addressLine1', 'ageConfirmed', 'city', 'disclaimerAccepted', 'name', 'phone', 'postalCode', 'province', 'residencyStatus'].sort(),
      );
    }
  });

  it('rejects unknown residency status values', () => {
    const result = validateProfileFields({ ...validForm, residencyStatus: 'ALIEN' });
    expect(result.ok).toBe(false);
  });

  it('rejects overly long values', () => {
    const result = validateProfileFields({ ...validForm, city: 'x'.repeat(201) });
    expect(result.ok).toBe(false);
  });
});

describe('field normalisers', () => {
  it('normalises province codes and names', () => {
    expect(normalizeProvince('on')).toBe('ON');
    expect(normalizeProvince('British Columbia')).toBe('BC');
    expect(normalizeProvince('Texas')).toBeNull();
    expect(normalizeProvince(undefined)).toBeNull();
  });

  it('validates Canadian postal codes', () => {
    expect(normalizePostalCode('k1a 0b1')).toBe('K1A 0B1');
    expect(normalizePostalCode('K1A-0B1')).toBe('K1A 0B1');
    expect(normalizePostalCode('D1A 0B1')).toBeNull(); // D is not a valid first letter
    expect(normalizePostalCode('12345')).toBeNull();
  });

  it('accepts Canadian phone numbers in common formats and normalises them', () => {
    for (const input of ['416-555-0123', '(416) 555-0123', '416.555.0123', '4165550123', '1-416-555-0123', '+1 416 555 0123', '+14165550123']) {
      expect(checkCanadianPhone(input), input).toEqual({ ok: true, phone: '416-555-0123' });
    }
    expect(checkCanadianPhone('604 555 0199')).toEqual({ ok: true, phone: '604-555-0199' });
  });

  it('rejects numbers that are not 10-digit Canadian numbers', () => {
    for (const input of ['555-0123', '416-555-012', '4165550123999', '416-555-01234', 'call me', '+91 98765 43210', '+44 20 7946 0958']) {
      expect(isValidPhone(input), input).toBe(false);
    }
  });

  it('rejects made-up numbers and non-Canadian area codes', () => {
    expect(checkCanadianPhone('0000000000')).toMatchObject({ ok: false, error: expect.stringContaining('area code') });
    expect(checkCanadianPhone('1234567890')).toMatchObject({ ok: false });
    expect(checkCanadianPhone('212-555-0123')).toMatchObject({ ok: false, error: expect.stringContaining('area code') }); // New York
    expect(checkCanadianPhone('999-999-9999')).toMatchObject({ ok: false });
    expect(checkCanadianPhone('416-011-2345')).toMatchObject({ ok: false, error: expect.stringContaining('valid phone') }); // exchange starts with 0
    expect(checkCanadianPhone('416-911-2345')).toMatchObject({ ok: false }); // N11 service code
    expect(checkCanadianPhone('905-999-9999')).toMatchObject({ ok: false }); // placeholder
  });

  it('normalises invite codes, including digits in the middle segment', () => {
    expect(normalizeInviteCode(' bhim-a2b-xy34 ')).toBe('BHIM-A2B-XY34');
    expect(normalizeInviteCode('BHIM-ABC-123')).toBeNull();
    expect(normalizeInviteCode(null)).toBeNull();
  });
});

describe('links', () => {
  it('builds the pre-filled invite link', () => {
    expect(buildInviteLink('https://example.org/', 'BHIM-ABC-1234')).toBe('https://example.org/join?code=BHIM-ABC-1234');
  });

  it('only allows same-site callback URLs', () => {
    expect(safeCallbackUrl('/events')).toBe('/events');
    expect(safeCallbackUrl('https://evil.example')).toBe('/');
    expect(safeCallbackUrl('//evil.example')).toBe('/');
    expect(safeCallbackUrl('/\\evil.example')).toBe('/');
    expect(safeCallbackUrl(null)).toBe('/');
  });
});

describe('address and name checks', () => {
  const errorsFor = (overrides: Record<string, string>) => {
    const result = validateProfileFields({ ...validForm, ...overrides });
    return result.ok ? {} : result.errors;
  };

  it('accepts real-world values', () => {
    for (const [field, value] of [
      ['name', "Savitri Phule"], ['name', "Ravi D'Souza-Kamble"], ['name', 'Dr. B. R. Ambedkar'], ['name', 'सावित्री फुले'],
      ['addressLine1', '100 Queen St W'], ['addressLine1', '12-345 Rue Saint-Denis'], ['addressLine1', 'PO Box 123'],
      ['addressLine1', 'RR 2'], ['addressLine1', '1203/45 King St. E.'],
      ['city', 'Toronto'], ['city', 'St. Catharines'], ['city', 'Trois-Rivières'], ['city', "Niagara-on-the-Lake"],
    ] as const) {
      expect(errorsFor({ [field]: value }), `${field}: ${value}`).toEqual({});
    }
    expect(errorsFor({ addressLine2: 'Unit 1203' })).toEqual({});
  });

  it('rejects junk', () => {
    expect(errorsFor({ addressLine1: ':)68' })).toHaveProperty('addressLine1');
    expect(errorsFor({ addressLine1: 'Queen Street' })).toHaveProperty('addressLine1'); // no number
    expect(errorsFor({ addressLine1: '12345' })).toHaveProperty('addressLine1'); // no street name
    expect(errorsFor({ city: '123' })).toHaveProperty('city');
    expect(errorsFor({ city: 'T' })).toHaveProperty('city');
    expect(errorsFor({ city: 'Toronto!!' })).toHaveProperty('city');
    expect(errorsFor({ name: 'R2D2' })).toHaveProperty('name');
    expect(errorsFor({ name: '<b>Ravi</b>' })).toHaveProperty('name');
    expect(errorsFor({ addressLine2: ':)' })).toHaveProperty('addressLine2');
  });

  it('checks the postal code belongs to the province', () => {
    expect(postalCodeMatchesProvince('L1W 1C2', 'ON')).toBe(true);
    expect(postalCodeMatchesProvince('V6B 1A1', 'ON')).toBe(false);
    expect(postalCodeMatchesProvince('X1A 2B3', 'NU')).toBe(true);
    expect(errorsFor({ province: 'BC', postalCode: 'M5H 2N2' })).toHaveProperty('postalCode');
    expect(errorsFor({ province: 'BC', city: 'Vancouver', postalCode: 'V6B 1A1' })).toEqual({});
  });

  it('applies the same checks to admin edits of unregistered members', () => {
    const result = validateProfileUpdate({ name: 'Ravi', city: '123', addressLine1: ':)68' }, { requireComplete: false });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['addressLine1', 'city']);
    expect(validateProfileUpdate({ name: 'Ravi' }, { requireComplete: false }).ok).toBe(true);
  });
});
