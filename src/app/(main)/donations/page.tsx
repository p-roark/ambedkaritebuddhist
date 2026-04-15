import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Donate | ABCC',
  description: 'Support the Ambedkarite Buddhist Community of Canada. Your donation helps us celebrate our heritage, build community, and advance Dr. Ambedkar\'s ideals.',
  openGraph: {
    title: 'Donate | ABCC',
    description: 'Support ABCC through secure Interac e-Transfer donations',
    type: 'website',
    url: 'https://www.ambedkaritebuddhist.org/donations',
    images: [{ url: '/images/logo.png', width: 1200, height: 630 }],
  },
  keywords: ['donate', 'fundraise', 'support', 'ABCC', 'nonprofit', 'charity'],
}

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl md:text-5xl font-bold text-text-dark mb-12">Support Our Community</h1>

        {/* How to Donate Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-text-dark mb-6">How to Donate</h2>
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
            <p className="text-lg text-gray-700 mb-4">
              We accept donations via <strong>Interac e-Transfer</strong> — secure, instant, and direct.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Send your e-transfers to <strong>ambedkaritebuddhist@outlook.com</strong> - instructions will follow after you submit.
            </p>
            <p className="text-base text-gray-600">
              ABCC is a registered non-profit in Ontario. A donation acknowledgment will be provided by email. Please note: as a non-profit corporation, ABCC is not currently a registered charity with CRA and cannot issue official tax receipts at this time. We are working toward registered charity status.
            </p>
          </div>
        </div>

        {/* Donation Instructions Section */}
        <div>
          <h2 className="text-3xl font-bold text-text-dark mb-6">Donation Instructions</h2>
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-saffron text-white flex items-center justify-center font-bold">
                1
              </span>
              <span className="text-lg text-gray-700 pt-1">Fill out the donation form.</span>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-saffron text-white flex items-center justify-center font-bold">
                2
              </span>
              <span className="text-lg text-gray-700 pt-1">
                Open your banking app and send an Interac e-Transfer to: <strong>ambedkaritebuddhist@outlook.com</strong>
              </span>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-saffron text-white flex items-center justify-center font-bold">
                3
              </span>
              <span className="text-lg text-gray-700 pt-1">
                In the message/note field, include your full name and <strong>"ABCC Donation."</strong>
              </span>
            </li>
          </ol>
          <p className="mt-8 text-lg text-gray-700 p-6 bg-blue-50 rounded-lg border border-primary-blue/20">
            You'll receive a confirmation email from ABCC once your donation is received.
          </p>
        </div>
      </section>
    </div>
  )
}
