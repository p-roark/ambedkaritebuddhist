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

  const navLinkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(href) ? 'text-primary-blue bg-blue-50' : 'text-gray-700 hover:text-primary-blue hover:bg-gray-50'
    }`

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 font-poppins font-bold text-xl md:text-2xl text-primary-blue">
            <img src="/icon.svg" alt="" aria-hidden="true" className="w-8 h-8 rounded-full" />
            {shortName}
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            <Link href="/" className={navLinkClass('/')}>Home</Link>
            <Link href="/about" className={navLinkClass('/about')}>About</Link>
            <Link href="/ambedkar" className={navLinkClass('/ambedkar')}>Dr. Ambedkar</Link>
            <Link href="/events" className={navLinkClass('/events')}>Events</Link>
            <Link href="/gallery" className={navLinkClass('/gallery')}>Gallery</Link>
            <Link href="/contact" className={navLinkClass('/contact')}>Contact</Link>
            {sessionState && (
              <>
                <Link href="/profile" className={navLinkClass('/profile')}>Profile</Link>
                {isAdmin && (
                  <Link href="/dashboard" className={navLinkClass('/dashboard')}>Dashboard</Link>
                )}
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Donate button — always visible */}
            <Link
              href="/donate"
              className="px-4 py-2 text-sm font-bold text-text-dark bg-primary-saffron hover:bg-primary-saffron/90 rounded-md transition-colors"
            >
              Donate
            </Link>

            {!sessionState ? (
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-blue hover:bg-primary-blue/90 rounded-md transition-colors"
              >
                Member Login
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
