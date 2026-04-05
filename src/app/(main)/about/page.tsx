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

const ARTICLES = [
  {
    icon: '☸',
    accent: 'from-blue-500 to-primary-blue',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    title: 'Dhamma & Ambedkar Ideals',
    description: 'Promote and practise the teachings of Lord Buddha and the ideals of Dr. Ambedkar.',
  },
  {
    icon: '🧘',
    accent: 'from-accent-purple to-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    title: 'Religious Gatherings',
    description: 'Organise religious gatherings, meditation sessions, and Buddhist learning circles.',
  },
  {
    icon: '📅',
    accent: 'from-accent-orange to-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    title: 'Cultural Celebrations',
    description: 'Celebrate Buddhist and cultural events: Vesak, Ambedkar Jayanti, December 6, and October 14.',
  },
  {
    icon: '👥',
    accent: 'from-primary-saffron to-yellow-500',
    bg: 'bg-yellow-50',
    border: 'border-yellow-100',
    title: 'Fellowship',
    description: 'Provide fellowship through social gatherings, cultural programs, and educational events.',
  },
  {
    icon: '📚',
    accent: 'from-teal-500 to-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    title: 'Education',
    description: 'Advance education through lectures, seminars, and workshops on Buddhism and social equality.',
  },
  {
    icon: '🤝',
    accent: 'from-green-500 to-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
    title: 'Community Service',
    description: 'Give back to local Canadian communities through volunteer service and charitable activities.',
  },
]

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
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest mb-4">Who We Are</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-poppins">About Our Community</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Building an Ambedkarite Buddhist community in Canada — practising the Dhamma, celebrating our heritage, and advancing Dr. Ambedkar&apos;s ideals of equality, education, and compassion.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section id="story" className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest mb-4">Our Purpose</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent font-poppins">
              Our Story
            </h2>
          </div>
          <div className="space-y-5 text-text-medium leading-relaxed text-base md:text-lg">
            <p>
              We are Ambedkarite Buddhist families united by a shared history and a shared vision. For centuries, our ancestors in India lived under the weight of the caste system — denied education, denied dignity, denied the most basic human rights.
            </p>
            <p>
              Dr. Babasaheb Ambedkar changed everything. He earned doctorates from Columbia University and the London School of Economics, authored India&apos;s constitution, and on October 14, 1956, embraced Buddhism alongside hundreds of thousands of followers at Deekshabhoomi, Nagpur — setting in motion the largest peaceful mass conversion in modern history.
            </p>
            <p>
              Because of his relentless emphasis on education, our community rose. Generations of families who had been excluded from learning were empowered to study, to earn degrees, to pursue professions. That journey eventually brought many of us to Canada — to Ontario — where we are building new lives rooted in the Dhamma.
            </p>
            <p className="font-medium text-text-dark">
              ABCC was founded to keep that thread alive — to ensure that the Ambedkarite Buddhist identity, the memory of Dr. Ambedkar, and the practice of the Dhamma flourish in our new home.
            </p>
          </div>
        </div>
      </section>

      {/* What We Do — Articles of Incorporation */}
      <section id="mission" className="py-20 md:py-28 bg-background-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest mb-4">Our Activities</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent font-poppins">
              What We Do
            </h2>
            <p className="text-base md:text-lg text-text-medium leading-relaxed">
              As a registered non-profit in Ontario, our activities are guided by our Articles of Incorporation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ARTICLES.map((item) => (
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

      {/* Our Journey / Timeline */}
      <section className="py-20 md:py-28 bg-background-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-bold text-primary-saffron uppercase tracking-widest mb-4">Our History</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent font-poppins">
              Our Journey
            </h2>
            <p className="text-base md:text-lg text-text-medium leading-relaxed">
              From a small gathering of families to a registered non-profit with 220+ members — here&apos;s how ABCC came to be.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-blue to-accent-purple transform md:-translate-x-px" />

            <div className="space-y-10">
              {[
                {
                  year: '2022',
                  title: 'Community Founded',
                  description: 'A small group of Ambedkarite Buddhist families came together in Canada, united by shared values and a desire to practise the Dhamma in their new home.',
                  side: 'left',
                },
                {
                  year: 'April 2023',
                  title: 'First Major Gathering',
                  description: 'The community held its first formal gathering, bringing together families from across the Greater Golden Horseshoe to celebrate and connect.',
                  side: 'right',
                },
                {
                  year: 'October 2023',
                  title: 'Growing Community',
                  description: 'A landmark moment in ABCC\'s development — the community marked Dhamma Chakra Pravartan Day together, strengthening bonds and commitment to the Dhamma.',
                  side: 'left',
                },
                {
                  year: 'October 18, 2025',
                  title: 'Dhamma Chakra Pravartan Din Celebration',
                  description: 'A major community celebration marking the 69th anniversary of Dr. Ambedkar\'s historic conversion to Buddhism. 220+ members across the Greater Golden Horseshoe participated.',
                  side: 'right',
                },
                {
                  year: 'October 1, 2025',
                  title: 'Officially Registered Non-Profit',
                  description: 'ABCC was officially registered as a Non-Profit Organisation in Ontario — a milestone that formalises our commitment to the community and enables us to serve more broadly.',
                  side: 'left',
                },
                {
                  year: 'Future',
                  title: 'Building a Buddha Vihara',
                  description: 'Our vision is to establish a permanent Buddha Vihara in Canada — a dedicated space for meditation, learning, and community gathering for generations to come.',
                  side: 'right',
                },
              ].map((item, index) => (
                <div key={index} className={`relative flex items-start gap-8 ${item.side === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} flex-row`}>
                  {/* Dot */}
                  <div className="absolute left-8 md:left-1/2 w-4 h-4 rounded-full bg-primary-saffron border-4 border-white shadow transform -translate-x-1.5 md:-translate-x-2 mt-1.5" />

                  {/* Spacer for center alignment on desktop */}
                  <div className="hidden md:block w-1/2" />

                  {/* Card */}
                  <div className="ml-16 md:ml-0 md:w-1/2 bg-white rounded-2xl p-6 shadow-sm border border-background-gray hover:shadow-md transition-shadow">
                    <span className="inline-block text-xs font-bold text-primary-saffron uppercase tracking-wide mb-2">{item.year}</span>
                    <h3 className="text-lg font-bold text-text-dark mb-2">{item.title}</h3>
                    <p className="text-text-medium leading-relaxed text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
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
