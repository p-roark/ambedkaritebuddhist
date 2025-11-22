import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import '@/styles/variables.css'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Ambedkarite Buddhist Community - Canada',
  description: 'Welcome to the Ambedkarite Buddhist Community in Canada. Fostering unity, education, and social welfare based on the teachings of Dr. B.R. Ambedkar.',
  keywords: ['Ambedkar', 'Buddhism', 'Community', 'Canada', 'Social Welfare', 'Education'],
  authors: [{ name: 'ABC Canada' }],
  openGraph: {
    type: 'website',
    url: 'https://ambedkaritebuddhist.ca',
    title: 'Ambedkarite Buddhist Community - Canada',
    description: 'Fostering unity, education, and social welfare',
    images: [
      {
        url: 'https://via.placeholder.com/1200x630',
        width: 1200,
        height: 630,
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-white text-text-dark antialiased">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
