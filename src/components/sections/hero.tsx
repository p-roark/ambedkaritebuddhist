'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { AVAILABLE_BACKGROUNDS } from '@/lib/backgrounds'
import { normalizeImagePath } from '@/lib/image-path'

interface HeroProps {
  title: string
  description: string
  image?: string
  overlayImage?: string
  buttons?: Array<{
    label: string
    href: string
    variant: 'primary' | 'secondary' | 'outline'
  }>
  layout?: 'single' | 'two-column'
  fullHeight?: boolean
}

export function Hero({
  title,
  description,
  image,
  overlayImage: _overlayImage,
  buttons,
  layout = 'single',
  fullHeight = true,
}: HeroProps) {
  const heightClass = fullHeight ? 'min-h-[70vh]' : 'min-h-[75vh]'

  // Use state for background image and event selection
  const [backgroundImage, setBackgroundImage] = useState<string>('')
  const [randomEventImage, setRandomEventImage] = useState<string>('')
  const [randomEventName, setRandomEventName] = useState<string>('')
  const [randomEventDate, setRandomEventDate] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Pick a random background image
        const randomBgIndex = Math.floor(Math.random() * AVAILABLE_BACKGROUNDS.length)
        setBackgroundImage(AVAILABLE_BACKGROUNDS[randomBgIndex])

        // Load DB-backed events and pick one for the hero side image.
        const eventsRes = await fetch('/api/events', { cache: 'no-store' })
        const eventsData = await eventsRes.json() as {
          events?: Array<{ title?: string; date?: string; coverImage?: string; status?: string }>
        }
        const allEvents = eventsData.events || []
        const activeEvents = allEvents.filter((e) => e.status !== 'Event Ended' && e.coverImage)
        if (activeEvents.length > 0) {
          const randomEventIndex = Math.floor(Math.random() * activeEvents.length)
          const selectedEvent = activeEvents[randomEventIndex]
          setRandomEventImage(normalizeImagePath(selectedEvent.coverImage, ''))
          setRandomEventName(selectedEvent.title ?? '')
          setRandomEventDate(selectedEvent.date ?? '')
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Use a default image during SSR
  const displayOverlayImage = backgroundImage
  const displayRightImage = normalizeImagePath(randomEventImage || image || displayOverlayImage, '/images/backgrounds/ambedkar-1.jpg')

  if (isLoading || !backgroundImage) {
    return (
      <div
        className={`${heightClass} animate-pulse`}
        style={{ background: 'linear-gradient(135deg, #2D4D9B 0%, #7F56D9 55%, #FF6B35 100%)' }}
      />
    )
  }

  if (layout === 'two-column' && image) {
    return (
      <section
        className={`${heightClass} flex items-center justify-center relative overflow-hidden`}
        style={{
          background: 'linear-gradient(135deg, #2D4D9B 0%, #7F56D9 50%, #FF6B35 100%)',
        }}
      >
        {/* Overlay image on background */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url(${displayOverlayImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Fade overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
            {/* Text Content */}
            <div className="space-y-6">
              <h1 className="font-poppins text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg">
                {title}
              </h1>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed drop-shadow font-noto-sans">
                {description}
              </p>

              {/* Buttons */}
              {buttons && buttons.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  {buttons.map((button) => (
                    <Link
                      key={button.href}
                      href={button.href}
                      className={`inline-block px-8 py-3 rounded-full font-bold text-center transition-all duration-200 ${
                        button.variant === 'primary'
                          ? 'bg-white text-primary-blue hover:shadow-lg hover:-translate-y-1'
                          : button.variant === 'secondary'
                          ? 'bg-primary-saffron text-text-dark hover:shadow-lg hover:-translate-y-1'
                          : 'border-2 border-white text-white hover:bg-white hover:text-primary-blue'
                      }`}
                    >
                      {button.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Image */}
            <div className="relative h-[400px] md:h-[500px]">
              <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={displayRightImage}
                  alt={randomEventName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              
              {/* Event name overlay */}
              {randomEventName && (
                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <p className="text-white text-sm md:text-base font-semibold text-center drop-shadow-lg">
                    {randomEventName}
                  </p>
                  {randomEventDate && (
                    <p className="text-white text-xs md:text-sm text-center drop-shadow-lg mt-1">
                      {randomEventDate}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Single column layout
  return (
    <section className={`${heightClass} flex items-center justify-center bg-gradient-to-br from-primary-blue via-accent-purple to-accent-orange`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-center">
        <h1 className="font-poppins text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed font-noto-sans">
          {description}
        </p>

        {buttons && buttons.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {buttons.map((button) => (
              <Link
                key={button.href}
                href={button.href}
                className={`inline-block px-8 py-3 rounded-full font-bold transition-all duration-200 ${
                  button.variant === 'primary'
                    ? 'bg-white text-primary-blue hover:shadow-lg hover:-translate-y-1'
                    : button.variant === 'secondary'
                    ? 'bg-primary-saffron text-text-dark hover:shadow-lg hover:-translate-y-1'
                    : 'border-2 border-white text-white hover:bg-white hover:text-primary-blue'
                }`}
              >
                {button.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
