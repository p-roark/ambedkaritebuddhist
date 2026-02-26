'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Hero } from '@/components/sections/hero'
import { MissionPreview } from '@/components/sections/mission-preview'
import { EventsPreview } from '@/components/sections/events-preview'
import { normalizeImagePath } from '@/lib/image-path'

interface Event {
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
  registrationStatus?: 'open' | 'closed' | 'not-started'
  userRegistrationStatus?: string
  userPaymentStatus?: string
  isCoordinator?: boolean
}

type DbEvent = {
  id: string
  title: string
  description: string
  coverImage: string
  date: string
  time: string
  location: string
  eventType: string
  eventImages: string
  status: 'Upcoming' | 'Registration Started' | 'Event Ended'
}

function formatEventDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? dateStr
    : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function parseImageKeys(raw: string) {
  try {
    const parsed = JSON.parse(raw || '[]') as unknown
    if (!Array.isArray(parsed)) return [] as string[]
    return parsed.map((key) => String(key))
  } catch {
    return [] as string[]
  }
}

export default function Home() {
  const { status } = useSession()
  const [heroImage, setHeroImage] = useState<string>('')
  const [events, setEvents] = useState<Event[]>([])
  const [_isLoading, setIsLoading] = useState(true)

  const missionCards = [
    {
      id: '1',
      title: 'Cultural Events',
      description: 'Celebrate our rich heritage through festivals, gatherings, and community events.',
      image: '/images/backgrounds/buddha-1.jpg',
      link: '/events',
      linkText: 'View Events',
    },
    {
      id: '2',
      title: 'Membership',
      description: 'Join our community and become part of a vibrant network of like-minded individuals.',
      image: '/images/membership.jpg',
      link: '/auth/login',
      linkText: 'Join Us',
    },
  ]

  const visibleMissionCards = status === 'authenticated'
    ? missionCards.filter((card) => card.id !== '2')
    : missionCards

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/events', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load events')
        const data = (await res.json()) as {
          events: DbEvent[]
          registrations: Array<{ eventId: string; registrationStatus: string; paymentStatus: string }>
          registrationCounts?: Record<string, number>
          coordinatedEventIds?: string[]
        }
        const regMap: Record<string, { registrationStatus: string; paymentStatus: string }> = {}
        for (const r of data.registrations ?? []) {
          regMap[r.eventId] = { registrationStatus: r.registrationStatus, paymentStatus: r.paymentStatus }
        }
        const coordinatedSet = new Set(data.coordinatedEventIds ?? [])
        const allEvents: Event[] = data.events.map((event) => ({
          id: event.id,
          title: event.title,
          date: formatEventDate(event.date),
          location: event.location,
          attendees: `${data.registrationCounts?.[event.id] ?? 0} registered`,
          category: event.eventType,
          description: event.description || 'Join us for this community event.',
          image: normalizeImagePath(event.coverImage),
          imageKeys: parseImageKeys(event.eventImages),
          status: event.status === 'Event Ended' ? 'past' : 'upcoming',
          registrationStatus:
            event.status === 'Registration Started'
              ? 'open'
              : event.status === 'Upcoming'
                ? 'not-started'
                : 'closed',
          userRegistrationStatus: regMap[event.id]?.registrationStatus,
          userPaymentStatus: regMap[event.id]?.paymentStatus,
          isCoordinator: coordinatedSet.has(event.id),
        }))
        setEvents(allEvents)

        const upcomingEvent = data.events
          .filter((e) => e.status !== 'Event Ended')
          .sort((a, b) => a.date.localeCompare(b.date))[0]
        if (upcomingEvent?.coverImage) {
          setHeroImage(normalizeImagePath(upcomingEvent.coverImage))
        }
      } catch (error) {
        console.error('Failed to load events:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="w-full">
      <Hero 
        title="Building a Vibrant Buddhist Community"
        description="Welcome to Ambedkarite Buddhist Community Canada - where we celebrate our heritage, support one another, and work toward social justice and equality."
        image="/images/backgrounds/ambedkar-1.jpg"
        overlayImage={heroImage}
        layout="two-column"
        buttons={status === 'authenticated'
          ? [{ label: 'Learn More', href: '/about', variant: 'secondary' }]
          : [
              { label: 'Learn More', href: '/about', variant: 'secondary' },
              { label: 'Sign In', href: '/auth/login', variant: 'primary' },
            ]}
      />
      <MissionPreview
        subtitle="Our Community"
        title="Building a Vibrant Buddhist Community"
        description="Discover how we serve our community through cultural celebration, education, and support."
        cards={visibleMissionCards}
      />
      <EventsPreview
        subtitle="Join Us"
        title="Upcoming Events"
        description="Stay connected with our community through cultural celebrations and meaningful gatherings."
        events={events}
      />
    </div>
  )
}
