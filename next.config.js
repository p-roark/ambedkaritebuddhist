/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['drizzle-orm'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/events/image',
      },
      {
        pathname: '/images/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.com',
      },
    ],
  },
};

// Make Cloudflare bindings (D1, KV, R2…) available during `next dev`.
// Reads wrangler.toml and emulates bindings locally via miniflare.
if (process.env.NODE_ENV === 'development') {
  try {
    const { setupDevPlatform } = require('@opennextjs/cloudflare/api');
    setupDevPlatform().catch(console.error);
  } catch {
    console.warn('[opennextjs] @opennextjs/cloudflare not found — run `pnpm install`');
  }
}

module.exports = nextConfig;
