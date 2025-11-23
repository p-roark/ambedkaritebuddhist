import Link from 'next/link'
import Image from 'next/image'

interface EventCard {
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

interface EventsPreviewProps {
  subtitle: string
  title: string
  description: string
  events: EventCard[]
}

export function EventsPreview({
  subtitle,
  title,
  description,
  events,
}: EventsPreviewProps) {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm md:text-base font-bold text-primary-saffron uppercase tracking-wider mb-4">
            {subtitle}
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-base md:text-lg text-text-medium leading-relaxed">
            {description}
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {events.map((event) => (
            <div
              key={event.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-background-light"
            >
              {/* Image with Badge */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute top-4 right-4">
                  <span className="inline-block px-4 py-2 bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold text-sm rounded-full">
                    {event.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold text-text-dark mb-4">
                  {event.title}
                </h3>

                {/* Metadata */}
                <div className="space-y-2 mb-4 text-text-medium text-sm md:text-base">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span>{event.attendees}</span>
                  </div>
                </div>

                <p className="text-text-medium mb-6 leading-relaxed">
                  {event.description}
                </p>

                {event.status === 'past' ? (
                  <Link
                    href={`/gallery?event=${event.id}`}
                    className="inline-block px-6 py-3 border-2 border-primary-blue text-primary-blue font-bold rounded-full hover:bg-primary-blue hover:text-white transition-all duration-200"
                  >
                    View Photos
                  </Link>
                ) : (
                  <Link
                    href={`/events/${event.id}`}
                    className="inline-block px-6 py-3 bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                  >
                    Register Now
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center">
          <Link
            href="/events"
            className="inline-block px-8 py-3 border-2 border-primary-blue text-primary-blue font-bold rounded-full hover:bg-primary-blue hover:text-white transition-all duration-200"
          >
            View All Events
          </Link>
        </div>
      </div>
    </section>
  )
}
