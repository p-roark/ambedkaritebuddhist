'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { normalizeImagePath } from '@/lib/image-path'

type EventStatus = 'Upcoming' | 'Registration Started' | 'Event Ended'

type EventItem = {
  id: string
  title: string
  description: string
  coverImage: string
  date: string
  time: string
  location: string
  eventType: string
  isPaid: boolean
  adultPrice: number
  childPrice: number
  eventImages: string
  status: EventStatus
}

type FamilyMember = {
  id: string
  name: string
  relationship: string
  age: number | null
}

type NonMemberGuest = {
  name: string
  age: number
}

function getRegistrationLabel(status: string) {
  if (status === 'Pending Registration') return 'Registration Pending'
  if (status === 'Confirmed') return 'Registration Confirmed'
  if (status === 'Rejected') return 'Registration Rejected'
  return status
}

export default function EventsPage() {
  const { status } = useSession()
  const [events, setEvents] = useState<EventItem[]>([])
  const [registrationByEvent, setRegistrationByEvent] = useState<Record<string, { registrationStatus: string; paymentStatus: string }>>({})
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [volunteering, setVolunteering] = useState(false)
  const [includeFamily, setIncludeFamily] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedFamilyMemberIds, setSelectedFamilyMemberIds] = useState<string[]>([])
  const [nonMemberGuests, setNonMemberGuests] = useState<NonMemberGuest[]>([])
  const [newGuestName, setNewGuestName] = useState('')
  const [newGuestAge, setNewGuestAge] = useState('')
  const [registering, setRegistering] = useState(false)
  const [message, setMessage] = useState('')
  const [thumbPageByEvent, setThumbPageByEvent] = useState<Record<string, number>>({})

  const PAGE_SIZE = 4
  const parseImageKeys = (raw: string) => {
    try {
      const parsed = JSON.parse(raw || '[]') as unknown
      if (!Array.isArray(parsed)) return [] as string[]
      return parsed.map((key) => String(key))
    } catch {
      return [] as string[]
    }
  }
  const imageSrc = (key: string) => `/api/events/image?key=${encodeURIComponent(key)}`

  const loadEvents = async () => {
    const res = await fetch('/api/events', { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load events')
    const data = (await res.json()) as {
      events: EventItem[]
      registrations: Array<{ eventId: string; registrationStatus: string; paymentStatus: string }>
    }
    setEvents(data.events)
    const statusMap: Record<string, { registrationStatus: string; paymentStatus: string }> = {}
    for (const reg of data.registrations || []) {
      statusMap[reg.eventId] = {
        registrationStatus: reg.registrationStatus,
        paymentStatus: reg.paymentStatus,
      }
    }
    setRegistrationByEvent(statusMap)
  }

  const loadFamilyMembers = async () => {
    if (status !== 'authenticated') {
      setFamilyMembers([])
      return
    }
    const res = await fetch('/api/profile/family', { cache: 'no-store' })
    if (!res.ok) return
    const data = (await res.json()) as { familyMembers: FamilyMember[] }
    setFamilyMembers(data.familyMembers ?? [])
  }

  useEffect(() => {
    const run = async () => {
      try {
        await loadEvents()
        await loadFamilyMembers()
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [status])

  const upcoming = useMemo(() => events.filter((e) => e.status !== 'Event Ended'), [events])
  const past = useMemo(() => events.filter((e) => e.status === 'Event Ended'), [events])

  const totalAmount = useMemo(() => {
    if (!selectedEvent || !selectedEvent.isPaid) return 0
    const selectedFamily = familyMembers.filter((member) => selectedFamilyMemberIds.includes(member.id))
    const familyAdults = selectedFamily.filter((member) => member.age == null || member.age >= 18).length
    const familyChildren = selectedFamily.filter((member) => member.age != null && member.age < 18).length
    const nonMemberAdults = nonMemberGuests.filter((guest) => guest.age >= 18).length
    const nonMemberChildren = nonMemberGuests.filter((guest) => guest.age < 18).length
    const adults = 1 + (includeFamily ? familyAdults + nonMemberAdults : 0)
    const children = includeFamily ? familyChildren + nonMemberChildren : 0
    return adults * selectedEvent.adultPrice + children * selectedEvent.childPrice
  }, [selectedEvent, includeFamily, familyMembers, selectedFamilyMemberIds, nonMemberGuests])

  const registerForEvent = async () => {
    if (!selectedEvent) return
    if (status !== 'authenticated') {
      setMessage('Please sign in to register.')
      return
    }

    setRegistering(true)
    setMessage('')
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteering,
          includeFamily,
          selectedFamilyMemberIds,
          nonMemberGuests,
        }),
      })
      const data = (await res.json()) as { error?: string; message?: string }
      if (!res.ok) {
        setMessage(data.error ?? 'Unable to register')
        return
      }
      setMessage(data.message ?? 'Pending Registration')
      setSelectedEvent(null)
      await loadEvents()
    } catch {
      setMessage('Unable to register. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-8">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {upcoming.map((event) => (
            <div
              key={event.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-background-light"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={normalizeImagePath(event.coverImage)}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute top-4 right-4">
                  <span className="inline-block px-4 py-2 bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold text-sm rounded-full">
                    {event.eventType}
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold text-text-dark mb-4">{event.title}</h3>
                <div className="space-y-2 mb-4 text-text-medium text-sm md:text-base">
                  <p>{event.date} {event.time}</p>
                  <p>{event.location}</p>
                  <p>{event.isPaid ? `Paid ($${event.adultPrice} adult / $${event.childPrice} child)` : 'Free'}</p>
                </div>
                <p className="text-text-medium mb-4 leading-relaxed">
                  {event.description || 'Join our community for this event.'}
                </p>
                {(() => {
                  const keys = parseImageKeys(event.eventImages)
                  if (keys.length === 0) return null
                  const currentPage = thumbPageByEvent[event.id] ?? 0
                  const totalPages = Math.ceil(keys.length / PAGE_SIZE)
                  const start = currentPage * PAGE_SIZE
                  const slice = keys.slice(start, start + PAGE_SIZE)
                  return (
                    <div className="mb-4">
                      <div className="grid grid-cols-2 gap-2">
                        {slice.map((key) => (
                          <div key={key} className="relative h-20 rounded-md overflow-hidden bg-gray-100">
                            <Image src={imageSrc(key)} alt={event.title} fill className="object-cover" sizes="120px" />
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
                    </div>
                  )
                })()}
                <p className="text-sm font-medium mb-6">{event.status}</p>

                {registrationByEvent[event.id] ? (
                  <button
                    disabled
                    className="inline-block px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded-full cursor-not-allowed"
                  >
                    {getRegistrationLabel(registrationByEvent[event.id].registrationStatus)}
                  </button>
                ) : event.status === 'Registration Started' ? (
                  <button
                    onClick={() => {
                      setSelectedEvent(event)
                      setMessage('')
                      setVolunteering(false)
                      setIncludeFamily(false)
                      setSelectedFamilyMemberIds([])
                      setNonMemberGuests([])
                      setNewGuestName('')
                      setNewGuestAge('')
                    }}
                    className="inline-block px-6 py-3 bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                  >
                    Register Now
                  </button>
                ) : (
                  <button disabled className="inline-block px-6 py-3 bg-gray-300 text-gray-600 font-bold rounded-full cursor-not-allowed opacity-60">
                    {event.status === 'Upcoming' ? 'Coming Soon' : 'Registration Closed'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {past.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-gray-200">
          <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-8">Past Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {past.map((event) => (
              (() => {
                const keys = parseImageKeys(event.eventImages)
                const currentPage = thumbPageByEvent[event.id] ?? 0
                const totalPages = Math.ceil(Math.max(1, keys.length) / PAGE_SIZE)
                const start = currentPage * PAGE_SIZE
                const slice = keys.slice(start, start + PAGE_SIZE)
                const hasGallery = keys.length > 0

                const card = (
                  <div className={`group bg-white rounded-2xl overflow-hidden shadow-sm border border-background-light opacity-90 ${hasGallery ? 'hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer' : ''}`}>
                    <div className="relative h-64 overflow-hidden">
                      <Image
                        src={normalizeImagePath(event.coverImage)}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    <div className="p-6 md:p-8">
                      <h3 className="text-xl md:text-2xl font-bold text-text-dark mb-3">{event.title}</h3>
                      <p className="text-sm text-text-medium">{event.date} {event.time}</p>
                      <p className="text-sm text-text-medium">{event.location}</p>
                      {slice.length > 0 && (
                        <div className="mt-3">
                          <div className="grid grid-cols-2 gap-2">
                            {slice.map((key) => (
                              <div key={key} className="relative h-20 rounded-md overflow-hidden bg-gray-100">
                                <Image src={imageSrc(key)} alt={event.title} fill className="object-cover" sizes="120px" />
                              </div>
                            ))}
                          </div>
                          {totalPages > 1 && (
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  setThumbPageByEvent((prev) => ({ ...prev, [event.id]: Math.max(0, currentPage - 1) }))
                                }}
                                disabled={currentPage === 0}
                                className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40"
                              >
                                Prev
                              </button>
                              <span className="text-gray-500">Page {currentPage + 1} / {totalPages}</span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  setThumbPageByEvent((prev) => ({ ...prev, [event.id]: Math.min(totalPages - 1, currentPage + 1) }))
                                }}
                                disabled={currentPage >= totalPages - 1}
                                className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40"
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {hasGallery && (
                        <p className="mt-3 text-sm font-semibold text-primary-blue">View Gallery</p>
                      )}
                    </div>
                  </div>
                )

                if (hasGallery) {
                  return (
                    <Link key={event.id} href={`/gallery?event=${event.id}`}>
                      {card}
                    </Link>
                  )
                }

                return <div key={event.id}>{card}</div>
              })()
            ))}
          </div>
        </section>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-primary-blue to-accent-purple flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Register: {selectedEvent.title}</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-white/90 hover:text-white text-xl font-semibold">X</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-sm text-blue-800 font-medium">You are already counted as 1 adult attendee.</p>
                <p className="text-xs text-blue-700 mt-1">Set only additional family members here.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm rounded-md border border-slate-200 px-3 py-2">
                  <input type="checkbox" checked={volunteering} onChange={(e) => setVolunteering(e.target.checked)} />
                  Volunteering
                </label>
                <label className="flex items-center gap-2 text-sm rounded-md border border-slate-200 px-3 py-2">
                  <input type="checkbox" checked={includeFamily} onChange={(e) => setIncludeFamily(e.target.checked)} />
                  Add Family Members
                </label>
              </div>

              {includeFamily && (
                <div className="space-y-4">
                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-800 mb-2">Select Family Members</p>
                    {familyMembers.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No family members in profile. Add them from Profile settings.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {familyMembers.map((member) => (
                          <label key={member.id} className="flex items-center gap-2 text-sm rounded border border-slate-200 px-2 py-1.5">
                            <input
                              type="checkbox"
                              checked={selectedFamilyMemberIds.includes(member.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFamilyMemberIds((prev) => [...prev, member.id])
                                } else {
                                  setSelectedFamilyMemberIds((prev) => prev.filter((id) => id !== member.id))
                                }
                              }}
                            />
                            <span>{member.name} ({member.relationship}{member.age != null ? `, ${member.age}` : ''})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm text-slate-700">
                      <span className="mb-1 block font-medium">Guest Name</span>
                      <input
                        type="text"
                        value={newGuestName}
                        onChange={(e) => setNewGuestName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </label>
                    <label className="text-sm text-slate-700">
                      <span className="mb-1 block font-medium">Guest Age</span>
                      <input
                        type="number"
                        min={0}
                        value={newGuestAge}
                        onChange={(e) => setNewGuestAge(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const name = newGuestName.trim()
                        const age = Number(newGuestAge)
                        if (!name || !Number.isFinite(age) || age < 0) return
                        setNonMemberGuests((prev) => [...prev, { name, age }])
                        setNewGuestName('')
                        setNewGuestAge('')
                      }}
                      className="col-span-2 px-3 py-2 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Add Non-member Guest
                    </button>
                    {nonMemberGuests.length > 0 && (
                      <div className="col-span-2 space-y-2">
                        {nonMemberGuests.map((guest, idx) => (
                          <div key={`${guest.name}-${idx}`} className="flex items-center justify-between text-sm border border-slate-200 rounded-md px-3 py-2">
                            <span>{guest.name} ({guest.age})</span>
                            <button
                              type="button"
                              onClick={() => setNonMemberGuests((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-700">Total: <span className="font-semibold text-slate-900">${totalAmount}</span></p>
              </div>
              {message && <p className="text-sm text-blue-700">{message}</p>}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setSelectedEvent(null)} className="px-4 py-2 text-sm border rounded-md">Close</button>
              <button
                onClick={registerForEvent}
                disabled={registering}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {registering ? 'Submitting...' : 'Submit Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
