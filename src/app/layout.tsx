import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Poppins, Noto_Sans } from 'next/font/google'
import AuthSessionProvider from '@/components/providers/session-provider'
import { generateOrganizationSchema, generateLocalBusinessSchema } from '@/lib/schema'
import '@/styles/variables.css'
import '@/styles/globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  icons: { icon: '/icon.svg', shortcut: '/icon.svg' },
  title: 'Ambedkarite Buddhist Community Of Canada (ABCC) | Ontario',
  description: 'ABCC is a registered non-profit in Ontario for Ambedkarite Buddhist families. Practising the Dhamma, celebrating Dr. Ambedkar\'s legacy, and building community in Canada.',
  keywords: ['Ambedkarite Buddhist Canada', 'Ambedkarite Buddhist community Ontario', 'Navayana Buddhist Canada', 'Dr Ambedkar Canada', 'Buddhist community Toronto', 'Vesak celebration Canada'],
  authors: [{ name: 'ABCC' }],
  openGraph: {
    type: 'website',
    url: 'https://www.ambedkaritebuddhist.org',
    title: 'Ambedkarite Buddhist Community Of Canada (ABCC) | Ontario',
    description: 'ABCC is a registered non-profit in Ontario for Ambedkarite Buddhist families. Practising the Dhamma, celebrating Dr. Ambedkar\'s legacy, and building community in Canada.',
    images: [
      {
        url: 'https://www.ambedkaritebuddhist.org/images/logo.png',
        width: 1200,
        height: 630,
        alt: 'Ambedkarite Buddhist Community of Canada',
      },
    ],
  },
  other: {
    'application/ld+json': JSON.stringify(generateOrganizationSchema('https://www.ambedkaritebuddhist.org')),
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = generateOrganizationSchema('https://www.ambedkaritebuddhist.org')
  const localBusinessSchema = generateLocalBusinessSchema('https://www.ambedkaritebuddhist.org')

  // Get the request host to determine if this is production or preview
  const headersList = await headers()
  const host = headersList.get('host') || 'www.ambedkaritebuddhist.org'
  const isProduction = host.includes('www.ambedkaritebuddhist.org')

  // Canonical URL should always point to production for preview domain
  const canonicalUrl = isProduction
    ? undefined // Use default (current URL)
    : 'https://www.ambedkaritebuddhist.org'

  return (
    <html lang="en" className={`${poppins.variable} ${notoSans.variable}`}>
      <head>
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        {!isProduction && <meta name="robots" content="noindex, nofollow" />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body className="font-noto-sans antialiased">
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}
