'use client'

import Link from 'next/link'

export default function MembershipPage() {
  const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScEF09yqKKh_hBUoCnMvR7jZQxp8KPf9PvCGT4aLaH5Ruacbg/viewform?embedded=true'

  const joinSteps = [
    {
      number: '1️⃣',
      title: 'Get a Referral',
      description: 'Connect with an existing member to receive a referral link.',
    },
    {
      number: '2️⃣',
      title: 'Apply',
      description: 'Complete the membership application form using your referral link.',
    },
    {
      number: '3️⃣',
      title: 'Welcome!',
      description: 'After approval, you\'ll receive full access to member benefits.',
    },
  ]

  const faqs = [
    {
      question: 'How does the referral system work?',
      answer: 'You need a referral link or code from an existing member to apply. This helps us maintain a connected community and ensures new members have a community contact.',
    },
    {
      question: 'How long does approval take?',
      answer: 'Most applications are reviewed within 2-3 business days. You\'ll receive an email notification once your application has been approved.',
    },
    {
      question: 'What if I don\'t have a referral link?',
      answer: 'Attend one of our community events to meet existing members, or contact us directly and we\'ll help connect you with someone from the community.',
    },
    {
      question: 'What if I move to a different city?',
      answer: 'Your membership is valid across all our chapters in Canada. Simply update your address in the member portal, and you can participate in activities at any location.',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-blue via-accent-purple to-accent-orange py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Become a Member</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Join our vibrant community through our referral-based membership system. Membership is completely free!
          </p>
        </div>
      </section>

      {/* How to Join Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm md:text-base font-bold text-primary-saffron uppercase tracking-wider mb-4">Join Us</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent">
              How to Become a Member
            </h2>
            <p className="text-base md:text-lg text-text-medium leading-relaxed">
              Our community grows through referrals from existing members
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {joinSteps.map((step, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-background-light p-8 text-center"
              >
                <div className="text-5xl mb-4">{step.number}</div>
                <h3 className="text-xl md:text-2xl font-bold text-text-dark mb-3">{step.title}</h3>
                <p className="text-text-medium">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Need Help Card */}
      <section className="py-20 md:py-28 bg-background-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-background-light p-8 md:p-12 mb-12">
            <div className="text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-text-dark mb-4">Don't Have a Referral Link?</h3>
              <p className="text-text-medium text-lg mb-6 max-w-2xl mx-auto">
                No problem! Reach out to us and we'll help you get connected with existing members in our community. We're here to welcome new people.
              </p>
              <Link
                href="/contact"
                className="inline-block px-8 py-3 bg-gradient-to-r from-primary-saffron to-accent-orange text-text-dark font-bold rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text-dark">Membership Application</h2>
            <p className="text-text-medium text-lg">Complete the form below to join our community. Membership is completely free!</p>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-background-light">
            <iframe
              src={GOOGLE_FORM_URL}
              width="100%"
              height="1000"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              className="w-full"
            >
              Loading…
            </iframe>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm md:text-base font-bold text-primary-saffron uppercase tracking-wider mb-4">Questions</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-blue to-accent-purple bg-clip-text text-transparent">
              Membership FAQs
            </h2>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-background-light rounded-2xl overflow-hidden shadow-sm border border-gray-200 p-8"
              >
                <h4 className="text-lg md:text-xl font-bold text-text-dark mb-3">{faq.question}</h4>
                <p className="text-text-medium leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary-blue to-accent-purple">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Join?</h3>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Fill out the membership application form above or contact us if you have any questions about the referral process.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-white text-primary-blue font-bold rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  )
}
