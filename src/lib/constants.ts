/**
 * Application constants
 */

// Event categories
export const EVENT_CATEGORIES = [
  { id: 'workshop', label: 'Workshops' },
  { id: 'meditation', label: 'Meditation' },
  { id: 'social', label: 'Social' },
  { id: 'fundraiser', label: 'Fundraiser' },
  { id: 'educational', label: 'Educational' },
] as const

// Resource categories
export const RESOURCE_CATEGORIES = [
  { id: 'immigration', label: 'Immigration & Settlement' },
  { id: 'education', label: 'Education' },
  { id: 'career', label: 'Career Support' },
  { id: 'spirituality', label: 'Spirituality' },
  { id: 'health', label: 'Health & Wellness' },
] as const

// Resource types
export const RESOURCE_TYPES = [
  { id: 'guide', label: 'Guide' },
  { id: 'link', label: 'Link' },
  { id: 'document', label: 'Document' },
  { id: 'video', label: 'Video' },
] as const

// Gallery categories
export const GALLERY_CATEGORIES = [
  { id: 'events', label: 'Events' },
  { id: 'community', label: 'Community' },
  { id: 'activities', label: 'Activities' },
] as const

// Donation goal categories
export const DONATION_CATEGORIES = [
  { id: 'operational', label: 'Operational Costs' },
  { id: 'community', label: 'Community Programs' },
  { id: 'projects', label: 'Special Projects' },
  { id: 'scholarships', label: 'Student Scholarships' },
] as const

// Pagination
export const ITEMS_PER_PAGE = 12
export const ITEMS_PER_PAGE_EVENTS = 9
export const ITEMS_PER_PAGE_GALLERY = 12

// Form validation
export const MIN_PASSWORD_LENGTH = 8
export const MAX_MESSAGE_LENGTH = 5000
export const MAX_FILE_SIZE_MB = 10

// API endpoints (for future use)
export const API_ROUTES = {
  EVENTS: '/api/events',
  DONATIONS: '/api/donations',
  CONTACT: '/api/contact',
  RESOURCES: '/api/resources',
  GALLERY: '/api/gallery',
} as const

// Social media links
export const SOCIAL_LINKS = {
  facebook: 'https://facebook.com',
  twitter: 'https://twitter.com',
  youtube: 'https://youtube.com',
  linkedin: 'https://linkedin.com',
  instagram: 'https://instagram.com',
} as const

// Accessibility
export const FOCUS_RING_CLASSES = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-saffron'

// Animation delays
export const ANIMATION_DELAYS = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
} as const

// Breakpoints
export const BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const
