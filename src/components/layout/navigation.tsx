'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Navigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [sessionState, setSessionState] = useState(session)
  const [shortName, setShortName] = useState('ABC Canada')

  useEffect(() => {
    fetch('/api/events?resource=org-settings')
      .then((r) => r.json() as Promise<{ settings?: { shortName?: string } }>)
      .then((data) => {
        if (data.settings?.shortName) setShortName(data.settings.shortName)
      })
      .catch(() => {})
  }, [])

  const isActive = (href: string) => pathname === href

  useEffect(() => {
    setSessionState(session)
  }, [session, status])

  const isAdmin = sessionState?.user?.role === 'ADMIN'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 font-poppins font-bold text-xl md:text-2xl text-primary-blue">
            <img src="/icon.svg" alt="" aria-hidden="true" className="w-8 h-8 rounded-full" />
            {shortName}
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') ? 'text-primary-blue bg-blue-50' : 'text-gray-700 hover:text-primary-blue hover:bg-gray-50'
              }`}
            >
              Home
            </Link>
            {!sessionState ? (
              <>
                <Link
                  href="/about"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/about') ? 'text-primary-blue bg-blue-50' : 'text-gray-700 hover:text-primary-blue hover:bg-gray-50'
                  }`}
                >
                  About
                </Link>
                <Link
                  href="/events"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/events') ? 'text-primary-blue bg-blue-50' : 'text-gray-700 hover:text-primary-blue hover:bg-gray-50'
                  }`}
                >
                  Events
                </Link>
                <Link
                  href="/gallery"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/gallery') ? 'text-primary-blue bg-blue-50' : 'text-gray-700 hover:text-primary-blue hover:bg-gray-50'
                  }`}
                >
                  Gallery
                </Link>
                <Link
                  href="/contact"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/contact') ? 'text-primary-blue bg-blue-50' : 'text-gray-700 hover:text-primary-blue hover:bg-gray-50'
                  }`}
                >
                  Contact
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/about"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/about') ? 'text-primary-blue bg-blue-50' : 'text-gray-700 hover:text-primary-blue hover:bg-gray-50'
                  }`}
                >
                  About
                </Link>
                <Link
                  href="/events"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/events') ? 'text-primary-blue bg-blue-50' : 'text-gray-700 hover:text-primary-blue hover:bg-gray-50'
                  }`}
                >
                  Events
                </Link>
                <Link
                  href="/gallery"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/gallery') ? 'text-primary-blue bg-blue-50' : 'text-gray-700 hover:text-primary-blue hover:bg-gray-50'
                  }`}
                >
                  Gallery
                </Link>
                <Link
                  href="/contact"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/contact') ? 'text-primary-blue bg-blue-50' : 'text-gray-700 hover:text-primary-blue hover:bg-gray-50'
                  }`}
                >
                  Contact
                </Link>
                <Link
                  href="/profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/profile') ? 'text-primary-blue bg-blue-50' : 'text-gray-700 hover:text-primary-blue hover:bg-gray-50'
                  }`}
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    href="/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/dashboard') ? 'text-primary-blue bg-blue-50' : 'text-gray-700 hover:text-primary-blue hover:bg-gray-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!sessionState ? (
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-blue hover:bg-primary-blue/90 rounded-md transition-colors"
              >
                Sign In
              </Link>
            ) : (
              <>
                <span className="text-sm text-gray-700">
                  {sessionState?.user?.name || sessionState?.user?.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-blue hover:bg-primary-blue/90 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
