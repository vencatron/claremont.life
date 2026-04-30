'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { CollegeFilter } from '@/components/CollegeFilter'
import { EventCard } from '@/components/EventCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ClaremontEvent } from '@/types'
import type { College } from '@/lib/constants'
import {
  CLAREMONT_TIME_ZONE,
  DISCOVERY_FILTERS,
  filterStudentEvents,
  isValidEventDate,
  type StudentEventFilterId,
} from '@/lib/student-events'

interface EventsFeedProps {
  events: ClaremontEvent[]
}

export function EventsFeed({ events }: EventsFeedProps) {
  const [selectedCollege, setSelectedCollege] = useState<College>('All')
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<StudentEventFilterId[]>([])

  const hasDiscoveryState = search.trim().length > 0 || activeFilters.length > 0 || selectedCollege !== 'All'
  const filtered = filterStudentEvents(events, {
    search,
    filters: activeFilters,
    college: selectedCollege,
  })

  const grouped = filtered.reduce<Record<string, ClaremontEvent[]>>((acc, event) => {
    const startsAt = new Date(event.starts_at)
    if (!isValidEventDate(startsAt)) return acc

    const day = new Intl.DateTimeFormat('en-US', {
      timeZone: CLAREMONT_TIME_ZONE,
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(startsAt)
    if (!acc[day]) acc[day] = []
    acc[day].push(event)
    return acc
  }, {})

  function toggleFilter(filter: StudentEventFilterId) {
    setActiveFilters((current) => (
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter]
    ))
  }

  function clearDiscoveryState() {
    setSearch('')
    setActiveFilters([])
    setSelectedCollege('All')
  }

  return (
    <div>
      <div className="sticky top-0 bg-background z-10 border-b border-gray-100">
        <div className="px-4 md:px-6 pt-3 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search free food, talks, music, Ath..."
              className="h-11 rounded-full pl-9 pr-10 bg-white"
              aria-label="Search events"
            />
            {search.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Clear event search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Find something worth leaving your dorm for</p>
            <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {DISCOVERY_FILTERS.map((filter) => {
                const active = activeFilters.includes(filter.id)
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => toggleFilter(filter.id)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary text-white'
                        : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                    aria-pressed={active}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div>
          <p className="px-4 md:px-6 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Campus/source</p>
          <CollegeFilter selected={selectedCollege} onChange={setSelectedCollege} />
        </div>
      </div>
      <div className="px-4 md:px-6 pb-4 pt-4 space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <div className="mx-auto max-w-md py-12 text-center">
            <p className="font-medium text-gray-800">
              {hasDiscoveryState ? 'No events match those filters yet.' : 'No upcoming events — check back soon.'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {hasDiscoveryState
                ? 'Try clearing a filter, searching a broader word, or checking back as calendars update. Student submissions are coming soon.'
                : 'Calendars change fast around the 5Cs. Check back soon for new events.'}
            </p>
            {hasDiscoveryState && (
              <Button type="button" variant="outline" size="sm" className="mt-4 rounded-full" onClick={clearDiscoveryState}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([day, dayEvents]) => (
            <div key={day}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{day}</h2>
              <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                {dayEvents.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
