'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getEventImages } from '@/lib/event-images'

interface EventData {
  pastEvents: Array<{
    id: string
    title: string
    date: string
    location: string
    description: string
  }>
  upcomingEvents: Array<{
    id: string
    title: string
    date: string
    location: string
    description: string
  }>
}

interface EventWithImages {
  id: string
  title: string
  date: string
  location: string
  description: string
  images: string[]
}

export default function GalleryPage() {
  const [events, setEvents] = useState<EventWithImages[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventWithImages | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEventGalleries = async () => {
      try {
        const response = await fetch('/data/events.json')
        const data: EventData = await response.json()

        // Combine past and upcoming events
        const allEvents = [...data.pastEvents, ...data.upcomingEvents]

        // Load images for each event
        const eventsWithImages = await Promise.all(
          allEvents.map(async (event) => ({
            ...event,
            images: await getEventImages(event.id),
          }))
        )

        setEvents(eventsWithImages)
      } catch (error) {
        console.error('Failed to load events gallery:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEventGalleries()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-text-medium">Loading gallery...</p>
        </div>
      </div>
    )
  }

  // If an event is selected, show the images gallery
  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <section className="bg-gradient-to-br from-primary-blue via-accent-purple to-accent-orange py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSelectedEvent(null)}
              className="mb-6 text-white hover:text-primary-saffron transition-colors flex items-center gap-2 font-medium"
            >
              ← Back to Events
            </button>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{selectedEvent.title}</h1>
            <div className="flex flex-wrap gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <span>{selectedEvent.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <span>{selectedEvent.location}</span>
              </div>
            </div>
            <p className="text-white/90 mt-4">{selectedEvent.description}</p>
          </div>
        </section>

        {/* Images Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {selectedEvent.images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedEvent.images.map((image, index) => (
                <div
                  key={index}
                  className="relative h-64 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
                  onClick={() => setSelectedImage(image)}
                >
                  <Image
                    src={image}
                    alt={`${selectedEvent.title} - Photo ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-medium">No photos for this event yet</p>
            </div>
          )}
        </section>

        {/* Lightbox Modal */}
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
                ✕
              </button>
              <div className="relative h-96 md:h-[600px] rounded-lg overflow-hidden">
                <Image
                  src={selectedImage}
                  alt="Gallery view"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Default: Show event cards
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-blue via-accent-purple to-accent-orange py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Event Gallery</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Click on an event card to explore photos from our community events
          </p>
        </div>
      </section>

      {/* Event Cards */}
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
                onClick={() => setSelectedEvent(event)}
              >
                {/* Event Image Thumbnail */}
                {event.images.length > 0 && (
                  <div className="relative h-48 overflow-hidden bg-gray-200">
                    <Image
                      src={event.images[0]}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    <div className="absolute top-4 right-4 bg-primary-saffron text-text-dark px-3 py-1 rounded-full text-sm font-bold">
                      {event.images.length} photos
                    </div>
                  </div>
                )}

                {/* Event Details */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-text-dark mb-3 group-hover:text-primary-saffron transition-colors">
                    {event.title}
                  </h3>

                  <div className="space-y-2 text-text-medium mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📅</span>
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <p className="text-text-medium line-clamp-2">{event.description}</p>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="inline-block text-primary-saffron font-bold text-sm">
                      View Gallery →
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
