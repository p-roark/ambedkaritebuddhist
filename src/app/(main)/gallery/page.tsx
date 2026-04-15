import { Metadata } from 'next'
import { Suspense } from 'react'
import { GalleryContent } from './gallery-content'

export const metadata: Metadata = {
  title: 'Gallery | ABCC',
  description: 'Browse photos and memories from Ambedkarite Buddhist Community of Canada events, gatherings, and celebrations. View our community in action.',
  openGraph: {
    title: 'Gallery | ABCC',
    description: 'Browse photos from ABCC events and gatherings',
    type: 'website',
    url: 'https://www.ambedkaritebuddhist.org/gallery',
    images: [{ url: '/images/logo.png', width: 1200, height: 630 }],
  },
  keywords: ['gallery', 'photos', 'events', 'ABCC', 'community', 'memories'],
}

function GalleryFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg text-text-medium">Loading gallery...</p>
      </div>
    </div>
  )
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<GalleryFallback />}>
      <GalleryContent />
    </Suspense>
  )
}
