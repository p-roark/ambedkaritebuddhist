'use client'
import { useEffect, useState } from 'react'
import { Hero } from '@/components/sections/hero'
import { MissionPreview } from '@/components/sections/mission-preview'
import { EventsPreview } from '@/components/sections/events-preview'

interface Event {
  id: string
  title: string
  date: string
  location: string
  attendees: string
  category: string
  description: string
  image: string
  status?: 'past' | 'upcoming'
}

export default function Home() {
  const [heroImage, setHeroImage] = useState<string>('')
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      link: '/membership',
      linkText: 'Join Us',
    },
    {
      id: '3',
      title: 'Student Support',
      description: 'Educational resources and mentorship for students and newcomers to Canada.',
      image: '/images/placeholder.jpg',
      link: '/resources',
      linkText: 'Learn More',
    },
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        const eventsRes = await fetch('/data/events.json')
        const eventsData = await eventsRes.json()
        
        // Combine past and upcoming events
        const allEvents = [
          ...(eventsData.upcomingEvents || []),
          ...(eventsData.pastEvents || [])
        ]
        setEvents(allEvents)
        
        // Get the next upcoming event for the hero image
        const upcomingEvent = allEvents.find((e) => new Date(e.dateFormatted) > new Date())
        if (upcomingEvent?.image) {
          setHeroImage(upcomingEvent.image)
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
        buttons={[
          { label: 'Learn More', href: '/about', variant: 'secondary' },
          { label: 'Join Us', href: '/auth/register', variant: 'primary' }
        ]}
      />
      <MissionPreview
        subtitle="Our Community"
        title="Building a Vibrant Buddhist Community"
        description="Discover how we serve our community through cultural celebration, education, and support."
        cards={missionCards}
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
