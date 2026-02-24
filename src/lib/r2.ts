export function getEventImagesBucket() {
  const cloudflareRequestContextSymbol = Symbol.for('__cloudflare-request-context__');
  const requestContext = (
    globalThis as unknown as {
      [key: symbol]: { env?: { EVENT_IMAGES?: R2Bucket } } | undefined;
    }
  )[cloudflareRequestContextSymbol];

  const r2FromRequest = requestContext?.env?.EVENT_IMAGES;

  const globalContext = (
    globalThis as unknown as {
      __cloudflareContext?: { env?: { EVENT_IMAGES?: R2Bucket } };
    }
  ).__cloudflareContext;

  const bucket = r2FromRequest ?? globalContext?.env?.EVENT_IMAGES;
  if (!bucket) {
    throw new Error(
      'R2 binding not found. Add EVENT_IMAGES in wrangler.toml and Cloudflare Pages settings.',
    );
  }

  return bucket;
}

export function parseEventImageKeys(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(String(raw ?? '[]')) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((key) => String(key).trim())
      .filter((key) => key.length > 0);
  } catch {
    return [];
  }
}

