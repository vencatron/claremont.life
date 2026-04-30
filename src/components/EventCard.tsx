import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { COLLEGE_COLORS } from '@/lib/constants'
import { CLAREMONT_TIME_ZONE, inferStudentEventMetadata, isValidEventDate } from '@/lib/student-events'
import type { ClaremontEvent } from '@/types'
import type { College } from '@/lib/constants'
import { MapPin, Clock } from 'lucide-react'

interface EventCardProps {
  event: ClaremontEvent
}

function badgeClass(kind: 'campus' | 'category' | 'signal' | 'time', campus?: College) {
  if (kind === 'campus') return COLLEGE_COLORS[campus ?? 'All'] || COLLEGE_COLORS['All']
  if (kind === 'category') return 'bg-indigo-100 text-indigo-800'
  if (kind === 'signal') return 'bg-emerald-100 text-emerald-800'
  return 'bg-orange-100 text-orange-800'
}

function safeEventUrl(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null
  } catch {
    return null
  }
}

function formatSource(source: string | null | undefined): string {
  if (!source) return 'Unknown source'
  return source
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function sourceDetail(source: string | null | undefined): string {
  return source ? ` (${source})` : ''
}

export function EventCard({ event }: EventCardProps) {
  const metadata = inferStudentEventMetadata(event)
  const colorClass = COLLEGE_COLORS[metadata.campus] || COLLEGE_COLORS['All']
  const eventDate = new Date(event.starts_at)
  const date = isValidEventDate(eventDate)
    ? new Intl.DateTimeFormat('en-US', {
      timeZone: CLAREMONT_TIME_ZONE,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(eventDate)
    : 'Time TBD'
  const safeUrl = safeEventUrl(event.url)
  const sourceLabel = formatSource(event.source)
  const sourceId = sourceDetail(event.source)

  const content = (
    <Card className="p-4 shadow-sm rounded-xl hover:shadow-md transition-shadow h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {metadata.badges.map((badge) => (
              <Badge
                key={`${badge.kind}-${badge.label}`}
                className={`${badgeClass(badge.kind, metadata.campus)} text-xs font-medium`}
                variant="secondary"
              >
                {badge.label}
              </Badge>
            ))}
          </div>
          <h3 className="font-semibold text-base leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
            {event.title}
          </h3>
          {event.location && (
            <p className={`mt-2 flex items-start gap-1.5 text-sm font-medium ${colorClass.replace('bg-', 'text-').split(' ')[1] ?? 'text-gray-700'}`}>
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{event.location}</span>
            </p>
          )}
          <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
            <Clock className="h-3.5 w-3.5" />
            {date}
          </p>
          {event.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {event.description}
            </p>
          )}
          <p className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-500">
            Source: {sourceLabel}{sourceId}. Public calendar or submitted listing; not independently verified by claremont.life.
          </p>
        </div>
      </div>
    </Card>
  )

  if (safeUrl) {
    return <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="block h-full">{content}</a>
  }
  return content
}
