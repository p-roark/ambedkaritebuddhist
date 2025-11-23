'use client'

import { useEffect, useState } from 'react'

interface AboutData {
  mission: {
    title: string
    description: string
    points: Array<{
      id: string
      title: string
      description: string
    }>
  }
  values: Array<{
    id: string
    title: string
    description: string
    emoji: string
  }>
  history: {
    title: string
    description: string
    milestones: Array<{
      year: string
      title: string
      description: string
    }>
  }
  team: {
    title: string
    description: string
    members: Array<{
      id: string
      role: string
    }>
  }
}

interface Member {
  id: string
  name: string
  phone: string
  email: string
  joinedDate: string
}

interface MembersData {
  members: Member[]
}

export default function About() {
  const [data, setData] = useState<AboutData | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAboutData = async () => {
      try {
        // Fetch about data
        const aboutResponse = await fetch('/data/about.json')
        const aboutData: AboutData = await aboutResponse.json()
        setData(aboutData)

        // Fetch members data
        const membersResponse = await fetch('/data/members.json')
        const membersData: MembersData = await membersResponse.json()
        setMembers(membersData.members)
      } catch (error) {
        console.error('Failed to load about data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAboutData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-lg text-text-medium">Loading...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-lg text-text-medium">Failed to load about page</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-blue via-accent-purple to-accent-orange py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About Us</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Learn more about our community and mission
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-text-dark mb-6">{data.mission.title}</h2>
          <p className="text-lg text-text-medium leading-relaxed mb-12">{data.mission.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {data.mission.points.map((point) => (
              <div key={point.id} className="bg-background-light rounded-lg p-6">
                <h3 className="text-xl font-bold text-primary-blue mb-3">{point.title}</h3>
                <p className="text-text-medium">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="bg-background-light py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-text-dark mb-12 text-center">Our Core Values</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.values.map((value) => (
              <div key={value.id} className="bg-white rounded-lg p-8 shadow-sm hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{value.emoji}</div>
                <h3 className="text-xl font-bold text-text-dark mb-3">{value.title}</h3>
                <p className="text-text-medium">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-text-dark mb-6 text-center">{data.history.title}</h2>
        <p className="text-lg text-text-medium text-center mb-12 max-w-3xl mx-auto">{data.history.description}</p>

        <div className="space-y-8">
          {data.history.milestones.map((milestone, index) => (
            <div key={milestone.year} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary-saffron rounded-full flex items-center justify-center text-white font-bold">
                  {milestone.year}
                </div>
                {index < data.history.milestones.length - 1 && (
                  <div className="w-1 h-24 bg-primary-saffron/30 mt-4"></div>
                )}
              </div>
              <div className="pb-8">
                <h3 className="text-xl font-bold text-text-dark mb-2">{milestone.title}</h3>
                <p className="text-text-medium">{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-background-light py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-text-dark mb-6 text-center">{data.team.title}</h2>
          <p className="text-lg text-text-medium text-center mb-12 max-w-3xl mx-auto">{data.team.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {data.team.members.map((teamMember) => {
              const member = members.find((m) => m.id === teamMember.id)
              if (!member) return null

              return (
                <div key={member.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-bold text-text-dark mb-1">{teamMember.role}</h3>
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    <div>
                      <p className="text-xs font-semibold text-text-medium">Email</p>
                      <p className="text-sm text-text-dark">{member.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-medium">Phone</p>
                      <p className="text-sm text-text-dark">{member.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-medium">Joined</p>
                      <p className="text-sm text-text-dark">{member.joinedDate}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
