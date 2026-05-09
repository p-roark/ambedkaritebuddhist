import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | ABCC',
  description: 'Learn about the Ambedkarite Buddhist Community of Canada. Our mission, history, and vision for building community rooted in Dr. Ambedkar\'s ideals and Buddhist teachings.',
  openGraph: {
    title: 'About | ABCC',
    description: 'Learn about our mission, history, and community values',
    type: 'website',
    url: 'https://www.ambedkaritebuddhist.org/about',
    images: [{ url: 'https://www.ambedkaritebuddhist.org/images/logo.png', width: 1200, height: 630 }],
  },
  keywords: ['about ABCC', 'Ambedkarite Buddhist', 'Dr Ambedkar', 'community', 'Ontario', 'nonprofit'],
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
