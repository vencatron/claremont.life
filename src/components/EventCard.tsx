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
  if (kind === 'category') return 'bg-indigo-50 text-indigo-900 border-indigo-200'
  if (kind === 'signal') return 'bg-emerald-50 text-emerald-900 border-emerald-200'
  return 'bg-orange-50 text-orange-950 border-orange-200'
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
    <Card className="h-full rounded-[1.15rem] border-border/80 bg-card/90 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {metadata.badges.map((badge) => (
              <Badge
                key={`${badge.kind}-${badge.label}`}
                className={`${badgeClass(badge.kind, metadata.campus)} rounded-full border px-2 py-0.5 text-[0.68rem] font-bold`}
                variant="secondary"
              >
                {badge.label}
              </Badge>
            ))}
          </div>
          <h3 className="text-base font-semibold leading-tight tracking-[-0.025em]">
            {event.title}
          </h3>
          {event.location && (
            <p className={`mt-2 flex items-start gap-1.5 text-sm font-semibold ${colorClass.replace('bg-', 'text-').split(' ')[1] ?? 'text-gray-700'}`}>
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{event.location}</span>
            </p>
          )}
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {date}
          </p>
          {event.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {event.description}
            </p>
          )}
          <p className="mt-3 border-t border-border/70 pt-2 text-xs leading-5 text-muted-foreground">
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
