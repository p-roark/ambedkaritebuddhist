'use client'

import { useEffect, useState } from 'react'

interface LeadershipRole {
  id: string
  roleName: string
  displayOrder: number
  userId: string | null
  userName: string | null
  userEmail: string | null
  userPhone: string | null
  userImage: string | null
  userJoinedAt: string | null
}

export default function About() {
  const [leadership, setLeadership] = useState<LeadershipRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/events?resource=leadership')
        const data = (await res.json()) as { roles: LeadershipRole[] }
        setLeadership(data.roles)
      } catch (error) {
        console.error('Failed to load about data:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-lg text-text-medium">Loading...</p>
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
          <h2 className="text-4xl font-bold text-text-dark mb-6">Our Mission</h2>
          <p className="text-lg text-text-medium leading-relaxed mb-12">
            We are a nonprofit organization dedicated to building an inclusive digital home for
            Ambedkarite Buddhists in Canada. We celebrate our heritage, support newcomers, and
            promote the teachings of Dr. B.R. Ambedkar and Buddhism.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-background-light rounded-lg p-6">
              <h3 className="text-xl font-bold text-primary-blue mb-3">Community Building</h3>
              <p className="text-text-medium">
                Connecting Ambedkarite Buddhists across Canada to foster a strong, united community
                rooted in the principles of equality, justice, and compassion.
              </p>
            </div>
            <div className="bg-background-light rounded-lg p-6">
              <h3 className="text-xl font-bold text-primary-blue mb-3">Supporting Newcomers</h3>
              <p className="text-text-medium">
                Providing resources, mentorship, and a welcoming network for those newly arrived in
                Canada, helping them navigate their new home with confidence.
              </p>
            </div>
            <div className="bg-background-light rounded-lg p-6">
              <h3 className="text-xl font-bold text-primary-blue mb-3">Preserving Heritage</h3>
              <p className="text-text-medium">
                Celebrating and preserving Ambedkarite Buddhist culture, traditions, and the
                transformative legacy of Dr. B.R. Ambedkar.
              </p>
            </div>
            <div className="bg-background-light rounded-lg p-6">
              <h3 className="text-xl font-bold text-primary-blue mb-3">Nonprofit Transparency</h3>
              <p className="text-text-medium">
                Operating with full transparency in our finances and governance, ensuring every
                contribution serves the community&apos;s best interests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="bg-background-light py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-text-dark mb-12 text-center">Our Core Values</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { emoji: '⚖️', title: 'Equality', description: 'Every member is equal. We stand against caste discrimination and champion human dignity for all.' },
              { emoji: '☸️', title: 'Dhamma', description: "We walk the path of the Buddha as understood through Dr. Ambedkar's teachings of rationality and compassion." },
              { emoji: '🤝', title: 'Brotherhood', description: 'We build bonds of solidarity among Ambedkarite Buddhists in Canada and around the world.' },
              { emoji: '📚', title: 'Education', description: 'Knowledge is liberation. We promote education as the cornerstone of social transformation.' },
              { emoji: '🪷', title: 'Compassion', description: 'We act with karuna — compassion — toward all beings, guiding our community service.' },
              { emoji: '🌍', title: 'Inclusion', description: 'Our doors are open to all who respect our values. Diversity strengthens our community.' },
            ].map((value) => (
              <div key={value.title} className="bg-white rounded-lg p-8 shadow-sm hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{value.emoji}</div>
                <h3 className="text-xl font-bold text-text-dark mb-3">{value.title}</h3>
                <p className="text-text-medium">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      {leadership.length > 0 && (
        <section className="bg-background-light py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-text-dark mb-6 text-center">Our Leadership</h2>
            <p className="text-lg text-text-medium text-center mb-12 max-w-3xl mx-auto">
              Meet the dedicated volunteers who guide our community.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {leadership.map((role) => (
                <div key={role.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow text-center">
                  <div className="flex justify-center mb-4">
                    {role.userImage ? (
                      <img
                        src={role.userImage}
                        alt={role.userName ?? ''}
                        className="w-20 h-20 rounded-full object-cover ring-2 ring-primary-blue/20"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary-blue/10 flex items-center justify-center text-2xl font-bold text-primary-blue">
                        {(role.userName ?? '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-text-dark mb-1">{role.roleName}</h3>
                  <p className="text-base font-medium text-primary-blue mb-3">{role.userName}</p>
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    {role.userEmail && (
                      <div>
                        <p className="text-xs font-semibold text-text-medium">Email</p>
                        <p className="text-sm text-text-dark">{role.userEmail}</p>
                      </div>
                    )}
                    {role.userPhone && (
                      <div>
                        <p className="text-xs font-semibold text-text-medium">Phone</p>
                        <p className="text-sm text-text-dark">{role.userPhone}</p>
                      </div>
                    )}
                    {role.userJoinedAt && (
                      <div>
                        <p className="text-xs font-semibold text-text-medium">Member since</p>
                        <p className="text-sm text-text-dark">
                          {new Date(role.userJoinedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
