import { Suspense } from 'react'
import { GalleryContent } from './gallery-content'

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
