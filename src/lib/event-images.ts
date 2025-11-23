// Utility functions to work with event images

export async function getEventImages(eventId: string, maxImages: number = 14): Promise<string[]> {
  const baseFolder = `/images/events/${eventId}`
  const images: string[] = []

  // Generate image paths based on the numbered files (1 to maxImages)
  for (let i = 1; i <= maxImages; i++) {
    const imagePath = `${baseFolder}/${i}.jpeg`
    images.push(imagePath)
  }

  return images
}

export function getRandomEventImage(images: string[]): string {
  if (images.length === 0) return ''
  const randomIndex = Math.floor(Math.random() * images.length)
  return images[randomIndex]
}
