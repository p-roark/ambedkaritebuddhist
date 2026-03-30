'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface OrgSettings {
  shortName: string
  email: string
  orgName: string
  description: string
}

const defaults: OrgSettings = {
  shortName: 'ABCC',
  email: 'info@ambedkaritebuddhist.org',
  orgName: 'Ambedkarite Buddhist Community Of Canada (ABCC)',
  description: 'Fostering unity, education, and the Dhamma in Canada.',
}

const QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Events', href: '/events' },
  { label: 'Dr. Ambedkar', href: '/ambedkar' },
  { label: 'Contact', href: '/contact' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [org, setOrg] = useState<OrgSettings>(defaults)

  useEffect(() => {
    fetch('/api/events?resource=org-settings')
      .then((r) => r.json() as Promise<{ settings?: Partial<OrgSettings> }>)
      .then((data) => {
        if (data.settings) {
          setOrg({
            shortName: data.settings.shortName ?? defaults.shortName,
            email: data.settings.email ?? defaults.email,
            orgName: data.settings.orgName ?? defaults.orgName,
            description: data.settings.description ?? defaults.description,
          })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <footer className="bg-text-dark text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/images/logo.jpg" alt="ABCC logo" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              <h3 className="font-poppins font-bold text-primary-saffron leading-tight">
                <span className="block text-base">{org.orgName.split('(')[0].trim()}</span>
                {org.orgName.includes('(') && (
                  <span className="block text-sm font-semibold text-primary-saffron/80">({org.orgName.split('(')[1]}</span>
                )}
              </h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed font-noto-sans">
              {org.description}
            </p>
            <p className="text-gray-400 text-sm flex items-center gap-1.5">
              <span>📍</span> Ontario, Canada
            </p>
            <span className="inline-block text-xs px-3 py-1 rounded-full bg-white/10 border border-white/20 text-gray-300">
              Registered Non-Profit in Ontario
            </span>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-primary-saffron uppercase tracking-widest">Quick Links</h4>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 text-sm hover:text-primary-saffron transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-primary-saffron uppercase tracking-widest">Connect</h4>
            <p className="text-gray-300 text-sm">
              Email:{' '}
              <a href={`mailto:${org.email}`} className="hover:text-primary-saffron transition-colors">
                {org.email}
              </a>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} {org.orgName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
