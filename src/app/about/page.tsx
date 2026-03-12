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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-blue" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section
        className="relative py-28 md:py-36 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2D4D9B 0%, #7F56D9 55%, #FF6B35 100%)' }}
      >
        {/* decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest mb-4">Who We Are</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-poppins">About Our Community</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Building an inclusive digital home for Ambedkarite Buddhists in Canada — celebrating heritage, supporting newcomers, and promoting the teachings of Dr. B.R. Ambedkar.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest mb-4">Our Purpose</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent font-poppins">
              Our Mission
            </h2>
            <p className="text-base md:text-lg text-text-medium leading-relaxed">
              We are a nonprofit organization dedicated to building an inclusive digital home for
              Ambedkarite Buddhists in Canada. We celebrate our heritage, support newcomers, and
              promote the teachings of Dr. B.R. Ambedkar and Buddhism.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: '🤝',
                accent: 'from-blue-500 to-primary-blue',
                bg: 'bg-blue-50',
                border: 'border-blue-100',
                title: 'Community Building',
                description:
                  'Connecting Ambedkarite Buddhists across Canada to foster a strong, united community rooted in the principles of equality, justice, and compassion.',
              },
              {
                icon: '🌱',
                accent: 'from-accent-purple to-purple-600',
                bg: 'bg-purple-50',
                border: 'border-purple-100',
                title: 'Supporting Newcomers',
                description:
                  'Providing resources, mentorship, and a welcoming network for those newly arrived in Canada, helping them navigate their new home with confidence.',
              },
              {
                icon: '☸️',
                accent: 'from-accent-orange to-orange-500',
                bg: 'bg-orange-50',
                border: 'border-orange-100',
                title: 'Preserving Heritage',
                description:
                  'Celebrating and preserving Ambedkarite Buddhist culture, traditions, and the transformative legacy of Dr. B.R. Ambedkar.',
              },
              {
                icon: '📊',
                accent: 'from-accent-teal to-teal-600',
                bg: 'bg-teal-50',
                border: 'border-teal-100',
                title: 'Nonprofit Transparency',
                description:
                  'Operating with full transparency in our finances and governance, ensuring every contribution serves the community\'s best interests.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`rounded-2xl border ${item.border} ${item.bg} p-8 hover:shadow-md transition-shadow duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.accent} flex items-center justify-center text-2xl mb-5 shadow-sm`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-text-dark mb-3">{item.title}</h3>
                <p className="text-text-medium leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section
        id="values"
        className="py-20 md:py-28 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2D4D9B 0%, #7F56D9 55%, #FF6B35 100%)' }}
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest mb-4">What Guides Us</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-poppins">Our Core Values</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { emoji: '⚖️', title: 'Equality', description: 'Every member is equal. We stand against caste discrimination and champion human dignity for all.' },
              { emoji: '☸️', title: 'Dhamma', description: "We walk the path of the Buddha as understood through Dr. Ambedkar's teachings of rationality and compassion." },
              { emoji: '🤝', title: 'Brotherhood', description: 'We build bonds of solidarity among Ambedkarite Buddhists in Canada and around the world.' },
              { emoji: '📚', title: 'Education', description: 'Knowledge is liberation. We promote education as the cornerstone of social transformation.' },
              { emoji: '🪷', title: 'Compassion', description: 'We act with karuna — compassion — toward all beings, guiding our community service.' },
              { emoji: '🌍', title: 'Inclusion', description: 'Our doors are open to all who respect our values. Diversity strengthens our community.' },
            ].map((value) => (
              <div
                key={value.title}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{value.emoji}</div>
                <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                <p className="text-white/80 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      {leadership.length > 0 && (
        <section className="py-20 md:py-28 bg-background-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest mb-4">The Team</p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent font-poppins">
                Our Leadership
              </h2>
              <p className="text-base md:text-lg text-text-medium leading-relaxed">
                Meet the dedicated volunteers who guide our community.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {leadership.map((role) => (
                <div
                  key={role.id}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center border border-background-gray"
                >
                  <div className="flex justify-center mb-4">
                    {role.userImage ? (
                      <img
                        src={role.userImage}
                        alt={role.userName ?? ''}
                        className="w-20 h-20 rounded-full object-cover ring-4 ring-primary-blue/20"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-blue to-accent-purple flex items-center justify-center text-2xl font-bold text-white">
                        {(role.userName ?? '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="inline-block text-xs font-bold text-primary-saffron uppercase tracking-wide mb-1">{role.roleName}</span>
                  <p className="text-base font-bold text-text-dark mb-3">{role.userName}</p>
                  <div className="space-y-2 border-t border-background-gray pt-4 text-left">
                    {role.userEmail && (
                      <a href={`mailto:${role.userEmail}`} className="flex items-center gap-2 text-sm text-text-medium hover:text-primary-blue transition-colors">
                        <span className="text-base">✉️</span>
                        <span className="truncate">{role.userEmail}</span>
                      </a>
                    )}
                    {role.userPhone && (
                      <a href={`tel:${role.userPhone}`} className="flex items-center gap-2 text-sm text-text-medium hover:text-primary-blue transition-colors">
                        <span className="text-base">📞</span>
                        <span>{role.userPhone}</span>
                      </a>
                    )}
                    {role.userJoinedAt && (
                      <p className="flex items-center gap-2 text-sm text-text-medium">
                        <span className="text-base">📅</span>
                        <span>Since {new Date(role.userJoinedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long' })}</span>
                      </p>
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
