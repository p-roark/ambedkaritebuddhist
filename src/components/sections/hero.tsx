import Link from 'next/link'
import Image from 'next/image'

interface HeroProps {
  title: string
  description: string
  image?: string
  buttons?: Array<{
    label: string
    href: string
    variant: 'primary' | 'secondary' | 'outline'
  }>
  layout?: 'single' | 'two-column'
  fullHeight?: boolean
}

export function Hero({
  title,
  description,
  image,
  buttons,
  layout = 'single',
  fullHeight = true,
}: HeroProps) {
  const heightClass = fullHeight ? 'min-h-screen' : 'min-h-[60vh]'

  if (layout === 'two-column' && image) {
    return (
      <section className={`${heightClass} flex items-center justify-center bg-gradient-to-r from-primary-blue via-accent-purple to-accent-orange relative overflow-hidden`}>
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
            {/* Text Content */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
                {title}
              </h1>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed drop-shadow">
                {description}
              </p>

              {/* Buttons */}
              {buttons && buttons.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  {buttons.map((button) => (
                    <Link
                      key={button.href}
                      href={button.href}
                      className={`inline-block px-8 py-3 rounded-full font-bold text-center transition-all duration-200 ${
                        button.variant === 'primary'
                          ? 'bg-white text-primary-blue hover:shadow-lg hover:-translate-y-1'
                          : button.variant === 'secondary'
                          ? 'bg-primary-saffron text-text-dark hover:shadow-lg hover:-translate-y-1'
                          : 'border-2 border-white text-white hover:bg-white hover:text-primary-blue'
                      }`}
                    >
                      {button.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Image */}
            <div className="relative h-[400px] md:h-[500px]">
              <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Single column layout
  return (
    <section className={`${heightClass} flex items-center justify-center bg-gradient-to-br from-primary-blue via-accent-purple to-accent-orange`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed">
          {description}
        </p>

        {buttons && buttons.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {buttons.map((button) => (
              <Link
                key={button.href}
                href={button.href}
                className={`inline-block px-8 py-3 rounded-full font-bold transition-all duration-200 ${
                  button.variant === 'primary'
                    ? 'bg-white text-primary-blue hover:shadow-lg hover:-translate-y-1'
                    : button.variant === 'secondary'
                    ? 'bg-primary-saffron text-text-dark hover:shadow-lg hover:-translate-y-1'
                    : 'border-2 border-white text-white hover:bg-white hover:text-primary-blue'
                }`}
              >
                {button.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
