'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type DbEvent = {
  id: string
  title: string
  date: string
  location: string
  description: string
  status: 'Upcoming' | 'Registration Started' | 'Event Ended'
  eventImages: string
}

type EventWithImages = {
  id: string
  title: string
  date: string
  location: string
  description: string
  status: DbEvent['status']
  imageKeys: string[]
}

function parseImageKeys(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map((key) => String(key).trim()).filter((key) => key.length > 0)
  } catch {
    return []
  }
}

function imageSrc(key: string) {
  return `/api/events/image?key=${encodeURIComponent(key)}`
}

function formatDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function GalleryContent() {
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<EventWithImages[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventWithImages | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const pageSize = 12

  useEffect(() => {
    const loadEventGalleries = async () => {
      try {
        const response = await fetch('/api/events', { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to load events')

        const data = (await response.json()) as { events: DbEvent[] }
        const eventsWithImages: EventWithImages[] = data.events
          .map((event) => ({
            id: event.id,
            title: event.title,
            date: formatDate(event.date),
            location: event.location,
            description: event.description || '',
            status: event.status,
            imageKeys: parseImageKeys(event.eventImages),
          }))
          .filter((event) => event.imageKeys.length > 0)

        setEvents(eventsWithImages)

        const eventId = searchParams.get('event')
        if (eventId && eventsWithImages.length > 0) {
          const targetEvent = eventsWithImages.find((e) => e.id === eventId)
          if (targetEvent) {
            setSelectedEvent(targetEvent)
            setPage(0)
          }
        }
      } catch (error) {
        console.error('Failed to load events gallery:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadEventGalleries()
  }, [searchParams])

  const pagedImages = useMemo(() => {
    if (!selectedEvent) return []
    const start = page * pageSize
    return selectedEvent.imageKeys.slice(start, start + pageSize)
  }, [selectedEvent, page])

  const totalPages = selectedEvent ? Math.max(1, Math.ceil(selectedEvent.imageKeys.length / pageSize)) : 1

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-text-medium">Loading gallery...</p>
        </div>
      </div>
    )
  }

  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-white">
        <section className="bg-gradient-to-br from-primary-blue via-accent-purple to-accent-orange py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => {
                setSelectedEvent(null)
                setPage(0)
              }}
              className="mb-6 text-white hover:text-primary-saffron transition-colors flex items-center gap-2 font-medium"
            >
              Back to Events
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{selectedEvent.title}</h1>
            <p className="text-white/90">{selectedEvent.date} | {selectedEvent.location}</p>
            <p className="text-white/90 mt-4">{selectedEvent.description}</p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {selectedEvent.imageKeys.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pagedImages.map((key, index) => (
                  <div
                    key={key}
                    className="relative h-64 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
                    onClick={() => setSelectedImage(imageSrc(key))}
                  >
                    <img
                      src={imageSrc(key)}
                      alt={`${selectedEvent.title} - Photo ${page * pageSize + index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-medium">No photos for this event yet</p>
            </div>
          )}
        </section>

        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl w-full max-h-screen" onClick={(e) => e.stopPropagation()}>
              <button
                className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-primary-saffron transition-colors z-10"
                onClick={() => setSelectedImage(null)}
              >
                X
              </button>
              <div className="relative h-96 md:h-[600px] rounded-lg overflow-hidden">
                <img
                  src={selectedImage}
                  alt="Gallery view"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-primary-blue via-accent-purple to-accent-orange py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Event Gallery</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Click on an event card to explore photos from our community events
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-text-medium">No events with photos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group hover:border-primary-saffron"
                onClick={() => {
                  setSelectedEvent(event)
                  setPage(0)
                }}
              >
                <div className="relative h-48 overflow-hidden bg-gray-200">
                  <img
                    src={imageSrc(event.imageKeys[0])}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute top-4 right-4 bg-primary-saffron text-text-dark px-3 py-1 rounded-full text-sm font-bold">
                    {event.imageKeys.length} photos
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-text-dark mb-3 group-hover:text-primary-saffron transition-colors">
                    {event.title}
                  </h3>

                  <div className="space-y-2 text-text-medium mb-4">
                    <div>{event.date}</div>
                    <div>{event.location}</div>
                  </div>

                  <p className="text-text-medium line-clamp-2">{event.description}</p>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="inline-block text-primary-saffron font-bold text-sm">
                      View Gallery
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
