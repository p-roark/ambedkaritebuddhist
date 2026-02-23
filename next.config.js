/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export', // Commented out to enable API routes
  images: {
    // unoptimized: true, // Not needed without output: 'export'
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.com',
      },
    ],
  },
}

module.exports = nextConfig
