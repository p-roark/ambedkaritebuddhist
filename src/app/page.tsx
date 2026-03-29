'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Hero } from '@/components/sections/hero'
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
  externalLink?: string | null
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
  externalLink: string | null
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

const QUOTES = [
  '"Cultivation of mind should be the ultimate aim of human existence."',
  '"Educate, Agitate, Organise."',
  '"Life should be great rather than long."',
  '"Losing money is not a great loss, losing confidence is a great loss."',
]

function RotatingQuote() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % QUOTES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <p className="text-2xl md:text-3xl font-bold text-white italic text-center max-w-3xl mx-auto leading-relaxed transition-all duration-500">
      {QUOTES[index]}
    </p>
  )
}

const WHAT_WE_DO = [
  {
    icon: '☸',
    title: 'Dhamma Practice',
    description: "Meditation sessions, Buddhist learning circles, and Dhamma discussions rooted in Dr. Ambedkar's The Buddha and His Dhamma.",
    link: null,
  },
  {
    icon: '📅',
    title: 'Cultural Celebrations',
    description: 'Celebrating Vesak Day, Ambedkar Jayanti, Dhamma Chakra Pravartan Day, Mahaparinirvan Diwas, and other milestones that define our heritage.',
    link: null,
  },
  {
    icon: '📚',
    title: 'Education & Workshops',
    description: 'Lectures, seminars, and workshops on Buddhism, social equality, and the life and legacy of Dr. Ambedkar — for all ages.',
    link: null,
  },
  {
    icon: '🤝',
    title: 'Community Service',
    description: 'Giving back to local Canadian communities through volunteering, charitable activities, and community partnerships — living the Dhamma in action.',
    link: null,
  },
  {
    icon: '👥',
    title: 'Fellowship & Membership',
    description: 'Connect with a vibrant network of Ambedkarite Buddhist families. Social gatherings, cultural programs, and a place to belong.',
    link: '/membership',
  },
]

const CALENDAR_EVENTS = [
  {
    date: 'April 14',
    title: 'Dr. Ambedkar Jayanti',
    description: 'Celebrating the birth anniversary of Dr. B.R. Ambedkar',
    color: 'from-primary-blue to-accent-purple',
  },
  {
    date: 'May (varies)',
    title: 'Vesak Day',
    description: 'Birth, enlightenment, and passing of Lord Buddha',
    color: 'from-accent-purple to-purple-600',
  },
  {
    date: 'October 14',
    title: 'Dhamma Chakra Pravartan Day',
    description: 'The historic day Dr. Ambedkar embraced Buddhism in Nagpur, 1956',
    color: 'from-accent-orange to-primary-saffron',
  },
  {
    date: 'December 6',
    title: 'Mahaparinirvan Diwas',
    description: "Remembering Dr. Ambedkar's passing and recommitting to his mission",
    color: 'from-primary-blue to-blue-800',
  },
]

export default function Home() {
  const { status: _status } = useSession()
  const [heroImage, setHeroImage] = useState<string>('')
  const [events, setEvents] = useState<Event[]>([])
  const [_isLoading, setIsLoading] = useState(true)

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
        const allEvents: Event[] = data.events.filter((event) => event.status !== 'Event Ended').map((event) => ({
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
          externalLink: event.externalLink,
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
      {/* Hero */}
      <Hero
        title="Walking the Path of Buddha. Continuing the Vision of Ambedkar."
        description="A growing community of Ambedkarite Buddhist families in Canada — practising the Dhamma, celebrating our heritage, and building a future rooted in equality, education, and compassion."
        image="/images/backgrounds/ambedkar-1.jpg"
        overlayImage={heroImage}
        layout="two-column"
        buttons={[
          { label: 'Join Our Community', href: '/membership', variant: 'primary' },
          { label: 'Upcoming Events', href: '/events', variant: 'secondary' },
        ]}
      />

      {/* WHO WE ARE */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest">Who We Are</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent font-poppins">
                Namo Buddhay. Welcome to ABCC.
              </h2>
              <div className="space-y-4 text-text-medium leading-relaxed">
                <p>The Ambedkarite Buddhist Community Of Canada (ABCC) is a registered non-profit organisation in Ontario, founded by Ambedkarite Buddhist families who follow the path shown by Dr. Babasaheb Ambedkar.</p>
                <p>Dr. Ambedkar — the architect of India&apos;s constitution, a scholar who earned doctorates from Columbia University and the London School of Economics, and a champion of human dignity — led millions of oppressed people out of centuries of social discrimination by embracing Buddhism on October 14, 1956.</p>
                <p>Because of his vision and emphasis on education, many of us were able to rise, pursue opportunity, and eventually build new lives here in Canada. ABCC exists to carry that legacy forward.</p>
                <p className="font-medium text-text-dark">Whether you are a longtime follower of the Dhamma or discovering this path for the first time — you are welcome here.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/about" className="inline-block px-8 py-3 rounded-full font-bold text-center bg-primary-blue text-white hover:bg-primary-blue/90 transition-all">
                  Our Story
                </Link>
                <Link href="/ambedkar" className="inline-block px-8 py-3 rounded-full font-bold text-center border-2 border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white transition-all">
                  Who was Dr. Ambedkar?
                </Link>
              </div>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-blue to-accent-purple flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <div className="text-8xl mb-4">☸</div>
                  <p className="text-xl font-bold">Ambedkarite Buddhist Community of Canada</p>
                  <p className="text-white/80 mt-2">Ontario, Canada</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="py-20 md:py-28 bg-background-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest mb-4">Our Work</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent font-poppins">
              What We Do
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHAT_WE_DO.map((card) => (
              <div key={card.title} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 border border-background-light flex flex-col">
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-lg font-bold text-text-dark mb-3">{card.title}</h3>
                <p className="text-text-medium leading-relaxed flex-1">{card.description}</p>
                {card.link && (
                  <Link href={card.link} className="mt-4 inline-block text-sm font-bold text-primary-blue hover:underline">
                    Learn more →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALENDAR HIGHLIGHTS */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest mb-4">Every Year</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent font-poppins">
              Annual Celebrations
            </h2>
            <p className="mt-4 text-text-medium leading-relaxed">
              These sacred dates anchor our community calendar year after year.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CALENDAR_EVENTS.map((event) => (
              <div key={event.title} className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-background-light">
                <div className={`bg-gradient-to-br ${event.color} p-6 text-white`}>
                  <p className="text-sm font-bold uppercase tracking-widest text-white/80">{event.date}</p>
                  <h3 className="text-lg font-bold mt-1">{event.title}</h3>
                </div>
                <div className="bg-white p-5">
                  <p className="text-text-medium text-sm leading-relaxed">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/events" className="inline-block px-8 py-3 rounded-full font-bold bg-primary-blue text-white hover:bg-primary-blue/90 transition-all">
              See All Events
            </Link>
          </div>
        </div>
      </section>

      {/* EVENTS PREVIEW (DB-backed) */}
      <EventsPreview
        subtitle="Join Us"
        title="Upcoming Events"
        description="Stay connected with our community through cultural celebrations and meaningful gatherings."
        events={events}
      />

      {/* INSPIRATIONAL QUOTE */}
      <section className="py-16 bg-gradient-to-r from-primary-blue to-accent-purple">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-sm font-bold text-white/70 uppercase tracking-widest">Dr. B.R. Ambedkar</p>
          <RotatingQuote />
          <Link href="/ambedkar" className="inline-block mt-4 px-8 py-3 rounded-full font-bold border-2 border-white text-white hover:bg-white hover:text-primary-blue transition-all">
            Learn About Dr. Ambedkar
          </Link>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-16 bg-primary-saffron">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-text-dark font-poppins">
            New to Canada? Looking for your Ambedkarite Buddhist community? You&apos;ve found us.
          </h2>
          <Link href="/membership" className="inline-block px-10 py-4 rounded-full font-bold text-lg bg-primary-blue text-white hover:bg-primary-blue/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            Become a Member
          </Link>
        </div>
      </section>
    </div>
  )
}
