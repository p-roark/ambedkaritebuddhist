import { sameAddress, searchAddresses, type AddressFields } from '@/lib/address-search';
import { isFeatureEnabled } from '@/lib/feature-flags-server';

/**
 * Checks a member's street address against the Government of Canada
 * Geolocator and returns when it was verified, or null if it wasn't. Addresses
 * the search can't find (e.g. new builds, rural routes) are still accepted,
 * just saved as not verified (admins can see this); the form's format checks
 * still apply. An unchanged, already verified address keeps its status; an
 * unchanged unverified one is looked up again only when
 * `recheckUnverifiedUnchanged` (registration).
 */
export async function checkMemberAddress(
  address: AddressFields,
  previous: ({ [K in keyof AddressFields]?: string | null } & { addressVerifiedAt?: string | null }) | null | undefined,
  options: { recheckUnverifiedUnchanged: boolean },
): Promise<{ addressVerifiedAt: string | null }> {
  const unchanged = Boolean(
    previous?.addressLine1 && previous.city && previous.province &&
    sameAddress(address, { addressLine1: previous.addressLine1, city: previous.city, province: previous.province }),
  );
  if (unchanged && (previous?.addressVerifiedAt || !options.recheckUnverifiedUnchanged)) {
    return { addressVerifiedAt: previous?.addressVerifiedAt ?? null };
  }

  if (!(await isFeatureEnabled('addressLookup'))) return { addressVerifiedAt: null };

  try {
    const matches = await searchAddresses(`${address.addressLine1} ${address.city}`, fetch, 50);
    return { addressVerifiedAt: matches.some((m) => sameAddress(m, address)) ? new Date().toISOString() : null };
  } catch (error) {
    console.error('[address] Geolocator unavailable; saving address unverified:', error);
    return { addressVerifiedAt: null };
  }
}
