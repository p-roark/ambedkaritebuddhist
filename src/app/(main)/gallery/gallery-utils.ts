export function parseImageKeys(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map((key) => String(key).trim()).filter((key) => key.length > 0)
  } catch {
    return []
  }
}

export function getImageSrc(key: string) {
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
