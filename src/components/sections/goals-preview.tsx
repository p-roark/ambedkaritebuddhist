import Link from 'next/link'

interface GoalCard {
  id: string
  title: string
  description: string
  targetAmount: number
  currentAmount: number
}

interface GoalsPreviewProps {
  subtitle: string
  title: string
  description: string
  goals: GoalCard[]
}

function ProgressBar({ current, target }: { current: number; target: number }) {
  const percentage = Math.round((current / target) * 100)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-text-dark">Raised</span>
        <span className="text-sm font-bold text-primary-saffron">
          ${(current / 1000).toFixed(0)}K / ${(target / 1000).toFixed(0)}K
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-background-light rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-saffron to-accent-orange rounded-full transition-all duration-1000 relative overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"
            style={{
              animation: 'shimmer 2s infinite',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function GoalsPreview({
  subtitle,
  title,
  description,
  goals,
}: GoalsPreviewProps) {
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

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 p-8"
            >
              <h3 className="text-xl md:text-2xl font-bold text-text-dark mb-3">
                {goal.title}
              </h3>
              <p className="text-text-medium mb-8 leading-relaxed">
                {goal.description}
              </p>

              {/* Progress Bar */}
              <ProgressBar current={goal.currentAmount} target={goal.targetAmount} />

              {/* CTA Button */}
              <Link
                href="/donations"
                className="block mt-8 px-6 py-3 w-full text-center bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                Donate Now
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
