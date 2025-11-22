import Link from 'next/link'

interface CTASectionProps {
  title: string
  description: string
  buttons?: Array<{
    label: string
    href: string
    variant: 'primary' | 'secondary'
  }>
}

export function CTASection({
  title,
  description,
  buttons = [],
}: CTASectionProps) {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-r from-primary-blue via-accent-purple to-accent-orange">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
          {title}
        </h2>
        <p className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto">
          {description}
        </p>

        {buttons.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            {buttons.map((button) => (
              <Link
                key={button.href}
                href={button.href}
                className={`px-8 py-3 rounded-full font-bold transition-all duration-200 ${
                  button.variant === 'primary'
                    ? 'bg-white text-primary-blue hover:shadow-lg hover:-translate-y-1'
                    : 'bg-primary-saffron text-text-dark hover:shadow-lg hover:-translate-y-1'
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
