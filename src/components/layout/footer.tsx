import Link from 'next/link'

const footerLinks = {
  about: [
    { label: 'About Us', href: '/about' },
    { label: 'Our Mission', href: '/about#mission' },
    { label: 'Our Values', href: '/about#values' },
  ],
  community: [
    { label: 'Events', href: '/events' },
    { label: 'Gallery', href: '/gallery' },
  ],
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-text-dark text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary-saffron">🪷 ABC</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Ambedkarite Buddhist Community in Canada - Fostering unity, education, and social welfare.
            </p>
          </div>

          {/* About Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide">About</h4>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-primary-saffron transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide">Community</h4>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-primary-saffron transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          {/* Social Links */}
          <div className="flex justify-center gap-6 mb-6">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-primary-saffron transition-colors duration-200"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-primary-saffron transition-colors duration-200"
              aria-label="Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 002.856-9.97a9.98 9.98 0 01-2.806.996a4.96 4.96 0 00-8.64 4.53A14.05 14.05 0 012.735 2.3a4.96 4.96 0 001.536 6.618A4.902 4.902 0 012.16 13v.06a4.968 4.968 0 003.98 4.868a4.996 4.996 0 01-2.212.084a4.971 4.971 0 004.635 3.448A9.959 9.959 0 010 19.54a13.978 13.978 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-primary-saffron transition-colors duration-200"
              aria-label="YouTube"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center text-gray-400 text-sm">
            <p>
              © {currentYear} Ambedkarite Buddhist Community Canada. All rights reserved.
            </p>
            <p className="mt-2">
              <Link href="/privacy" className="hover:text-primary-saffron transition-colors duration-200">
                Privacy Policy
              </Link>
              {' '} | {' '}
              <Link href="/terms" className="hover:text-primary-saffron transition-colors duration-200">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
