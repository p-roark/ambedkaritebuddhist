/**
 * JSON-LD Schema generators for SEO structured data
 * Used for rich results in search engines
 */

export interface Organization {
  '@context': string
  '@type': string
  name: string
  description: string
  url: string
  logo: string
  email: string
  address: {
    '@type': string
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
    addressCountry: string
  }
  contactPoint: {
    '@type': string
    telephone: string
    contactType: string
  }
  sameAs: string[]
}

export interface LocalBusiness {
  '@context': string
  '@type': string
  name: string
  description: string
  url: string
  telephone: string
  email: string
  address: {
    '@type': string
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
    addressCountry: string
  }
  geo: {
    '@type': string
    latitude: number
    longitude: number
  }
  openingHoursSpecification: {
    '@type': string
    dayOfWeek: string[]
    opens: string
    closes: string
  }[]
  image: string
  priceRange: string
}

export interface EventSchema {
  '@context': string
  '@type': string
  name: string
  description: string
  image: string
  startDate: string
  endDate: string
  location: {
    '@type': string
    name: string
    address: {
      '@type': string
      streetAddress: string
      addressLocality: string
      addressRegion: string
      postalCode: string
      addressCountry: string
    }
  }
  organizer: {
    '@type': string
    name: string
    url: string
  }
  eventStatus: string
  eventAttendanceMode: string
  url: string
}

/**
 * Generate Organization schema for ABCC
 */
export function generateOrganizationSchema(siteUrl: string): Organization {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ambedkarite Buddhist Community of Canada (ABCC)',
    description: 'A registered non-profit organization in Ontario for Ambedkarite Buddhist families. We practice the Dhamma, celebrate Dr. Ambedkar\'s legacy, and build community in Canada.',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    email: 'ambedkaritebuddhist@outlook.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '',
      addressLocality: 'Ontario',
      addressRegion: 'ON',
      postalCode: '',
      addressCountry: 'CA',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '',
      contactType: 'General',
    },
    sameAs: [
      'https://www.facebook.com/ambedkaritebuddhist',
      'https://www.instagram.com/ambedkaritebuddhist',
    ],
  }
}

/**
 * Generate LocalBusiness schema for location-based search
 */
export function generateLocalBusinessSchema(siteUrl: string): LocalBusiness {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Ambedkarite Buddhist Community of Canada',
    description: 'A registered non-profit Buddhist community serving Ontario and beyond.',
    url: siteUrl,
    telephone: '',
    email: 'ambedkaritebuddhist@outlook.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '',
      addressLocality: 'Ontario',
      addressRegion: 'ON',
      postalCode: '',
      addressCountry: 'CA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 43.6629,
      longitude: -79.3957,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    image: `${siteUrl}/logo.png`,
    priceRange: '$',
  }
}

/**
 * Generate Event schema for structured event data
 */
export function generateEventSchema(
  eventData: {
    name: string
    description: string
    image: string
    startDate: Date | string
    endDate: Date | string
    location: string
    url: string
  },
  siteUrl: string
): EventSchema {
  const startDate = typeof eventData.startDate === 'string'
    ? eventData.startDate
    : eventData.startDate.toISOString()

  const endDate = typeof eventData.endDate === 'string'
    ? eventData.endDate
    : eventData.endDate.toISOString()

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: eventData.name,
    description: eventData.description,
    image: eventData.image,
    startDate,
    endDate,
    location: {
      '@type': 'Place',
      name: eventData.location,
      address: {
        '@type': 'PostalAddress',
        streetAddress: '',
        addressLocality: 'Ontario',
        addressRegion: 'ON',
        postalCode: '',
        addressCountry: 'CA',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Ambedkarite Buddhist Community of Canada (ABCC)',
      url: siteUrl,
    },
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: eventData.url,
  }
}
