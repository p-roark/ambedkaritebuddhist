// Utility functions to work with event images
// Images are now defined in events.json with an 'images' array field per event

interface EventData {
  pastEvents: Array<{
    id: string
    images?: string[]
    imageFolder: string
    [key: string]: any
  }>
  upcomingEvents: Array<{
    id: string
    images?: string[]
    imageFolder: string
    [key: string]: any
  }>
}

export async function getEventImages(eventId: string, eventsData?: EventData): Promise<string[]> {
  // If events data is provided, use the images array from it
  if (eventsData) {
    const event = [
      ...eventsData.pastEvents,
      ...eventsData.upcomingEvents,
    ].find((e) => e.id === eventId)

    if (event && event.images && event.imageFolder) {
      return event.images.map((img) => `${event.imageFolder}${img}`)
    }
  }

  // Fallback: try to fetch events.json to get the images array
  try {
    const response = await fetch('/data/events.json')
    const data: EventData = await response.json()
    const event = [
      ...data.pastEvents,
      ...data.upcomingEvents,
    ].find((e) => e.id === eventId)

    if (event && event.images && event.imageFolder) {
      return event.images.map((img) => `${event.imageFolder}${img}`)
    }
  } catch (error) {
    console.error('Error fetching event images:', error)
  }

  // Return empty array if no images found
  return []
}

export function getRandomEventImage(images: string[]): string {
  if (images.length === 0) return ''
  const randomIndex = Math.floor(Math.random() * images.length)
  return images[randomIndex]
}
