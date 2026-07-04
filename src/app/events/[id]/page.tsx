import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, ExternalLink, MapPin } from 'lucide-react'

import { getEventById } from '@/lib/data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { COLLEGE_COLORS } from '@/lib/constants'
import type { College } from '@/lib/constants'
import { CLAREMONT_TIME_ZONE, inferStudentEventMetadata, isValidEventDate } from '@/lib/student-events'
import type { ClaremontEvent } from '@/types'

export const revalidate = 3600

interface EventPageProps {
  params: Promise<{ id: string }>
}

const getEvent = cache(getEventById)

function safeEventUrl(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null
  } catch {
    return null
  }
}

function badgeClass(kind: 'campus' | 'category' | 'signal' | 'time', campus?: College) {
  if (kind === 'campus') return COLLEGE_COLORS[campus ?? 'All'] || COLLEGE_COLORS['All']
  if (kind === 'category') return 'bg-indigo-50 text-indigo-900 border-indigo-200'
  if (kind === 'signal') return 'bg-emerald-50 text-emerald-900 border-emerald-200'
  return 'bg-orange-50 text-orange-950 border-orange-200'
}

function formatEventDate(event: ClaremontEvent): string | null {
  const date = new Date(event.starts_at)
  if (!isValidEventDate(date)) return null
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CLAREMONT_TIME_ZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function eventDescription(event: ClaremontEvent): string {
  if (event.description) {
    const trimmed = event.description.replace(/\s+/g, ' ').trim()
    return trimmed.length > 155 ? `${trimmed.slice(0, 152).trimEnd()}…` : trimmed
  }
  const date = formatEventDate(event) ?? 'Date TBD'
  const location = event.location || 'Claremont'
  return `${date} at ${location} — details on claremont.life.`
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) return { title: 'Event not found' }

  return {
    title: event.title,
    description: eventDescription(event),
    alternates: { canonical: `/events/${event.id}` },
    openGraph: {
      title: event.title,
      description: eventDescription(event),
      url: `/events/${event.id}`,
      ...(event.image_url ? { images: [{ url: event.image_url }] } : {}),
    },
  }
}

function eventJsonLd(event: ClaremontEvent) {
  const canonicalUrl = `https://claremont.life/events/${event.id}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.starts_at,
    ...(event.ends_at ? { endDate: event.ends_at } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.location || 'Claremont, CA',
      address: {
        '@type': 'PostalAddress',
        ...(event.address || event.location ? { streetAddress: event.address || event.location } : {}),
        addressLocality: 'Claremont',
        addressRegion: 'CA',
        addressCountry: 'US',
      },
    },
    url: canonicalUrl,
    ...(event.image_url ? { image: event.image_url } : {}),
    ...(event.description ? { description: event.description } : {}),
    ...(event.college ? { organizer: { '@type': 'CollegeOrUniversity', name: event.college } } : {}),
  }
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) notFound()

  const metadata = inferStudentEventMetadata(event)
  const colorClass = COLLEGE_COLORS[metadata.campus] || COLLEGE_COLORS['All']
  const date = formatEventDate(event) ?? 'Time TBD'
  const safeUrl = safeEventUrl(event.url)
  const jsonLd = JSON.stringify(eventJsonLd(event)).replace(/</g, '\\u003c')

  return (
    <div className="px-4 pb-10 pt-6 md:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="mx-auto max-w-3xl">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All events
        </Link>

        <div className="mt-4 rounded-[1.5rem] border border-border/80 bg-card/90 p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap gap-1.5">
            {metadata.badges.map((badge) => (
              <Badge
                key={`${badge.kind}-${badge.label}`}
                className={`${badgeClass(badge.kind, metadata.campus)} rounded-full border px-2.5 py-0.5 text-xs font-bold`}
                variant="secondary"
              >
                {badge.label}
              </Badge>
            ))}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl" style={{ fontFamily: 'var(--font-playfair)' }}>
            {event.title}
          </h1>

          <p className="mt-4 flex items-center gap-2 text-base text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            {date}
          </p>

          {event.location && (
            <p className={`mt-2 flex items-start gap-2 text-base font-semibold ${colorClass.replace('bg-', 'text-').split(' ')[1] ?? 'text-gray-700'}`}>
              <MapPin className="mt-1 h-4 w-4 shrink-0" />
              <span>
                {event.location}
                {event.address && event.address !== event.location && (
                  <span className="block text-sm font-normal text-muted-foreground">{event.address}</span>
                )}
              </span>
            </p>
          )}

          {event.description && (
            <p className="mt-5 whitespace-pre-line text-base leading-7 text-foreground/90">
              {event.description}
            </p>
          )}

          {safeUrl && (
            <Button asChild className="mt-6 rounded-full">
              <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                Official listing
                <ExternalLink className="ml-1.5 h-4 w-4" />
              </a>
            </Button>
          )}

          <p className="mt-6 border-t border-border/70 pt-3 text-xs leading-5 text-muted-foreground">
            Source: public calendar or submitted listing; not independently verified by claremont.life. Check the official
            listing before making plans.
          </p>
        </div>
      </div>
    </div>
  )
}
