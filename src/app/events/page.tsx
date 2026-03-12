'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  maxAttendees: number | null
  externalLink: string | null
  paymentInstructions: string | null
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

type InfoData = {
  event: EventItem
  coordinators: Array<{ userId: string; userName: string; userEmail: string | null; userPhone: string | null }>
}

type FullRegistration = {
  volunteering: boolean
  includeFamily: boolean
  selectedFamilyMemberIds: string
  nonMemberGuestDetails: string
  totalAmount: number
  refundDue: number
  paymentStatus: string
}


function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export default function EventsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<EventItem[]>([])
  const [registrationByEvent, setRegistrationByEvent] = useState<Record<string, { registrationStatus: string; paymentStatus: string }>>({})
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({})
  const [coordinatedEventIds, setCoordinatedEventIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Registration modal state
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [volunteering, setVolunteering] = useState(false)
  const [includeFamily, setIncludeFamily] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedFamilyMemberIds, setSelectedFamilyMemberIds] = useState<string[]>([])
  const [nonMemberGuests, setNonMemberGuests] = useState<NonMemberGuest[]>([])
  const [newGuestName, setNewGuestName] = useState('')
  const [newGuestAge, setNewGuestAge] = useState('')
  const [registering, setRegistering] = useState(false)
  const [message, setMessage] = useState('')
  // Existing payment info when editing a confirmed registration
  const [existingPaidAmount, setExistingPaidAmount] = useState(0)

  // Info modal state
  const [infoEventId, setInfoEventId] = useState<string | null>(null)
  const [infoData, setInfoData] = useState<InfoData | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)

  const loadEvents = async () => {
    const res = await fetch('/api/events', { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load events')
    const data = (await res.json()) as {
      events: EventItem[]
      registrations: Array<{ eventId: string; registrationStatus: string; paymentStatus: string }>
      registrationCounts?: Record<string, number>
      coordinatedEventIds?: string[]
    }
    setEvents(data.events)
    setRegistrationCounts(data.registrationCounts ?? {})
    setCoordinatedEventIds(data.coordinatedEventIds ?? [])
    const statusMap: Record<string, { registrationStatus: string; paymentStatus: string }> = {}
    for (const reg of data.registrations || []) {
      statusMap[reg.eventId] = { registrationStatus: reg.registrationStatus, paymentStatus: reg.paymentStatus }
    }
    setRegistrationByEvent(statusMap)
  }

  const loadFamilyMembers = async () => {
    if (status !== 'authenticated') { setFamilyMembers([]); return }
    const res = await fetch('/api/profile/family', { cache: 'no-store' })
    if (!res.ok) return
    const data = (await res.json()) as { familyMembers: FamilyMember[] }
    setFamilyMembers(data.familyMembers ?? [])
  }

  useEffect(() => {
    const run = async () => {
      try { await loadEvents(); await loadFamilyMembers() }
      catch (error) { console.error(error) }
      finally { setLoading(false) }
    }
    void run()
  }, [status])

  const upcoming = useMemo(() => events.filter((e) => e.status !== 'Event Ended'), [events])
  const past = useMemo(() => events.filter((e) => e.status === 'Event Ended'), [events])

  const totalAmount = useMemo(() => {
    if (!selectedEvent || !selectedEvent.isPaid) return 0
    const sel = familyMembers.filter((m) => selectedFamilyMemberIds.includes(m.id))
    const fAdults = sel.filter((m) => m.age == null || m.age >= 18).length
    const fChildren = sel.filter((m) => m.age != null && m.age < 18).length
    const gAdults = nonMemberGuests.filter((g) => g.age >= 18).length
    const gChildren = nonMemberGuests.filter((g) => g.age < 18).length
    const adults = 1 + (includeFamily ? fAdults + gAdults : 0)
    const children = includeFamily ? fChildren + gChildren : 0
    return adults * selectedEvent.adultPrice + children * selectedEvent.childPrice
  }, [selectedEvent, includeFamily, familyMembers, selectedFamilyMemberIds, nonMemberGuests])

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

  const openRegisterModal = (event: EventItem) => {
    if (status !== 'authenticated') { router.push('/auth/login?callbackUrl=/events'); return }
    setSelectedEvent(event)
    setIsEditMode(false)
    setMessage('')
    setVolunteering(false)
    setIncludeFamily(false)
    setSelectedFamilyMemberIds([])
    setNonMemberGuests([])
    setNewGuestName('')
    setNewGuestAge('')
  }

  const openEditModal = async (event: EventItem) => {
    if (status !== 'authenticated') { router.push('/auth/login?callbackUrl=/events'); return }
    setSelectedEvent(event)
    setIsEditMode(true)
    setMessage('')
    setVolunteering(false)
    setIncludeFamily(false)
    setSelectedFamilyMemberIds([])
    setNonMemberGuests([])
    setNewGuestName('')
    setNewGuestAge('')
    setExistingPaidAmount(0)
    try {
      const res = await fetch(`/api/events/${event.id}/register`)
      if (res.ok) {
        const data = (await res.json()) as { registration: FullRegistration | null }
        if (data.registration) {
          setVolunteering(data.registration.volunteering)
          setIncludeFamily(data.registration.includeFamily)
          try { setSelectedFamilyMemberIds(JSON.parse(data.registration.selectedFamilyMemberIds || '[]') as string[]) } catch { /* keep empty */ }
          try {
            const guests = JSON.parse(data.registration.nonMemberGuestDetails || '[]') as NonMemberGuest[]
            setNonMemberGuests(Array.isArray(guests) ? guests : [])
          } catch { /* keep empty */ }
          if (data.registration.paymentStatus === 'Paid') {
            setExistingPaidAmount(Number(data.registration.totalAmount) + Number(data.registration.refundDue ?? 0))
          }
        }
      }
    } catch { /* keep defaults */ }
  }

  const closeModal = () => { setSelectedEvent(null); setIsEditMode(false) }

  const registerForEvent = async () => {
    if (!selectedEvent) return
    setRegistering(true)
    setMessage('')
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteering, includeFamily, selectedFamilyMemberIds, nonMemberGuests }),
      })
      const data = (await res.json()) as { error?: string; message?: string }
      if (!res.ok) { setMessage(data.error ?? 'Unable to register'); return }
      setMessage(isEditMode ? 'Registration updated.' : (data.message ?? 'Pending Registration'))
      closeModal()
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

      {/* Upcoming Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-text-dark mb-8">Upcoming Events</h2>
        {upcoming.length === 0 && (
          <p className="text-text-medium">No upcoming events at this time. Check back soon.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcoming.map((event) => {
            const reg = registrationByEvent[event.id]
            const isCoordinator = coordinatedEventIds.includes(event.id)
            return (
              <div key={event.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-background-light flex flex-col">
                {/* Image */}
                <div className="relative h-48 overflow-hidden flex-shrink-0">
                  <Image
                    src={normalizeImagePath(event.coverImage)}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold text-xs rounded-full shadow-sm">
                      {event.eventType}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-bold text-text-dark mb-2.5 line-clamp-2 leading-snug">{event.title}</h3>

                  <div className="space-y-1 text-xs text-text-medium mb-3">
                    <p className="flex items-center gap-1.5"><span>📅</span><span>{event.date} · {event.time}</span></p>
                    <p className="flex items-center gap-1.5 line-clamp-1"><span>📍</span><span>{event.location}</span></p>
                  </div>

                  {/* Price + event status (not shown for external events) */}
                  {!event.externalLink && (
                    <div className="mb-4 flex items-center gap-2 flex-wrap">
                      {event.isPaid ? (
                        <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-medium">
                          ${event.adultPrice}/adult · ${event.childPrice}/child
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full font-medium">Free</span>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        event.status === 'Registration Started'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {event.status === 'Registration Started' ? 'Registration Open' : 'Registration Coming Soon'}
                      </span>
                      {event.maxAttendees != null && (() => {
                        const count = registrationCounts[event.id] ?? 0
                        const remaining = event.maxAttendees - count
                        return remaining > 0 ? (
                          <span className="text-xs px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-full">
                            {remaining} spot{remaining !== 1 ? 's' : ''} left
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full font-medium">
                            Full
                          </span>
                        )
                      })()}
                    </div>
                  )}
                  {event.externalLink && (
                    <div className="mb-4">
                      <span className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-medium">External Event</span>
                    </div>
                  )}

                  {/* Footer: Info + Actions */}
                  <div className="mt-auto flex items-center justify-between gap-2 flex-wrap">
                    <button
                      onClick={() => openInfoModal(event.id)}
                      className="flex items-center gap-1.5 text-xs text-text-medium hover:text-primary-blue transition-colors border border-gray-200 hover:border-primary-blue rounded-full px-3 py-1.5"
                    >
                      <InfoIcon />Info
                    </button>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {event.externalLink ? (
                        <a
                          href={event.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-4 py-1.5 bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold rounded-full hover:shadow-md transition-all"
                        >
                          View Event →
                        </a>
                      ) : isCoordinator ? (
                        <Link href={`/dashboard/events/${event.id}`} className="text-xs px-3 py-1.5 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-colors font-medium">
                          Manage
                        </Link>
                      ) : reg ? (
                        <>
                          <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                            reg.registrationStatus === 'Confirmed' ? 'bg-green-50 text-green-700' :
                            reg.registrationStatus === 'Rejected' ? 'bg-red-50 text-red-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {reg.registrationStatus === 'Confirmed' ? 'Registration Confirmed' :
                             reg.registrationStatus === 'Pending Registration' ? 'Registration Pending' :
                             reg.registrationStatus}
                          </span>
                          {event.status === 'Registration Started' && (
                            <button onClick={() => openEditModal(event)} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full hover:bg-blue-100 transition-colors font-medium">
                              Edit Registration
                            </button>
                          )}
                        </>
                      ) : event.status === 'Registration Started' ? (
                        <button onClick={() => openRegisterModal(event)} className="text-xs px-4 py-1.5 bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold rounded-full hover:shadow-md transition-all">
                          Register
                        </button>
                      ) : (
                        <button disabled className="text-xs px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full cursor-not-allowed font-medium">
                          Coming Soon
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Past Events */}
      {past.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-100">
          <h2 className="text-3xl font-bold text-text-dark mb-8">Past Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {past.map((event) => {
              const hasGallery = (() => {
                try {
                  const parsed = JSON.parse(event.eventImages || '[]') as unknown
                  return Array.isArray(parsed) && parsed.length > 0
                } catch { return false }
              })()
              const card = (
                <div className={`group bg-white rounded-2xl overflow-hidden shadow-sm border border-background-light opacity-90 flex flex-col ${hasGallery ? 'hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer' : ''}`}>
                  <div className="relative h-44 overflow-hidden flex-shrink-0">
                    <Image src={normalizeImagePath(event.coverImage)} alt={event.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-text-dark mb-1.5 line-clamp-2">{event.title}</h3>
                    <p className="text-xs text-text-medium">{event.date} · {event.location}</p>
                    {hasGallery && <p className="mt-2 text-xs font-semibold text-primary-blue">View Gallery →</p>}
                  </div>
                </div>
              )
              if (hasGallery) return <Link key={event.id} href={`/gallery?event=${event.id}`}>{card}</Link>
              return <div key={event.id}>{card}</div>
            })}
          </div>
        </section>
      )}

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
                      <p>💰 {infoData.event.isPaid ? `$${infoData.event.adultPrice}/adult · $${infoData.event.childPrice}/child` : 'Free event'}</p>
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

      {/* Registration / Edit Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-5 bg-gradient-to-r from-primary-blue to-accent-purple flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{isEditMode ? 'Edit Registration: ' : 'Register: '}{selectedEvent.title}</h3>
              <button onClick={closeModal} className="text-white/90 hover:text-white text-2xl font-semibold leading-none">×</button>
            </div>

            <div className="p-8 space-y-5 overflow-y-auto flex-1">
              {isEditMode && existingPaidAmount > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
                  <p className="text-sm text-amber-800 font-medium">You have a confirmed registration</p>
                  <p className="text-xs text-amber-700">
                    Amount paid: <strong>${existingPaidAmount}</strong>.
                    {totalAmount < existingPaidAmount && ` Reducing attendees will generate a refund of $${existingPaidAmount - totalAmount} — your registration stays confirmed.`}
                    {totalAmount > existingPaidAmount && ` Increasing attendees requires an additional $${totalAmount - existingPaidAmount} payment — status will reset to Pending.`}
                  </p>
                </div>
              ) : isEditMode ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm text-amber-800 font-medium">Editing your registration</p>
                  <p className="text-xs text-amber-700 mt-1">If your total changes, payment status will reset to Unpaid and require re-confirmation by an admin.</p>
                </div>
              ) : null}

              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-sm text-blue-800 font-medium">You are already counted as 1 adult attendee.</p>
                <p className="text-xs text-blue-700 mt-1">Add additional family members or guests below.</p>
              </div>

              {selectedEvent.isPaid && selectedEvent.paymentInstructions && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm text-amber-800 font-semibold mb-1">💳 Payment Instructions</p>
                  <p className="text-sm text-amber-900 whitespace-pre-line">{selectedEvent.paymentInstructions}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm rounded-md border border-slate-200 px-3 py-2">
                  <input type="checkbox" checked={volunteering} onChange={(e) => setVolunteering(e.target.checked)} />Volunteering
                </label>
                <label className="flex items-center gap-2 text-sm rounded-md border border-slate-200 px-3 py-2">
                  <input type="checkbox" checked={includeFamily} onChange={(e) => setIncludeFamily(e.target.checked)} />Add Family Members
                </label>
              </div>

              {includeFamily && (
                <div className="space-y-4">
                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-800 mb-2">Select Family Members</p>
                    {familyMembers.length === 0 ? (
                      <p className="text-xs text-slate-500">No family members in profile. Add them from Profile settings.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {familyMembers.map((member) => (
                          <label key={member.id} className="flex items-center gap-2 text-sm rounded border border-slate-200 px-2 py-1.5">
                            <input
                              type="checkbox"
                              checked={selectedFamilyMemberIds.includes(member.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedFamilyMemberIds((prev) => [...prev, member.id])
                                else setSelectedFamilyMemberIds((prev) => prev.filter((id) => id !== member.id))
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
                      <input type="text" value={newGuestName} onChange={(e) => setNewGuestName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                    </label>
                    <label className="text-sm text-slate-700">
                      <span className="mb-1 block font-medium">Guest Age</span>
                      <input type="number" min={0} value={newGuestAge} onChange={(e) => setNewGuestAge(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                    </label>
                    <button type="button" onClick={() => {
                      const name = newGuestName.trim()
                      const age = Number(newGuestAge)
                      if (!name || !Number.isFinite(age) || age < 0) return
                      setNonMemberGuests((prev) => [...prev, { name, age }])
                      setNewGuestName('')
                      setNewGuestAge('')
                    }} className="col-span-2 px-3 py-2 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800">
                      Add Non-member Guest
                    </button>
                    {nonMemberGuests.length > 0 && (
                      <div className="col-span-2 space-y-2">
                        {nonMemberGuests.map((guest, idx) => (
                          <div key={`${guest.name}-${idx}`} className="flex items-center justify-between text-sm border border-slate-200 rounded-md px-3 py-2">
                            <span>{guest.name} ({guest.age})</span>
                            <button type="button" onClick={() => setNonMemberGuests((prev) => prev.filter((_, i) => i !== idx))} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">New total</span>
                  <span className="font-semibold text-slate-900">${totalAmount}</span>
                </div>
                {isEditMode && existingPaidAmount > 0 && totalAmount !== existingPaidAmount && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Amount paid</span>
                    <span className="text-slate-500">${existingPaidAmount}</span>
                  </div>
                )}
                {isEditMode && existingPaidAmount > 0 && totalAmount < existingPaidAmount && (
                  <div className="flex items-center justify-between text-xs font-medium text-amber-700">
                    <span>↩ Refund</span>
                    <span>${existingPaidAmount - totalAmount}</span>
                  </div>
                )}
                {isEditMode && existingPaidAmount > 0 && totalAmount > existingPaidAmount && (
                  <div className="flex items-center justify-between text-xs font-medium text-red-700">
                    <span>⚠ Additional payment required</span>
                    <span>${totalAmount - existingPaidAmount}</span>
                  </div>
                )}
              </div>
              {message && <p className="text-sm text-blue-700">{message}</p>}
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50">Close</button>
              <button onClick={registerForEvent} disabled={registering} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {registering ? 'Submitting...' : isEditMode ? 'Save Changes' : 'Submit Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
