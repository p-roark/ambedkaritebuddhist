/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.com',
      },
    ],
  },
};

// Make Cloudflare bindings (D1, KV, R2…) available during `next dev`.
// Reads wrangler.toml and emulates the D1 binding locally via miniflare.
if (process.env.NODE_ENV === 'development') {
  try {
    const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev');
    setupDevPlatform().catch(console.error);
  } catch {
    console.warn('[wrangler] @cloudflare/next-on-pages not found — run `pnpm install`');
  }
}

module.exports = nextConfig;
