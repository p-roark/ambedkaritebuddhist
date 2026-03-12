'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

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
  userRegistrationStatus?: string
  userPaymentStatus?: string
  isCoordinator?: boolean
  externalLink?: string | null
}

interface EventsPreviewProps {
  subtitle: string
  title: string
  description: string
  events: EventCard[]
}

type InfoData = {
  event: {
    title: string
    description: string
    date: string
    time: string
    location: string
    eventType: string
    status: string
    isPaid: boolean
    adultPrice: number
    childPrice: number
    externalLink: string | null
  }
  coordinators: Array<{ userId: string; userName: string; userEmail: string | null; userPhone: string | null }>
}

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export function EventsPreview({ subtitle, title, description, events }: EventsPreviewProps) {
  const { status } = useSession()
  const router = useRouter()

  const [infoEventId, setInfoEventId] = useState<string | null>(null)
  const [infoData, setInfoData] = useState<InfoData | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)

  const openInfoModal = async (eventId: string) => {
    setInfoEventId(eventId)
    setInfoData(null)
    setLoadingInfo(true)
    try {
      const res = await fetch(`/api/events?id=${eventId}`)
      if (res.ok) setInfoData((await res.json()) as InfoData)
    } catch { /* keep null */ }
    setLoadingInfo(false)
  }

  const handleRegisterClick = () => {
    if (status !== 'authenticated') {
      router.push('/auth/login?callbackUrl=/events')
      return
    }
    router.push('/events')
  }

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {events.map((event) => (
            <div
              key={event.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-background-light flex flex-col"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden flex-shrink-0">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold text-xs rounded-full shadow-sm">
                    {event.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-base font-bold text-text-dark mb-2.5 line-clamp-2 leading-snug">
                  {event.title}
                </h3>

                <div className="space-y-1 text-xs text-text-medium mb-3">
                  <p className="flex items-center gap-1.5"><span>📅</span><span>{event.date}</span></p>
                  <p className="flex items-center gap-1.5 line-clamp-1"><span>📍</span><span>{event.location}</span></p>
                </div>

                {/* Event status chip */}
                <div className="mb-4">
                  {event.externalLink ? (
                    <span className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-medium">External Event</span>
                  ) : event.status === 'past' ? (
                    <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full font-medium">Event Ended</span>
                  ) : (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      event.registrationStatus === 'open'
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {event.registrationStatus === 'open' ? 'Registration Open' :
                       event.registrationStatus === 'not-started' ? 'Registration Coming Soon' :
                       'Registration Closed'}
                    </span>
                  )}
                </div>

                {/* Footer: Info + Action */}
                <div className="mt-auto flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={() => openInfoModal(event.id)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 border-2 border-primary-blue text-primary-blue rounded-full hover:bg-primary-blue hover:text-white transition-all duration-200 flex-shrink-0"
                  >
                    <InfoIcon />Info
                  </button>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {event.externalLink ? (
                      <a
                        href={event.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-4 py-1.5 border-2 border-primary-blue text-primary-blue font-bold rounded-full hover:bg-primary-blue hover:text-white transition-all duration-200"
                      >
                        View Event →
                      </a>
                    ) : event.status === 'past' ? (
                      <Link
                        href={`/gallery?event=${event.id}`}
                        className="text-xs px-4 py-1.5 border-2 border-primary-blue text-primary-blue font-bold rounded-full hover:bg-primary-blue hover:text-white transition-all duration-200"
                      >
                        View Photos
                      </Link>
                    ) : event.isCoordinator ? (
                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className="text-xs px-3 py-1.5 border-2 border-primary-blue text-primary-blue font-bold rounded-full hover:bg-primary-blue hover:text-white transition-all duration-200"
                      >
                        Manage
                      </Link>
                    ) : event.userRegistrationStatus ? (
                      <>
                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                          event.userRegistrationStatus === 'Confirmed' ? 'bg-green-50 text-green-700 border border-green-200' :
                          event.userRegistrationStatus === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {event.userRegistrationStatus === 'Confirmed' ? 'Registration Confirmed' :
                           event.userRegistrationStatus === 'Pending Registration' ? 'Registration Pending' :
                           event.userRegistrationStatus}
                        </span>
                        {event.registrationStatus === 'open' && (
                          <Link
                            href="/events"
                            className="text-xs px-3 py-1.5 border-2 border-primary-blue text-primary-blue font-bold rounded-full hover:bg-primary-blue hover:text-white transition-all duration-200"
                          >
                            Edit Registration
                          </Link>
                        )}
                      </>
                    ) : event.registrationStatus === 'open' ? (
                      <button
                        onClick={handleRegisterClick}
                        className="text-xs px-4 py-1.5 border-2 border-primary-blue text-primary-blue font-bold rounded-full hover:bg-primary-blue hover:text-white transition-all duration-200"
                      >
                        Register
                      </button>
                    ) : event.registrationStatus === 'not-started' ? (
                      <button disabled className="text-xs px-4 py-1.5 border-2 border-gray-200 text-gray-400 font-medium rounded-full cursor-not-allowed">
                        Coming Soon
                      </button>
                    ) : (
                      <button disabled className="text-xs px-4 py-1.5 border-2 border-gray-200 text-gray-400 font-medium rounded-full cursor-not-allowed">
                        Registration Closed
                      </button>
                    )}
                  </div>
                </div>
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

      {/* Info Modal */}
      {infoEventId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-5 bg-gradient-to-r from-primary-blue to-accent-purple flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Event Details</h3>
              <button onClick={() => { setInfoEventId(null); setInfoData(null) }} className="text-white/80 hover:text-white text-2xl font-semibold leading-none">×</button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              {loadingInfo ? (
                <div className="text-center py-8 text-text-medium text-sm">Loading...</div>
              ) : infoData ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-text-dark mb-3">{infoData.event.title}</h2>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">{infoData.event.eventType}</span>
                      <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">{infoData.event.status}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-text-medium">
                    <p>📅 {infoData.event.date} · ⏰ {infoData.event.time}</p>
                    <p>📍 {infoData.event.location}</p>
                    {!infoData.event.externalLink && (
                      <p>💰 {infoData.event.isPaid
                        ? `$${infoData.event.adultPrice}/adult · $${infoData.event.childPrice}/child`
                        : 'Free event'}
                      </p>
                    )}
                  </div>
                  {infoData.event.description && (
                    <div className="border-t pt-5">
                      <p className="text-sm text-text-dark leading-relaxed whitespace-pre-line">{infoData.event.description}</p>
                    </div>
                  )}
                  {infoData.coordinators.length > 0 && (
                    <div className="border-t pt-5">
                      <p className="text-sm font-semibold text-text-dark mb-3">Event Coordinators</p>
                      <ul className="space-y-2">
                        {infoData.coordinators.map((c) => (
                          <li key={c.userId} className="text-sm text-text-medium space-y-0.5">
                            <p className="font-medium text-text-dark flex items-center gap-1.5"><span>👤</span>{c.userName}</p>
                            {c.userEmail && (
                              <p className="pl-6"><a href={`mailto:${c.userEmail}`} className="hover:underline text-primary-blue">{c.userEmail}</a></p>
                            )}
                            {c.userPhone && (
                              <p className="pl-6"><a href={`tel:${c.userPhone}`} className="hover:underline">{c.userPhone}</a></p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-red-500 text-sm">Unable to load event details.</div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end">
              <button onClick={() => { setInfoEventId(null); setInfoData(null) }} className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
