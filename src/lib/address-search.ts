import { normalizeProvince } from '@/lib/registration';

/**
 * Canadian street-address search using the Government of Canada Geolocator
 * (Natural Resources Canada, https://geolocator.api.geo.ca) — free, no key.
 * It returns street, city and province, but not postal codes.
 */
export const GEOLOCATOR_URL = 'https://geolocator.api.geo.ca/';

export type AddressSuggestion = {
  /** Shown in the list, e.g. "100 Queen Street West, Toronto, ON" */
  label: string;
  addressLine1: string;
  city: string;
  /** Province/territory code, e.g. "ON" */
  province: string;
};

type GeolocatorResult = {
  key?: string;
  name?: string;
  province?: string;
  category?: string;
  tag?: string[];
};

export const MAX_SUGGESTIONS = 6;

// "City Of Toronto" → "Toronto", "Town Of Ajax" → "Ajax", "Ville De Laval" → "Laval"
const MUNICIPALITY_PREFIX = /^(city|town|township|municipality|village|county|district|region|regional municipality|ville|cité|municipalité|canton|paroisse) (of|de|du|des|d') ?/i;

function cleanCity(value: string): string {
  return value.replace(MUNICIPALITY_PREFIX, '').trim();
}

/**
 * Keeps only real street addresses (a house number plus street) from the
 * Geolocator's own address data, dropping lanes, intersections, places and
 * landmarks, and turns them into form values.
 */
export function parseGeolocatorResults(results: unknown): AddressSuggestion[] {
  if (!Array.isArray(results)) return [];
  const suggestions: AddressSuggestion[] = [];
  const seen = new Set<string>();

  for (const raw of results as GeolocatorResult[]) {
    if (raw?.key !== 'locate' || raw.category !== 'Street' || typeof raw.name !== 'string') continue;
    // e.g. "100 Queen Street West, City Of Toronto, Ontario"
    const parts = raw.name.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length < 3) continue;
    const addressLine1 = parts[0];
    if (!/^\d+[A-Za-z]?(-\d+)? \S/.test(addressLine1)) continue; // must start with a civic number
    const province = normalizeProvince(raw.province) ?? normalizeProvince(parts[parts.length - 1]);
    const city = cleanCity(parts.slice(1, -1).join(', '));
    if (!province || !city) continue;

    const label = `${addressLine1}, ${city}, ${province}`;
    if (seen.has(label)) continue;
    seen.add(label);
    suggestions.push({ label, addressLine1, city, province });
    if (suggestions.length >= MAX_SUGGESTIONS) break;
  }
  return suggestions;
}

/** Calls the Geolocator; throws on network errors or a non-OK reply. */
export async function searchAddresses(query: string, fetchImpl: typeof fetch = fetch): Promise<AddressSuggestion[]> {
  const url = `${GEOLOCATOR_URL}?q=${encodeURIComponent(query)}&lang=en`;
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(5000), headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Geolocator replied ${res.status}`);
  return parseGeolocatorResults(await res.json());
}
