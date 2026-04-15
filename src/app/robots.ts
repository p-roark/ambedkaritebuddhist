import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers()
  const host = headersList.get('host') || 'www.ambedkaritebuddhist.org'

  // Production domain: allow indexing
  if (host.includes('www.ambedkaritebuddhist.org')) {
    return {
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin', '/api'],
        },
      ],
      sitemap: 'https://www.ambedkaritebuddhist.org/sitemap.xml',
    }
  }

  // Preview/staging domain: disallow all crawlers to prevent indexing
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
  }
}
