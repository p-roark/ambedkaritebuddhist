'use client'

import { useEffect, useState } from 'react'

interface OrgSettings {
  shortName: string
  email: string
  orgName: string
  description: string
}

const defaults: OrgSettings = {
  shortName: 'ABC Canada',
  email: 'info@ambedkaritebuddhist.ca',
  orgName: 'Ambedkarite Buddhist Organization Canada',
  description: 'Fostering unity, education, and social welfare.',
}

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
        <div className="text-center space-y-4">
          {/* Logo/Name */}
          <div>
            <h3 className="font-poppins text-xl font-bold mb-2 text-primary-saffron">🪷 {org.shortName}</h3>
            <p className="text-gray-300 text-sm leading-relaxed font-noto-sans max-w-2xl mx-auto">
              {org.description}
            </p>
          </div>

          {/* Contact */}
          <div className="pt-6 pb-6">
            <p className="text-gray-300 text-sm">
              Email: <a href={`mailto:${org.email}`} className="hover:text-primary-saffron transition-colors">{org.email}</a>
            </p>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-700 pt-6">
            <p className="text-gray-400 text-sm">
              © {currentYear} {org.orgName}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
