import { sameAddress, searchAddresses, type AddressFields } from '@/lib/address-search';
import { isFeatureEnabled } from '@/lib/feature-flags-server';

export type AddressCheck =
  | { ok: true; addressVerifiedAt: string | null }
  | { ok: false; error: string };

export const ADDRESS_NOT_FOUND =
  'Please choose your address from the “Find your address” list. If your address isn’t listed, contact us and we’ll add it for you.';

/**
 * Enforces the Address search: a new or changed street address must be one the
 * Government of Canada Geolocator knows. An unchanged, already verified
 * address keeps its status; an unchanged unverified one is accepted only when
 * `allowUnverifiedUnchanged` (profile edits, so an old address doesn't block
 * updating a phone number). If the Geolocator can't be reached the address is
 * accepted but left unverified (admins can see this), so members are never
 * blocked by an outage.
 */
export async function checkMemberAddress(
  address: AddressFields,
  previous: ({ [K in keyof AddressFields]?: string | null } & { addressVerifiedAt?: string | null }) | null | undefined,
  options: { allowUnverifiedUnchanged: boolean },
): Promise<AddressCheck> {
  const unchanged = Boolean(
    previous?.addressLine1 && previous.city && previous.province &&
    sameAddress(address, { addressLine1: previous.addressLine1, city: previous.city, province: previous.province }),
  );
  if (unchanged && (previous?.addressVerifiedAt || options.allowUnverifiedUnchanged)) {
    return { ok: true, addressVerifiedAt: previous?.addressVerifiedAt ?? null };
  }

  if (!(await isFeatureEnabled('addressLookup'))) return { ok: true, addressVerifiedAt: null };

  try {
    const matches = await searchAddresses(`${address.addressLine1} ${address.city}`, fetch, 50);
    if (matches.some((m) => sameAddress(m, address))) return { ok: true, addressVerifiedAt: new Date().toISOString() };
    return { ok: false, error: ADDRESS_NOT_FOUND };
  } catch (error) {
    console.error('[address] Geolocator unavailable; saving address unverified:', error);
    return { ok: true, addressVerifiedAt: null };
  }
}
