const PLACEHOLDER_NAMES = new Set(['community member', 'admin user']);

export function isPlaceholderName(name: string | null | undefined) {
  return PLACEHOLDER_NAMES.has(String(name ?? '').trim().toLowerCase());
}

export function nameFromEmail(email: string | null | undefined) {
  const localPart = String(email ?? '').split('@')[0]?.trim() ?? '';
  if (!localPart) return 'Community Member';

  const cleaned = localPart.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'Community Member';

  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function pickDisplayName(input: {
  sessionName?: string | null;
  tokenName?: string | null;
  dbName?: string | null;
  email?: string | null;
}) {
  const candidates = [input.dbName, input.sessionName, input.tokenName]
    .map((name) => String(name ?? '').trim())
    .filter((name) => name.length > 0);

  const firstNonPlaceholder = candidates.find((name) => !isPlaceholderName(name));
  if (firstNonPlaceholder) return firstNonPlaceholder;

  return nameFromEmail(input.email);
}
