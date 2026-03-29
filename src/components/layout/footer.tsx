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
              <img src="/icon.svg" alt="" aria-hidden="true" className="w-8 h-8 rounded-full flex-shrink-0" />
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
            <div className="flex items-center gap-3 pt-2">
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-300 hover:text-primary-saffron hover:border-primary-saffron transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-300 hover:text-primary-saffron hover:border-primary-saffron transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-300 hover:text-primary-saffron hover:border-primary-saffron transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
                </svg>
              </a>
            </div>
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
