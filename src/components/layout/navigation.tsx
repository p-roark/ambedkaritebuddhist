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
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetch('/api/events?resource=org-settings')
      .then((r) => r.json() as Promise<{ settings?: { shortName?: string } }>)
      .then((data) => {
        if (data.settings?.shortName) setShortName(data.settings.shortName)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setSessionState(session)
  }, [session, status])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isAdmin = sessionState?.user?.role === 'ADMIN'

  const isActive = (href: string) => pathname === href

  const navLinkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(href) ? 'text-primary-blue bg-blue-50' : 'text-gray-700 hover:text-primary-blue hover:bg-gray-50'
    }`

  const mobileNavLinkClass = (href: string) =>
    `block px-4 py-3 text-sm font-medium transition-colors rounded-md ${
      isActive(href) ? 'text-primary-blue bg-blue-50' : 'text-gray-700 hover:text-primary-blue hover:bg-gray-50'
    }`

  const NAV_LINKS = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/ambedkar', label: 'Dr. Ambedkar' },
    { href: '/events', label: 'Events' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 font-poppins font-bold text-xl md:text-2xl text-primary-blue">
            <img src="/icon.svg" alt="" aria-hidden="true" className="w-8 h-8 rounded-full" />
            {shortName}
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass(link.href)}>
                {link.label}
              </Link>
            ))}
            {sessionState && (
              <>
                <Link href="/profile" className={navLinkClass('/profile')}>Profile</Link>
                {isAdmin && (
                  <Link href="/dashboard" className={navLinkClass('/dashboard')}>Dashboard</Link>
                )}
              </>
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-2">
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
                <span className="text-sm text-gray-700 max-w-[120px] truncate">
                  {sessionState?.user?.name || sessionState?.user?.email}
                </span>
                <button
                  onClick={() => void signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-blue hover:bg-primary-blue/90 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>

          {/* Mobile: Donate + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/donate"
              className="px-3 py-1.5 text-xs font-bold text-text-dark bg-primary-saffron hover:bg-primary-saffron/90 rounded-md transition-colors"
            >
              Donate
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {mobileOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 shadow-lg">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={mobileNavLinkClass(link.href)}>
              {link.label}
            </Link>
          ))}
          {sessionState && (
            <>
              <Link href="/profile" className={mobileNavLinkClass('/profile')}>Profile</Link>
              {isAdmin && (
                <Link href="/dashboard" className={mobileNavLinkClass('/dashboard')}>Dashboard</Link>
              )}
            </>
          )}
          <div className="pt-2 border-t border-gray-100 mt-2">
            {!sessionState ? (
              <Link
                href="/auth/login"
                className="block w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-primary-blue hover:bg-primary-blue/90 rounded-md transition-colors"
              >
                Member Login
              </Link>
            ) : (
              <button
                onClick={() => void signOut({ callbackUrl: '/' })}
                className="block w-full text-center px-4 py-2.5 text-sm font-medium text-white bg-primary-blue hover:bg-primary-blue/90 rounded-md transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
