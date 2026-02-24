'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface EventCard {
  id: string
  title: string
  date: string
  location: string
  attendees: string
  category: string
  description: string
  image: string
  imageKeys?: string[]
  status?: 'past' | 'upcoming'
  registrationFormUrl?: string
  registrationStatus?: 'open' | 'closed' | 'not-started'
}

interface EventsPreviewProps {
  subtitle: string
  title: string
  description: string
  events: EventCard[]
}

export function EventsPreview({
  subtitle,
  title,
  description,
  events,
}: EventsPreviewProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [thumbPageByEvent, setThumbPageByEvent] = useState<Record<string, number>>({})
  const selectedEvent = selectedEventId ? events.find((e) => e.id === selectedEventId) : null
  const pageSize = 4
  const toImageSrc = (key: string) => `/api/events/image?key=${encodeURIComponent(key)}`

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-24">
          <p className="text-sm md:text-base font-bold text-primary-saffron uppercase tracking-wider mb-4">
            {subtitle}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-base md:text-lg text-text-medium leading-relaxed">
            {description}
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {events.map((event) => (
            <div
              key={event.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-background-light"
            >
              {/* Image with Badge */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute top-4 right-4">
                  <span className="inline-block px-4 py-2 bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold text-sm rounded-full">
                    {event.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold text-text-dark mb-4">
                  {event.title}
                </h3>

                {/* Metadata */}
                <div className="space-y-2 mb-4 text-text-medium text-sm md:text-base">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span>{event.attendees}</span>
                  </div>
                </div>

                <p className="text-text-medium mb-6 leading-relaxed">
                  {event.description}
                </p>
                {event.imageKeys && event.imageKeys.length > 0 && (
                  <div className="mb-6">
                    {(() => {
                      const currentPage = thumbPageByEvent[event.id] ?? 0
                      const totalPages = Math.ceil(event.imageKeys!.length / pageSize)
                      const start = currentPage * pageSize
                      const slice = event.imageKeys!.slice(start, start + pageSize)
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            {slice.map((key) => (
                              <div key={key} className="relative h-20 rounded-md overflow-hidden bg-gray-100">
                                <Image src={toImageSrc(key)} alt={event.title} fill className="object-cover" sizes="120px" />
                              </div>
                            ))}
                          </div>
                          {totalPages > 1 && (
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <button
                                onClick={() => setThumbPageByEvent((prev) => ({ ...prev, [event.id]: Math.max(0, currentPage - 1) }))}
                                disabled={currentPage === 0}
                                className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40"
                              >
                                Prev
                              </button>
                              <span className="text-gray-500">Page {currentPage + 1} / {totalPages}</span>
                              <button
                                onClick={() => setThumbPageByEvent((prev) => ({ ...prev, [event.id]: Math.min(totalPages - 1, currentPage + 1) }))}
                                disabled={currentPage >= totalPages - 1}
                                className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40"
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}

                {event.status === 'past' ? (
                  <Link
                    href={`/gallery?event=${event.id}`}
                    className="inline-block px-6 py-3 border-2 border-primary-blue text-primary-blue font-bold rounded-full hover:bg-primary-blue hover:text-white transition-all duration-200"
                  >
                    View Photos
                  </Link>
                ) : event.registrationStatus === 'not-started' ? (
                  <button
                    disabled
                    className="inline-block px-6 py-3 bg-gray-300 text-gray-600 font-bold rounded-full cursor-not-allowed opacity-60"
                  >
                    Coming Soon
                  </button>
                ) : event.registrationStatus === 'closed' ? (
                  <button
                    disabled
                    className="inline-block px-6 py-3 bg-gray-300 text-gray-600 font-bold rounded-full cursor-not-allowed opacity-60"
                  >
                    Registration Closed
                  </button>
                ) : (
                  <div className="flex gap-3">
                    {event.registrationFormUrl ? (
                      <button
                        onClick={() => setSelectedEventId(event.id)}
                        className="px-6 py-3 bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-center cursor-pointer"
                      >
                        Register Now
                      </button>
                    ) : (
                      <Link
                        href="/events"
                        className="px-6 py-3 bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-center cursor-pointer"
                      >
                        Register Now
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center">
          <Link
            href="/events"
            className="inline-block px-8 py-3 border-2 border-primary-blue text-primary-blue font-bold rounded-full hover:bg-primary-blue hover:text-white transition-all duration-200"
          >
            View All Events
          </Link>
        </div>
      </div>

      {/* Registration Modal */}
      {selectedEvent && selectedEventId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-blue via-accent-purple to-accent-orange p-6 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                Register for {selectedEvent.title}
              </h2>
              <button
                onClick={() => setSelectedEventId(null)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {selectedEvent.registrationFormUrl ? (
                <iframe
                  src={selectedEvent.registrationFormUrl + (selectedEvent.registrationFormUrl.includes('?') ? '&embedded=true' : '?embedded=true')}
                  width="100%"
                  height="700"
                  frameBorder="0"
                  marginHeight={0}
                  marginWidth={0}
                  className="w-full"
                >
                  Loading…
                </iframe>
              ) : (
                <p className="text-text-medium text-center py-12">
                  Registration form not available
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
