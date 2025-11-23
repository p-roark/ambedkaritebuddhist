'use client'

import { useEffect, useState } from 'react'

interface SocialLink {
  platform: string
  url: string
  icon: string
}

interface ContactInfo {
  email: string
  phone: string
}

interface ContactData {
  contact: ContactInfo
  socialLinks: SocialLink[]
}

export default function Contact() {
  const [data, setData] = useState<ContactData | null>(null)
  const [loading, setLoading] = useState(true)

  // Google Form embed URL
  const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScEF09yqKKh_hBUoCnMvR7jZQxp8KPf9PvCGT4aLaH5Ruacbg/viewform?embedded=true'

  useEffect(() => {
    const loadContactData = async () => {
      try {
        const response = await fetch('/data/contact.json')
        const contactData: ContactData = await response.json()
        setData(contactData)
      } catch (error) {
        console.error('Failed to load contact data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContactData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-lg text-text-medium">Loading...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-lg text-text-medium">Failed to load contact page</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-blue via-accent-purple to-accent-orange py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            We&apos;d love to hear from you. Reach out with any questions, suggestions, or if you&apos;d like to join our community.
          </p>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Details */}
          <div>
            <h2 className="text-3xl font-bold text-text-dark mb-8">
              Contact Information
            </h2>

            <div className="space-y-6">
              {/* Email */}
              <div>
                <p className="text-sm font-semibold text-text-medium mb-1">
                  Email
                </p>
                <a
                  href={`mailto:${data.contact.email}`}
                  className="text-lg text-primary-blue hover:text-primary-saffron transition-colors"
                >
                  {data.contact.email}
                </a>
              </div>

              {/* Phone */}
              <div>
                <p className="text-sm font-semibold text-text-medium mb-1">
                  Phone
                </p>
                <a
                  href={`tel:${data.contact.phone}`}
                  className="text-lg text-primary-blue hover:text-primary-saffron transition-colors"
                >
                  {data.contact.phone}
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-12">
              <h3 className="text-xl font-bold text-text-dark mb-4">
                Follow Us
              </h3>
              <div className="flex gap-4">
                {data.socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-12 h-12 bg-primary-saffron text-white rounded-full hover:bg-primary-blue transition-colors duration-200"
                    aria-label={link.platform}
                  >
                    {link.platform === 'Facebook' && (
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    )}
                    {link.platform === 'Twitter' && (
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.953 4.57a10 10 0 002.856-9.97a9.98 9.98 0 01-2.806.996a4.96 4.96 0 00-8.64 4.53A14.05 14.05 0 012.735 2.3a4.96 4.96 0 001.536 6.618A4.902 4.902 0 012.16 13v.06a4.968 4.968 0 003.98 4.868a4.996 4.996 0 01-2.212.084a4.971 4.971 0 004.635 3.448A9.959 9.959 0 010 19.54a13.978 13.978 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    )}
                    {link.platform === 'YouTube' && (
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Google Form Embed */}
          <div>
            <h2 className="text-3xl font-bold text-text-dark mb-8">
              Send us a Message
            </h2>

            <div className="bg-gray-50 rounded-lg overflow-hidden shadow-sm">
              <iframe
                src={GOOGLE_FORM_URL}
                width="100%"
                height="600"
                frameBorder="0"
                marginHeight={0}
                marginWidth={0}
                className="w-full"
              >
                Loading…
              </iframe>
            </div>

            <p className="text-sm text-text-medium mt-4">
              Or email us directly at{' '}
              <a href={`mailto:${data.contact.email}`} className="text-primary-blue hover:text-primary-saffron font-semibold">
                {data.contact.email}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
