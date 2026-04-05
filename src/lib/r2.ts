type CfEnv = {
  DEPLOYMENT?: string;
  EVENT_IMAGES?: R2Bucket;
  EVENT_IMAGES_PROD?: R2Bucket;
};

export function getEventImagesBucket() {
  const { getCloudflareContext } = require('@opennextjs/cloudflare');
  const env = (getCloudflareContext() as { env: CfEnv }).env;
  const isProd = (env?.DEPLOYMENT ?? 'dev') === 'prod';
  const bucket = isProd ? env?.EVENT_IMAGES_PROD : env?.EVENT_IMAGES;

  if (!bucket) {
    throw new Error(
      `R2 binding not found (DEPLOYMENT=${isProd ? 'prod' : 'dev'}). ` +
      'Add EVENT_IMAGES / EVENT_IMAGES_PROD in wrangler.toml and Cloudflare Pages settings.',
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
