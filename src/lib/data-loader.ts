/**
 * Data loader utility for fetching and parsing JSON data files
 */

import type {
  CommunityInfo,
  Event,
  DonationGoal,
  TeamMember,
  Resource,
  GalleryItem,
  MembershipTier,
} from '@/types'

const DATA_PATH = '/data'

/**
 * Fetch and parse JSON data file
 */
async function fetchData<T>(filename: string): Promise<T> {
  try {
    const response = await fetch(`${DATA_PATH}/${filename}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Error loading ${filename}:`, error)
    throw error
  }
}

/**
 * Get community info
 */
export async function getCommunityInfo(): Promise<CommunityInfo> {
  return fetchData<CommunityInfo>('community-info.json')
}

/**
 * Get all events
 */
export async function getEvents(): Promise<Event[]> {
  return fetchData<Event[]>('events.json')
}

/**
 * Get single event by ID
 */
export async function getEventById(id: string): Promise<Event | null> {
  const events = await getEvents()
  return events.find((event) => event.id === id) || null
}

/**
 * Get events filtered by category
 */
export async function getEventsByCategory(category: Event['category']): Promise<Event[]> {
  const events = await getEvents()
  return events.filter((event) => event.category === category)
}

/**
 * Get upcoming events (sorted by date)
 */
export async function getUpcomingEvents(): Promise<Event[]> {
  const events = await getEvents()
  const now = new Date()
  return events
    .filter((event) => new Date(event.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

/**
 * Get all donation goals
 */
export async function getDonationGoals(): Promise<DonationGoal[]> {
  return fetchData<DonationGoal[]>('donations.json')
}

/**
 * Get single donation goal by ID
 */
export async function getDonationGoalById(id: string): Promise<DonationGoal | null> {
  const goals = await getDonationGoals()
  return goals.find((goal) => goal.id === id) || null
}

/**
 * Get team members
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  return fetchData<TeamMember[]>('team.json')
}

/**
 * Get resources filtered by category
 */
export async function getResourcesByCategory(
  category: Resource['category']
): Promise<Resource[]> {
  const resources = await getResources()
  return resources.filter((resource) => resource.category === category)
}

/**
 * Get all resources
 */
export async function getResources(): Promise<Resource[]> {
  return fetchData<Resource[]>('resources.json')
}

/**
 * Get gallery items
 */
export async function getGalleryItems(): Promise<GalleryItem[]> {
  return fetchData<GalleryItem[]>('gallery.json')
}

/**
 * Get gallery items filtered by category
 */
export async function getGalleryItemsByCategory(
  category: GalleryItem['category']
): Promise<GalleryItem[]> {
  const items = await getGalleryItems()
  return items.filter((item) => item.category === category)
}

/**
 * Get gallery items for specific event
 */
export async function getGalleryItemsByEvent(eventId: string): Promise<GalleryItem[]> {
  const items = await getGalleryItems()
  return items.filter((item) => item.eventId === eventId)
}

/**
 * Get membership tiers
 */
export async function getMembershipTiers(): Promise<MembershipTier[]> {
  return fetchData<MembershipTier[]>('membership.json')
}
