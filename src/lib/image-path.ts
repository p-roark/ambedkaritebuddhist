const DEFAULT_EVENT_COVER = '/images/events/covers/dcpd.jpg';

export function normalizeImagePath(src: string | null | undefined, fallback = DEFAULT_EVENT_COVER) {
  const value = String(src ?? '').trim();
  const lower = value.toLowerCase();
  if (!value || lower === 'null' || lower === 'undefined' || lower === 'coverimage' || lower === '[object object]') {
    return fallback;
  }
  if (value.startsWith('/')) return value;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (!/\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(value)) return fallback;
  return `/images/events/covers/${value}`;
}
