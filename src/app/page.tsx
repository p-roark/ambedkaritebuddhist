'use client'

import { useEffect, useState } from 'react'
import { Hero } from '@/components/sections/hero'
import { MissionPreview } from '@/components/sections/mission-preview'
import { EventsPreview } from '@/components/sections/events-preview'
import { getEventImages, getRandomEventImage } from '@/lib/event-images'

interface EventData {
  pastEvents: Array<{
    id: string
    title: string
    date: string
    location: string
    attendees: string
    category: string
    description: string
    image: string
    imageFolder: string
    status: 'past'
  }>
  upcomingEvents: Array<{
    id: string
    title: string
    date: string
    location: string
    attendees: string
    category: string
    description: string
    image: string
    imageFolder: string
    registrationFormUrl: string
    status: 'upcoming'
  }>
}

interface PreviewEvent {
  id: string
  title: string
  date: string
  location: string
  attendees: string
  category: string
  description: string
  image?: string
  status?: 'past' | 'upcoming'
  registrationFormUrl?: string
}

export default function Home() {
  const [heroImage, setHeroImage] = useState<string>('https://picsum.photos/600/700?random=1')
  const [eventImages, setEventImages] = useState<string[]>([])
  const [previewEvents, setPreviewEvents] = useState<PreviewEvent[]>([])

  useEffect(() => {
    // Fetch events.json and get all images from past events
    const loadEventImages = async () => {
      try {
        const response = await fetch('/data/events.json')
        const data: EventData = await response.json()

        // Use only upcoming events for home page preview, but use past events for hero images
        const allEventsList = [...data.pastEvents, ...data.upcomingEvents]
        const eventsList = data.upcomingEvents

        if (allEventsList.length > 0) {
          const firstEvent = allEventsList[0]
          const images = await getEventImages(firstEvent.id)
          setEventImages(images)
          // Set initial random image
          const randomImage = getRandomEventImage(images)
          if (randomImage) {
            setHeroImage(randomImage)
          }
        }

        // Transform events for preview section
        const eventsForPreview = eventsList.map((event) => ({
          id: event.id,
          title: event.title,
          date: event.date,
          location: event.location,
          attendees: event.attendees || 'TBA',
          category: event.category || 'Event',
          description: event.description,
          status: event.status,
          registrationFormUrl: event.registrationFormUrl,
        }))
        setPreviewEvents(eventsForPreview)
      } catch (error) {
        console.error('Failed to load event images:', error)
        // Fallback to default image if loading fails
      }
    }

    loadEventImages()
  }, [])

  // Slideshow effect - change image every 5 seconds
  useEffect(() => {
    if (eventImages.length === 0) return

    const interval = setInterval(() => {
      const randomImage = getRandomEventImage(eventImages)
      if (randomImage) {
        setHeroImage(randomImage)
      }
    }, 5000) // Change every 5 seconds

    return () => clearInterval(interval)
  }, [eventImages])
  // Sample data - in Phase 2 this will come from JSON files or database
  const missionCards = [
    {
      id: '1',
      title: 'Cultural Events',
      description: 'Regular gatherings celebrating Buddhist festivals and Ambedkarite traditions.',
      image: '/images/events/covers/cultural-events.jpeg',
      link: '/events',
      linkText: 'View Events',
    },
  ]

  // Map preview events to include cover images from events.json
  // First, we need to fetch the actual image URLs from the events data
  const [eventImages_, setEventImages_] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const loadEventCovers = async () => {
      try {
        const response = await fetch('/data/events.json')
        const data: EventData = await response.json()
        const imageMap: { [key: string]: string } = {}

        // Map event IDs to their cover images
        data.upcomingEvents.forEach((event: any) => {
          imageMap[event.id] = event.image
        })
        data.pastEvents.forEach((event: any) => {
          imageMap[event.id] = event.image
        })

        setEventImages_(imageMap)
      } catch (error) {
        console.error('Failed to load event covers:', error)
      }
    }

    loadEventCovers()
  }, [])

  const events = previewEvents.map((event) => ({
    ...event,
    image: eventImages_[event.id] || `https://picsum.photos/500/250?random=default`,
  }))

  return (
    <div className="w-full">
      {/* Hero Section */}
      <Hero
        title="Building a Vibrant Buddhist Community"
        description="Join us in creating a welcoming space for Ambedkarite Buddhists across Canada. Together, we celebrate our heritage, support newcomers, and grow stronger."
        image={heroImage}
        buttons={[
          { label: 'Learn More', href: '/about', variant: 'secondary' },
          { label: 'Join Us', href: '/contact', variant: 'primary' },
        ]}
        layout="two-column"
      />

      {/* Mission Preview */}
      <MissionPreview
        subtitle="Our Mission"
        title="Empowering Through Community & Education"
        description="Following the principles of Dr. B.R. Ambedkar, we create opportunities for growth, learning, and connection within the Buddhist community across Canada."
        cards={missionCards}
      />

      {/* Events Preview */}
      <EventsPreview
        subtitle="What's Coming"
        title="Upcoming Events"
        description="Join us for upcoming celebrations, learning sessions, and community gatherings."
        events={events}
      />

    </div>
  )
}
