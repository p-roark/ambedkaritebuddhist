export default function Home() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        {/* Construction Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-saffron/10 mb-6">
            <svg
              className="w-12 h-12 text-primary-saffron"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-text-dark mb-4 font-poppins">
          Website Under Construction
        </h1>

        <p className="text-lg md:text-xl text-text-medium mb-12 max-w-2xl mx-auto">
          We're building something special for our community. Stay tuned for updates!
        </p>

        {/* Divider */}
        <div className="w-24 h-1 bg-primary-saffron mx-auto mb-12"></div>

        {/* About Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 mb-8 text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-text-dark mb-6 font-poppins text-center">
            About Our Community
          </h2>

          <div className="space-y-4 text-text-medium leading-relaxed">
            <p>
              Welcome to the <strong className="text-text-dark">Ambedkarite Buddhist Community</strong> in Canada.
              We are a nonprofit organization dedicated to fostering unity, education, and social welfare
              based on the teachings of <strong className="text-text-dark">Dr. B.R. Ambedkar</strong> and the principles of Buddhism.
            </p>

            <p>
              Our mission is to build an inclusive digital home for Ambedkarite Buddhists across Canada,
              providing support for newcomers, celebrating our rich cultural heritage, and maintaining
              transparency in all our community operations.
            </p>

            <div className="bg-primary-saffron/5 border-l-4 border-primary-saffron p-6 my-6 rounded-r">
              <p className="text-text-dark italic">
                "Educate, Agitate, Organize" - Dr. B.R. Ambedkar
              </p>
            </div>

            <p>
              Through this platform, we aim to:
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Connect Ambedkarite Buddhists across Canada</li>
              <li>Organize cultural events and celebrations</li>
              <li>Support students and newcomers to Canada</li>
              <li>Promote the teachings of Dr. Ambedkar and Buddhism</li>
              <li>Facilitate community engagement and growth</li>
            </ul>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-primary-blue/5 rounded-lg p-8 border border-primary-blue/10">
          <h2 className="text-2xl font-bold text-text-dark mb-4 font-poppins">
            Get in Touch
          </h2>

          <p className="text-text-medium mb-6">
            Have questions or want to learn more about our community?
          </p>

          <div className="flex items-center justify-center gap-3 text-primary-blue">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <a
              href="mailto:info@ambedkaritebuddhist.ca"
              className="text-lg font-semibold hover:underline"
            >
              info@ambedkaritebuddhist.ca
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-sm text-text-light mt-12">
          Ambedkarite Buddhist Organization Canada - Nonprofit Community
        </p>
      </div>
    </div>
  )
}
