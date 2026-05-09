export function parseImageKeys(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map((key) => String(key).trim()).filter((key) => key.length > 0)
  } catch {
    return []
  }
}

/**
 * Returns true when the key represents a Google Drive image (prefixed with "gdrive:").
 */
export function isGoogleDriveImageKey(key: string): boolean {
  return key.startsWith('gdrive:')
}

/**
 * Builds the display URL for an image key.
 * - R2 keys  → proxied through /api/events/image
 * - Drive keys (gdrive:FILE_ID) → Google Drive thumbnail URL
 */
export function getImageSrc(key: string) {
  if (isGoogleDriveImageKey(key)) {
    const fileId = key.slice(7)
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w800`
  }
  return `/api/events/image?key=${encodeURIComponent(key)}`
}

export function formatGalleryDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getWrappedIndex(index: number, total: number) {
  if (total <= 0) return 0
  return ((index % total) + total) % total
}
