/**
 * TypeScript interfaces and types for the Ambedkarite Buddhist Community website
 */

// Community Info
export interface CommunityInfo {
  name: string
  description: string
  founded: number
  vision: string
  mission: string
  values: string[]
}

// Team Member
export interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  image: string
  email?: string
}

// Event
export interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  image: string
  category: 'workshop' | 'meditation' | 'social' | 'fundraiser' | 'educational'
  capacity?: number
  registrationUrl?: string
}

// Donation Goal
export interface DonationGoal {
  id: string
  title: string
  description: string
  targetAmount: number
  currentAmount: number
  deadline: string
  image: string
  category: 'operational' | 'community' | 'projects' | 'scholarships'
}

// Membership Tier
export interface MembershipTier {
  id: string
  name: string
  description: string
  price: number
  benefits: string[]
  recommended?: boolean
}

// Resource
export interface Resource {
  id: string
  title: string
  description: string
  category: 'immigration' | 'education' | 'career' | 'spirituality' | 'health'
  type: 'guide' | 'link' | 'document' | 'video'
  url?: string
  filePath?: string
  author?: string
}

// Gallery Item
export interface GalleryItem {
  id: string
  title: string
  description: string
  image: string
  thumbnail: string
  eventId?: string
  category: 'events' | 'community' | 'activities'
  date: string
}

// Navigation Link
export interface NavLink {
  label: string
  href: string
  active?: boolean
}
