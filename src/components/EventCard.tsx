import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { COLLEGE_COLORS } from '@/lib/constants'
import type { ClaremontEvent } from '@/types'
import type { College } from '@/lib/constants'
import { MapPin, Clock } from 'lucide-react'

interface EventCardProps {
  event: ClaremontEvent
}

export function EventCard({ event }: EventCardProps) {
  const colorClass = COLLEGE_COLORS[event.college as College] || COLLEGE_COLORS['All']
  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(event.starts_at))

  const content = (
    <Card className="p-4 shadow-sm rounded-xl hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Badge className={`${colorClass} mb-2 text-xs font-medium`} variant="secondary">
            {event.college}
          </Badge>
          <h3 className="font-semibold text-base leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
            {event.title}
          </h3>
          {event.location && (
            <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </p>
          )}
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
            <Clock className="h-3.5 w-3.5" />
            {date}
          </p>
        </div>
      </div>
    </Card>
  )

  if (event.url) {
    return <a href={event.url} target="_blank" rel="noopener noreferrer" className="block">{content}</a>
  }
  return content
}
