import Link from 'next/link'
import Image from 'next/image'

interface MissionCard {
  id: string
  title: string
  description: string
  image: string
  link: string
  linkText: string
}

interface MissionPreviewProps {
  subtitle: string
  title: string
  description: string
  cards: MissionCard[]
}

export function MissionPreview({
  subtitle,
  title,
  description,
  cards,
}: MissionPreviewProps) {
  return (
    <section className="py-20 md:py-28 bg-background-light">
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

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card) => (
            <div
              key={card.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              {/* Content */}
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold text-text-dark mb-3">
                  {card.title}
                </h3>
                <p className="text-text-medium mb-6 leading-relaxed">
                  {card.description}
                </p>
                <Link
                  href={card.link}
                  className="inline-block px-6 py-2 border-2 border-primary-blue text-primary-blue font-bold rounded-full hover:bg-primary-blue hover:text-white transition-all duration-200"
                >
                  {card.linkText}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
