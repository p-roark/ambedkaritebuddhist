import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { parseGeolocatorResults, searchAddresses } from './address-search';
import { validateProfileFields } from './registration';

// A real Geolocator reply for "100 Queen St W Toronto" (trimmed)
const sample = JSON.parse(readFileSync(path.resolve(__dirname, '../test/fixtures/geolocator-100-queen-st-w.json'), 'utf8')) as unknown;

describe('parseGeolocatorResults', () => {
  it('keeps only street addresses and drops lanes, intersections, places and landmarks', () => {
    expect(parseGeolocatorResults(sample)).toEqual([
      { label: '100 Queen Street West, Toronto, ON', addressLine1: '100 Queen Street West', city: 'Toronto', province: 'ON' },
      { label: '100 Queen Street West, Saint John, NB', addressLine1: '100 Queen Street West', city: 'Saint John', province: 'NB' },
    ]);
  });

  it('produces values that pass the form checks', () => {
    const [toronto] = parseGeolocatorResults(sample);
    const result = validateProfileFields({
      name: 'Savitri Phule', phone: '416-555-0123', residencyStatus: 'CITIZEN', postalCode: 'M5H 2N2',
      addressLine1: toronto.addressLine1, city: toronto.city, province: toronto.province,
    });
    expect(result.ok).toBe(true);
  });

  it('cleans municipality prefixes and ignores malformed replies', () => {
    const [ajax] = parseGeolocatorResults([
      { key: 'locate', category: 'Street', province: 'Ontario', name: '12 Harwood Avenue South, Town Of Ajax, Ontario' },
    ]);
    expect(ajax.city).toBe('Ajax');
    expect(parseGeolocatorResults({ error: 'x' })).toEqual([]);
    expect(parseGeolocatorResults([null, 5, { key: 'locate', category: 'Street' }])).toEqual([]);
  });
});

describe('searchAddresses', () => {
  it('queries the Geolocator and parses the reply', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(sample), { status: 200 }));
    const suggestions = await searchAddresses('100 Queen St W Toronto', fetchMock as unknown as typeof fetch);
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toBe('https://geolocator.api.geo.ca/?q=100%20Queen%20St%20W%20Toronto&lang=en');
    expect(suggestions).toHaveLength(2);
  });

  it('throws when the service fails', async () => {
    const fetchMock = vi.fn(async () => new Response('down', { status: 503 }));
    await expect(searchAddresses('100 Queen St W', fetchMock as unknown as typeof fetch)).rejects.toThrow('503');
  });
});
