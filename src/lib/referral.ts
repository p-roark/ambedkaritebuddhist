/**
 * Generate a BHIM-prefixed referral code
 * Format: BHIM-{3-letter-code}-{4-character-alphanumeric}
 */
export function generateReferralCode(): string {
  // Generate 3-letter code (A-Z)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letterPart = Array.from(
    { length: 3 }, 
    () => letters[Math.floor(Math.random() * letters.length)]
  ).join('');
  
  // Generate 4-character alphanumeric code
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const numericPart = Array.from(
    { length: 4 }, 
    () => alphanumeric[Math.floor(Math.random() * alphanumeric.length)]
  ).join('');
  
  return `BHIM-${letterPart}-${numericPart}`;
}

/**
 * Validate referral code format
 */
export function isValidReferralCodeFormat(code: string): boolean {
  const pattern = /^BHIM-[A-Z]{3}-[A-Z0-9]{4}$/;
  return pattern.test(code);
}

/**
 * Extract parts from a referral code
 */
export function parseReferralCode(code: string) {
  const match = code.match(/^BHIM-([A-Z]{3})-([A-Z0-9]{4})$/);
  if (!match) {
    return null;
  }
  
  return {
    prefix: 'BHIM',
    letterPart: match[1],
    numericPart: match[2],
  };
}