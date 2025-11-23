'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface EventData {
  pastEvents: Array<{ id: string; title: string; date: string; location: string; attendees: string; category: string; description: string; image: string; status: 'past' }>
  upcomingEvents: Array<{ id: string; title: string; date: string; location: string; attendees: string; category: string; description: string; image: string; registrationFormUrl: string; registrationStatus: 'open' | 'closed' | 'not-started'; status: 'upcoming' }>
}

export default function EventsPage() {
  const [data, setData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const selectedEvent = selectedEventId ? data?.upcomingEvents.find((e) => e.id === selectedEventId) : null

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('/data/events.json')
        const eventsData: EventData = await response.json()
        setData(eventsData)
      } catch (error) {
        console.error('Failed to load events:', error)
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><p className="text-lg text-text-medium">Loading events...</p></div>
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-primary-blue via-accent-purple to-accent-orange py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Events</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">Join our community events and celebrations</p>
        </div>
      </section>

      {data?.upcomingEvents && data.upcomingEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4">Upcoming Events</h2>
            <p className="text-text-medium text-lg">Don&apos;t miss our upcoming events!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data.upcomingEvents.map((event) => (
              <div key={event.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-background-light">
                <div className="relative h-64 overflow-hidden">
                  <Image src={event.image} alt={event.title} fill className="object-cover group-hover:scale-110 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 50vw" />
                  <div className="absolute top-4 right-4">
                    <span className="inline-block px-4 py-2 bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold text-sm rounded-full">{event.category}</span>
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold text-text-dark mb-4">{event.title}</h3>
                  <div className="space-y-2 mb-4 text-text-medium text-sm md:text-base">
                    <div className="flex items-center gap-2"><span>📅</span><span>{event.date}</span></div>
                    <div className="flex items-center gap-2"><span>📍</span><span>{event.location}</span></div>
                    <div className="flex items-center gap-2"><span>👥</span><span>{event.attendees}</span></div>
                  </div>
                  <p className="text-text-medium mb-6 leading-relaxed">{event.description}</p>
                  {event.registrationStatus === 'not-started' ? (
                    <button disabled className="inline-block px-6 py-3 bg-gray-300 text-gray-600 font-bold rounded-full cursor-not-allowed opacity-60">
                      Coming Soon
                    </button>
                  ) : event.registrationStatus === 'closed' ? (
                    <button disabled className="inline-block px-6 py-3 bg-gray-300 text-gray-600 font-bold rounded-full cursor-not-allowed opacity-60">
                      Registration Closed
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedEventId(event.id)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-center cursor-pointer"
                      >
                        Register Now
                      </button>
                      <Link
                        href="/contact?type=volunteer"
                        className="flex-1 inline-block px-6 py-3 border-2 border-primary-blue text-primary-blue font-bold rounded-full hover:bg-primary-blue hover:text-white transition-all duration-200 text-center"
                      >
                        Volunteer
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data?.pastEvents && data.pastEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-gray-200">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4">Past Events</h2>
            <p className="text-text-medium text-lg">Explore photos and memories from our past events</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data.pastEvents.map((event) => (
              <div key={event.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-background-light opacity-90">
                <div className="relative h-64 overflow-hidden">
                  <Image src={event.image} alt={event.title} fill className="object-cover group-hover:scale-110 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 50vw" />
                  <div className="absolute top-4 right-4">
                    <span className="inline-block px-4 py-2 bg-gray-600 text-white font-bold text-sm rounded-full">{event.category}</span>
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold text-text-dark mb-4">{event.title}</h3>
                  <div className="space-y-2 mb-4 text-text-medium text-sm md:text-base">
                    <div className="flex items-center gap-2"><span>📅</span><span>{event.date}</span></div>
                    <div className="flex items-center gap-2"><span>📍</span><span>{event.location}</span></div>
                    <div className="flex items-center gap-2"><span>👥</span><span>{event.attendees}</span></div>
                  </div>
                  <p className="text-text-medium mb-6 leading-relaxed">{event.description}</p>
                  <Link href={`/gallery?event=${event.id}`} className="inline-block px-6 py-3 border-2 border-primary-blue text-primary-blue font-bold rounded-full hover:bg-primary-blue hover:text-white transition-all duration-200">View Photos</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(!data || (data.upcomingEvents.length === 0 && data.pastEvents.length === 0)) && !loading && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <p className="text-lg text-text-medium">No events found. Please check back soon!</p>
          </div>
        </section>
      )}

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
    </div>
  )
}
