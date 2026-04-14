import { describe, expect, it } from 'vitest'
import {
  formatGalleryDate,
  getImageSrc,
  getWrappedIndex,
  parseImageKeys,
} from './gallery-utils'

describe('gallery-utils', () => {
  it('parses stored image keys and removes blank entries', () => {
    expect(parseImageKeys('["hero.jpg","  ","album/photo-2.jpg"]')).toEqual([
      'hero.jpg',
      'album/photo-2.jpg',
    ])
  })

  it('returns an empty array for malformed image data', () => {
    expect(parseImageKeys('not-json')).toEqual([])
    expect(parseImageKeys('{"key":"value"}')).toEqual([])
  })

  it('formats gallery image urls', () => {
    expect(getImageSrc('folder/my image.jpg')).toBe('/api/events/image?key=folder%2Fmy%20image.jpg')
  })

  it('formats valid dates for display', () => {
    expect(formatGalleryDate('2026-04-14')).toBe('April 14, 2026')
    expect(formatGalleryDate('invalid-date')).toBe('invalid-date')
  })

  it('wraps image indexes in both directions', () => {
    expect(getWrappedIndex(5, 4)).toBe(1)
    expect(getWrappedIndex(-1, 4)).toBe(3)
    expect(getWrappedIndex(2, 0)).toBe(0)
  })
})
