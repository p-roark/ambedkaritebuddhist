'use client'

import { Hero } from '@/components/sections/hero'
import { MissionPreview } from '@/components/sections/mission-preview'
import { EventsPreview } from '@/components/sections/events-preview'
import { GoalsPreview } from '@/components/sections/goals-preview'
import { CTASection } from '@/components/sections/cta-section'

export default function Home() {
  // Sample data - in Phase 2 this will come from JSON files or database
  const missionCards = [
    {
      id: '1',
      title: 'Community Support',
      description: 'Building strong connections and providing assistance to community members in times of need.',
      image: 'https://picsum.photos/400/250?random=2',
      link: '/about',
      linkText: 'Learn More',
    },
    {
      id: '2',
      title: 'Student Resources',
      description: 'Comprehensive support for students moving to Canada or already studying here.',
      image: 'https://picsum.photos/400/250?random=3',
      link: '/resources',
      linkText: 'Explore Resources',
    },
    {
      id: '3',
      title: 'Cultural Events',
      description: 'Regular gatherings celebrating Buddhist festivals and Ambedkarite traditions.',
      image: 'https://picsum.photos/400/250?random=4',
      link: '/events',
      linkText: 'View Events',
    },
  ]

  const events = [
    {
      id: '1',
      title: 'Buddha Jayanti Celebration 2025',
      date: 'May 15, 2025',
      location: 'Toronto, ON',
      attendees: '200 attendees',
      category: 'Festival',
      description: 'Celebrate the birth of Lord Buddha with prayers, meditation, cultural performances, and community feast.',
      image: 'https://picsum.photos/500/250?random=5',
    },
    {
      id: '2',
      title: 'Monthly Dhamma Talk Series',
      date: 'Every First Sunday',
      location: 'Virtual',
      attendees: '50+ attendees',
      category: 'Education',
      description: 'Join our monthly online discussion on Buddhist teachings and their application in modern life.',
      image: 'https://picsum.photos/500/250?random=6',
    },
    {
      id: '3',
      title: 'Youth Community Meetup',
      date: 'March 20, 2025',
      location: 'Vancouver, BC',
      attendees: '75 attendees',
      category: 'Community',
      description: 'Connect with young community members for networking, sports, and cultural activities.',
      image: 'https://picsum.photos/500/250?random=7',
    },
    {
      id: '4',
      title: 'New Student Orientation',
      date: 'April 10, 2025',
      location: 'Toronto, ON',
      attendees: '40 students',
      category: 'Student',
      description: 'Essential orientation for students newly arrived in Canada. Learn about resources and connect with mentors.',
      image: 'https://picsum.photos/500/250?random=8',
    },
  ]

  const goals = [
    {
      id: '1',
      title: 'Build Community Vihara',
      description: 'Establish a permanent Buddhist temple and community center in Toronto.',
      targetAmount: 1000000,
      currentAmount: 450000,
    },
    {
      id: '2',
      title: 'Student Emergency Fund',
      description: 'Support students facing financial hardships during their studies in Canada.',
      targetAmount: 50000,
      currentAmount: 28500,
    },
    {
      id: '3',
      title: 'Youth Education Program',
      description: 'Fund educational workshops and leadership programs for community youth.',
      targetAmount: 25000,
      currentAmount: 18200,
    },
  ]

  return (
    <div className="w-full">
      {/* Hero Section */}
      <Hero
        title="Building a Vibrant Buddhist Community"
        description="Join us in creating a welcoming space for Ambedkarite Buddhists across Canada. Together, we celebrate our heritage, support newcomers, and grow stronger."
        image="https://picsum.photos/600/700?random=1"
        buttons={[
          { label: 'Become a Member', href: '/membership', variant: 'primary' },
          { label: 'Learn More', href: '/about', variant: 'secondary' },
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

      {/* Goals Preview */}
      <GoalsPreview
        subtitle="Support Our Vision"
        title="Current Fundraising Goals"
        description="Help us achieve our community goals through your generous contributions."
        goals={goals}
      />

      {/* CTA Section */}
      <CTASection
        title="Ready to Join Our Community?"
        description="Become a member today and be part of something greater. Together, we can build a stronger, more connected community."
        buttons={[
          { label: 'Become a Member', href: '/membership', variant: 'primary' },
          { label: 'Make a Donation', href: '/donations', variant: 'secondary' },
        ]}
      />
    </div>
  )
}
