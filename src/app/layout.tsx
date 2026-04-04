import type { Metadata } from 'next'
import { Poppins, Noto_Sans } from 'next/font/google'
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
    url: 'https://ambedkaritebuddhist.ca',
    title: 'Ambedkarite Buddhist Community Of Canada (ABCC) | Ontario',
    description: 'ABCC is a registered non-profit in Ontario for Ambedkarite Buddhist families. Practising the Dhamma, celebrating Dr. Ambedkar\'s legacy, and building community in Canada.',
    images: [{ url: 'https://via.placeholder.com/1200x630', width: 1200, height: 630 }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${notoSans.variable}`}>
      <body className="font-noto-sans antialiased">
        {children}
      </body>
    </html>
  )
}
