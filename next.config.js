/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['drizzle-orm'],
  },
  images: {
    unoptimized: true, // Cloudflare Workers has no /_next/image backend
  },
};

// Make Cloudflare bindings (D1, KV, R2…) available during `next dev`.
// Reads wrangler.toml and emulates bindings locally via miniflare.
if (process.env.NODE_ENV === 'development') {
  try {
    const { initOpenNextCloudflareForDev } = require('@opennextjs/cloudflare');
    initOpenNextCloudflareForDev();
  } catch {
    console.warn('[opennextjs] @opennextjs/cloudflare not found — run `pnpm install`');
  }
}

module.exports = nextConfig;
