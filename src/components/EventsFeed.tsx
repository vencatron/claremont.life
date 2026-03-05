'use client'

import { useState } from 'react'
import { CollegeFilter } from '@/components/CollegeFilter'
import { EventCard } from '@/components/EventCard'
import type { ClaremontEvent } from '@/types'
import type { College } from '@/lib/constants'

interface EventsFeedProps {
  events: ClaremontEvent[]
}

export function EventsFeed({ events }: EventsFeedProps) {
  const [selectedCollege, setSelectedCollege] = useState<College>('All')

  const filtered = selectedCollege === 'All' ? events : events.filter((e) => e.college === selectedCollege)

  const grouped = filtered.reduce<Record<string, ClaremontEvent[]>>((acc, event) => {
    const day = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(event.starts_at))
    if (!acc[day]) acc[day] = []
    acc[day].push(event)
    return acc
  }, {})

  return (
    <div>
      <div className="sticky top-0 bg-background z-10">
        <CollegeFilter selected={selectedCollege} onChange={setSelectedCollege} />
      </div>
      <div className="px-4 pb-4 space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            {selectedCollege === 'All' ? 'No upcoming events — check back soon.' : `No ${selectedCollege} events this week — check back soon.`}
          </p>
        ) : (
          Object.entries(grouped).map(([day, dayEvents]) => (
            <div key={day}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{day}</h2>
              <div className="space-y-3">
                {dayEvents.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
