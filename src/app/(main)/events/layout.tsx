import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Events | ABCC',
  description: 'Discover upcoming events from the Ambedkarite Buddhist Community of Canada. Register for gatherings, celebrations, and community meetings in Ontario and beyond.',
  openGraph: {
    title: 'Events | ABCC',
    description: 'Register for ABCC events and community gatherings',
    type: 'website',
    url: 'https://www.ambedkaritebuddhist.org/events',
    images: [{ url: 'https://www.ambedkaritebuddhist.org/images/logo.png', width: 1200, height: 630 }],
  },
  keywords: ['events', 'register', 'ABCC', 'community', 'gatherings', 'Buddhist', 'Ontario'],
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children
}
