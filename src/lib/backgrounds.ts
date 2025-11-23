// List of available background images
// This file maps to actual files in public/images/backgrounds/
export const AVAILABLE_BACKGROUNDS = [
  '/images/backgrounds/ambedkar-1.jpg',
  '/images/backgrounds/ambedkar-2.jpg',
  '/images/backgrounds/ambedkar-3.jpg',
  '/images/backgrounds/buddha-1.jpg',
  '/images/backgrounds/buddha-2.jpg',
  '/images/backgrounds/stupa-1.jpg',
  '/images/backgrounds/stupa-2.jpg',
]

/**
 * Get a random background image from the available list
 */
export function getRandomBackground(): string {
  const randomIndex = Math.floor(Math.random() * AVAILABLE_BACKGROUNDS.length)
  return AVAILABLE_BACKGROUNDS[randomIndex]
}
