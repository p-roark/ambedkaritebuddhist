export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-light-gray to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6">
          <div className="text-6xl md:text-7xl">🪷</div>
          <h1 className="text-4xl md:text-5xl font-bold text-text-dark">
            Ambedkarite Buddhist Community
          </h1>
          <p className="text-xl text-text-medium max-w-2xl mx-auto">
            Fostering unity, education, and social welfare based on the teachings of Dr. B.R. Ambedkar
          </p>
          <div className="pt-8">
            <button className="bg-primary-saffron hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200">
              Join Our Community
            </button>
          </div>
        </div>
      </section>

      {/* Content Coming Soon */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md p-8 border border-border text-center">
          <h2 className="text-2xl font-bold text-text-dark mb-4">Project Setup Complete</h2>
          <p className="text-text-medium mb-6">
            The foundation is ready. Phase 1 implementation is underway.
          </p>
          <div className="inline-block bg-accent-teal text-white px-4 py-2 rounded-lg">
            ✓ Design System Initialized
          </div>
        </div>
      </section>
    </div>
  )
}
