'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  formatGalleryDate,
  getImageSrc,
  getWrappedIndex,
  parseImageKeys,
} from './gallery-utils'

type DbEvent = {
  id: string
  title: string
  date: string
  location: string
  description: string
  status: 'Upcoming' | 'Registration Started' | 'Event Ended'
  eventImages: string
  googleDriveFolderUrl: string | null
}

type EventWithImages = {
  id: string
  title: string
  date: string
  location: string
  description: string
  status: DbEvent['status']
  imageKeys: string[]
  googleDriveFolderUrl: string | null
}

const PAGE_SIZE = 12

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 000-1.68L9.54 5.98A1 1 0 008 6.82z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M8 6.75A.75.75 0 018.75 6h1.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-1.5A.75.75 0 018 17.25V6.75zm5 0A.75.75 0 0113.75 6h1.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V6.75z" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M9 4H4v5M15 4h5v5M20 15v5h-5M4 15v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatusBadge({ status }: { status: EventWithImages['status'] }) {
  const classes = status === 'Event Ended'
    ? 'bg-white/10 text-white border-white/15'
    : status === 'Registration Started'
      ? 'bg-emerald-500/15 text-emerald-100 border-emerald-300/20'
      : 'bg-blue-500/15 text-blue-100 border-blue-300/20'

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${classes}`}>
      {status}
    </span>
  )
}

type LightboxProps = {
  event: EventWithImages
  currentIndex: number | null
  onClose: () => void
  onSelect: (index: number) => void
}

function GalleryLightbox({ event, currentIndex, onClose, onSelect }: LightboxProps) {
  const isOpen = currentIndex !== null

  useEffect(() => {
    if (!isOpen) return

    // Only listen for arrow keys on desktop
    if (window.innerWidth < 640) return

    const handleKeyDown = (eventKey: KeyboardEvent) => {
      if (eventKey.key === 'Escape') onClose()
      if (eventKey.key === 'ArrowLeft') onSelect((currentIndex ?? 0) - 1)
      if (eventKey.key === 'ArrowRight') onSelect((currentIndex ?? 0) + 1)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, isOpen, onClose, onSelect])

  if (!isOpen || currentIndex === null) return null

  const currentKey = event.imageKeys[getWrappedIndex(currentIndex, event.imageKeys.length)]
  const displayIndex = getWrappedIndex(currentIndex, event.imageKeys.length)

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/95 px-4 py-6 backdrop-blur-md sm:px-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${event.title} slideshow`}
    >
      <div
        className="mx-auto flex h-full max-w-6xl flex-col gap-4"
        onClick={(modalEvent) => modalEvent.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 text-white">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.28em] text-white/50">Photo viewer</p>
            <h2 className="truncate text-xl font-semibold sm:text-2xl">{event.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close slideshow"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-2xl">
          <img
            src={getImageSrc(currentKey)}
            alt={`${event.title} - Photo ${displayIndex + 1}`}
            className="h-full w-full object-contain"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-6 py-6 text-white">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-white/70">{event.date} • {event.location}</p>
                <p className="mt-1 text-lg font-medium">Photo {displayIndex + 1} of {event.imageKeys.length}</p>
              </div>
            </div>
          </div>

          {event.imageKeys.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => onSelect(displayIndex - 1)}
                className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white transition hover:bg-black/70"
                aria-label="Previous photo"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                onClick={() => onSelect(displayIndex + 1)}
                className="absolute right-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white transition hover:bg-black/70"
                aria-label="Next photo"
              >
                <ChevronRightIcon />
              </button>
            </>
          )}
        </div>

        {event.imageKeys.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {event.imageKeys.map((key, index) => {
              const isActive = index === displayIndex

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelect(index)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border transition ${
                    isActive
                      ? 'border-primary-saffron ring-2 ring-primary-saffron/40'
                      : 'border-white/10 opacity-75 hover:opacity-100'
                  }`}
                  aria-label={`View photo ${index + 1}`}
                >
                  <img src={getImageSrc(key)} alt="" className="h-full w-full object-cover" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function GalleryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [events, setEvents] = useState<EventWithImages[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventWithImages | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    const loadEventGalleries = async () => {
      try {
        const response = await fetch('/api/events', { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to load events')

        const data = (await response.json()) as { events: DbEvent[] }
        const eventsData = data.events

        // Fetch Drive images for events that have a Google Drive folder URL
        const driveImagesByEventId = new Map<string, string[]>()
        const driveFetches = eventsData
          .filter((e) => e.googleDriveFolderUrl)
          .map(async (e) => {
            const match = e.googleDriveFolderUrl?.match(/\/folders\/([a-zA-Z0-9_-]+)/)
            const folderId = match?.[1]
            if (!folderId) return
            try {
              const res = await fetch(`/api/events/drive-images?folderId=${encodeURIComponent(folderId)}`)
              if (!res.ok) return
              const driveData = (await res.json()) as { images: Array<{ id: string; name: string }> }
              const keys = (driveData.images ?? []).map((img) => `gdrive:${img.id}`)
              if (keys.length > 0) driveImagesByEventId.set(e.id, keys)
            } catch {
              // ignore individual Drive fetch failures
            }
          })
        await Promise.all(driveFetches)

        const eventsWithImages: EventWithImages[] = eventsData
          .map((event) => {
            // Drive folder takes precedence over R2 images when Drive images are available
            const driveKeys = driveImagesByEventId.get(event.id)
            const imageKeys = driveKeys ?? parseImageKeys(event.eventImages)
            return {
              id: event.id,
              title: event.title,
              date: formatGalleryDate(event.date),
              location: event.location,
              description: event.description || '',
              status: event.status,
              imageKeys,
              googleDriveFolderUrl: event.googleDriveFolderUrl ?? null,
            }
          })
          .filter((event) => event.imageKeys.length > 0)

        setEvents(eventsWithImages)
      } catch (error) {
        console.error('Failed to load events gallery:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadEventGalleries()
  }, [])

  useEffect(() => {
    if (events.length === 0) return

    const eventId = searchParams.get('event')
    if (!eventId) {
      setSelectedEvent(null)
      return
    }

    const targetEvent = events.find((event) => event.id === eventId) ?? null
    setSelectedEvent(targetEvent)
  }, [events, searchParams])

  useEffect(() => {
    if (!selectedEvent) return

    setActiveImageIndex(0)
    setLightboxIndex(null)
    setPage(0)
    setIsPlaying(selectedEvent.imageKeys.length > 1)
  }, [selectedEvent?.id])

  useEffect(() => {
    if (!selectedEvent || !isPlaying || selectedEvent.imageKeys.length <= 1) return

    const interval = window.setInterval(() => {
      setActiveImageIndex((currentIndex) =>
        getWrappedIndex(currentIndex + 1, selectedEvent.imageKeys.length),
      )
    }, 5000)

    return () => window.clearInterval(interval)
  }, [isPlaying, selectedEvent])

  const totalImages = selectedEvent?.imageKeys.length ?? 0

  useEffect(() => {
    if (!selectedEvent || totalImages === 0) return
    setPage(Math.floor(activeImageIndex / PAGE_SIZE))
  }, [activeImageIndex, selectedEvent, totalImages])

  const handleSelectEvent = (event: EventWithImages) => {
    setSelectedEvent(event)
    router.replace(`/gallery?event=${event.id}`, { scroll: false })
  }

  const handleBackToEvents = () => {
    setSelectedEvent(null)
    setLightboxIndex(null)
    router.replace('/gallery', { scroll: false })
  }

  const handleSelectImage = (index: number) => {
    if (!selectedEvent) return
    setActiveImageIndex(getWrappedIndex(index, selectedEvent.imageKeys.length))
  }

  const pagedImages = useMemo(() => {
    if (!selectedEvent) return []
    const start = page * PAGE_SIZE
    return selectedEvent.imageKeys.slice(start, start + PAGE_SIZE)
  }, [selectedEvent, page])

  const totalPages = selectedEvent ? Math.max(1, Math.ceil(selectedEvent.imageKeys.length / PAGE_SIZE)) : 1

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-text-medium">Loading gallery...</p>
        </div>
      </div>
    )
  }

  if (selectedEvent) {
    return (
      <div className="min-h-screen bg-white">
        <section className="bg-gradient-to-br from-primary-blue via-accent-purple to-accent-orange py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={handleBackToEvents}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              <ChevronLeftIcon />
              Back to Events
            </button>
            <div className="max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={selectedEvent.status} />
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white/80">
                  {selectedEvent.imageKeys.length} photos
                </span>
              </div>
              <h1 className="text-4xl font-bold text-white md:text-5xl">{selectedEvent.title}</h1>
              <p className="mt-4 text-base text-white/85 sm:text-lg">
                {selectedEvent.date} • {selectedEvent.location}
              </p>
              {selectedEvent.description && (
                <p className="mt-5 max-w-3xl text-white/85">{selectedEvent.description}</p>
              )}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          {selectedEvent.imageKeys.length > 0 ? (
            <>
              <div className="grid gap-6 sm:gap-8 md:grid-cols-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
                <div className="md:col-span-3 lg:col-span-1 overflow-hidden rounded-[32px] bg-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
                  <div className="relative h-[280px] sm:h-[420px] lg:h-[560px]">
                    <img
                      src={getImageSrc(selectedEvent.imageKeys[activeImageIndex])}
                      alt={`${selectedEvent.title} - Featured photo ${activeImageIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-transparent" />

                    <div className="absolute left-4 top-4 flex flex-wrap items-center gap-3 sm:left-6 sm:top-6">
                      <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
                        Photo {activeImageIndex + 1} of {selectedEvent.imageKeys.length}
                      </span>
                      {selectedEvent.imageKeys.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setIsPlaying((currentValue) => !currentValue)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur-sm transition hover:bg-black/50"
                        >
                          {isPlaying ? <PauseIcon /> : <PlayIcon />}
                          {isPlaying ? 'Pause autoplay' : 'Start autoplay'}
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setLightboxIndex(activeImageIndex)}
                      className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur-sm transition hover:bg-black/50 sm:right-6 sm:top-6"
                    >
                      <ExpandIcon />
                      Open slideshow
                    </button>

                    {selectedEvent.imageKeys.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSelectImage(activeImageIndex - 1)}
                          className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50 sm:h-12 sm:w-12 sm:left-6"
                          aria-label="Previous featured photo"
                        >
                          <ChevronLeftIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectImage(activeImageIndex + 1)}
                          className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50 sm:h-12 sm:w-12 sm:right-6"
                          aria-label="Next featured photo"
                        >
                          <ChevronRightIcon />
                        </button>
                      </>
                    )}

                    <div className="absolute inset-x-0 bottom-0 px-5 pb-5 sm:px-6 sm:pb-6">
                      <div className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/10 p-4 text-white backdrop-blur-md sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.28em] text-white/60">Featured moment</p>
                          <p className="mt-2 text-lg font-semibold">A closer look at this event’s gallery</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLightboxIndex(activeImageIndex)}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-primary-saffron"
                        >
                          <ExpandIcon />
                          View fullscreen
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedEvent.imageKeys.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto px-4 py-4 sm:px-6">
                      {selectedEvent.imageKeys.map((key, index) => {
                        const isActive = index === activeImageIndex

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectImage(index)}
                            className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border transition sm:h-24 sm:w-24 ${
                              isActive
                                ? 'border-primary-saffron ring-2 ring-primary-saffron/40'
                                : 'border-white/10 opacity-70 hover:opacity-100'
                            }`}
                            aria-label={`Select photo ${index + 1}`}
                          >
                            <img src={getImageSrc(key)} alt="" className="h-full w-full object-cover" />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-blue">Gallery overview</p>

                  {selectedEvent.description && (
                    <p className="mt-4 text-text-medium">
                      {selectedEvent.description}
                    </p>
                  )}

                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(activeImageIndex)}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-blue px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-blue/90"
                    >
                      <ExpandIcon />
                      Open Slideshow
                    </button>
                    {selectedEvent.imageKeys.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setIsPlaying((currentValue) => !currentValue)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-text-dark transition hover:border-primary-blue hover:text-primary-blue"
                      >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        {isPlaying ? 'Pause Autoplay' : 'Resume Autoplay'}
                      </button>
                    )}
                    {selectedEvent.googleDriveFolderUrl && session && (
                      <a
                        href={selectedEvent.googleDriveFolderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-text-dark transition hover:border-primary-saffron hover:text-primary-saffron"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                          <path d="M6.28 3L2 10.5l4.28 7.5h11.44L22 10.5 17.72 3zm5.72 2.5L14.9 10H9.1zM4.4 10.5L7.6 5h1.8L6.2 10.5zm1.8 1H9.1l-3.2 5.5L4.4 12zm6.88 5.5H9.12L6 10.5h12zM16.4 10.5L13.6 5h1.8l3.2 5.5zm.6 1h1.8l-2.5 5.5h-1.5z" />
                        </svg>
                        Upload photos to Drive
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-14">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-blue">Photo library</p>
                    <h2 className="mt-2 text-3xl font-bold text-text-dark">All event photos</h2>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
                        disabled={page === 0}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-text-dark transition hover:border-primary-blue hover:text-primary-blue disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeftIcon />
                        Previous
                      </button>
                      <span className="text-sm text-text-medium">Page {page + 1} of {totalPages}</span>
                      <button
                        type="button"
                        onClick={() => setPage((currentPage) => Math.min(totalPages - 1, currentPage + 1))}
                        disabled={page >= totalPages - 1}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-text-dark transition hover:border-primary-blue hover:text-primary-blue disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                        <ChevronRightIcon />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {pagedImages.map((key, index) => {
                    const absoluteIndex = page * PAGE_SIZE + index
                    const isActive = absoluteIndex === activeImageIndex

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          handleSelectImage(absoluteIndex)
                          setLightboxIndex(absoluteIndex)
                        }}
                        className={`group relative h-72 overflow-hidden rounded-[28px] text-left shadow-[0_16px_40px_rgba(15,23,42,0.12)] transition hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.18)] ${
                          isActive ? 'ring-2 ring-primary-saffron/60' : ''
                        }`}
                      >
                        <img
                          src={getImageSrc(key)}
                          alt={`${selectedEvent.title} - Photo ${absoluteIndex + 1}`}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-white/65">Community moment</p>
                            <p className="mt-2 text-lg font-semibold">Photo {absoluteIndex + 1}</p>
                          </div>
                          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                            View
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-medium">No photos for this event yet</p>
            </div>
          )}
        </section>

        <GalleryLightbox
          event={selectedEvent}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onSelect={(index) => {
            handleSelectImage(index)
            setLightboxIndex(getWrappedIndex(index, selectedEvent.imageKeys.length))
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-primary-blue via-accent-purple to-accent-orange py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Event Gallery</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Explore our events through a cleaner, more immersive photo experience with curated previews and a polished slideshow viewer.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {events.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-text-medium">No events with photos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white text-left shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-primary-saffron hover:shadow-[0_28px_60px_rgba(15,23,42,0.14)]"
                onClick={() => handleSelectEvent(event)}
              >
                <div className="relative h-56 overflow-hidden bg-slate-200">
                  <img
                    src={getImageSrc(event.imageKeys[0])}
                    alt={event.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
                  <div className="absolute left-5 top-5">
                    <StatusBadge status={event.status} />
                  </div>
                  <div className="absolute right-5 top-5 rounded-full bg-primary-saffron px-3 py-1 text-sm font-bold text-text-dark">
                    {event.imageKeys.length} photos
                  </div>
                  {event.googleDriveFolderUrl && (
                    <div className="absolute right-5 bottom-5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-primary-blue backdrop-blur-sm">
                      Google Drive
                    </div>
                  )}
                </div>

                <div className="p-6 sm:p-7">
                  <h3 className="text-2xl font-bold text-text-dark transition-colors group-hover:text-primary-saffron">
                    {event.title}
                  </h3>

                  <div className="mt-4 space-y-2 text-text-medium">
                    <div>{event.date}</div>
                    <div>{event.location}</div>
                  </div>

                  <p className="mt-4 line-clamp-3 text-text-medium">
                    {event.description || 'Revisit highlights from this community gathering through the full photo collection.'}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                    <span className="text-sm font-semibold text-primary-blue">Open gallery</span>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-text-dark transition group-hover:text-primary-saffron">
                      View slideshow
                      <ChevronRightIcon />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
