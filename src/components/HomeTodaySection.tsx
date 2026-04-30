'use client'

import Link from 'next/link'
import { ArrowRight, BadgePercent, CalendarDays, Compass, UtensilsCrossed } from 'lucide-react'
import { EventCard } from '@/components/EventCard'
import { useCampusPreference } from '@/components/CampusPreference'
import { splitHomepageEvents } from '@/lib/homepage-daily'
import { getEventCampus } from '@/lib/student-events'
import type { ClaremontEvent } from '@/types'

interface HomeTodaySectionProps {
  events: ClaremontEvent[]
}

const FALLBACK_CARDS = [
  {
    href: '/events',
    eyebrow: 'Events',
    title: 'Find something happening tonight',
    icon: CalendarDays,
  },
  {
    href: '/eat',
    eyebrow: 'Food',
    title: 'Pick a late-night food option',
    icon: UtensilsCrossed,
  },
  {
    href: '/deals',
    eyebrow: 'Deals',
    title: 'Use a student discount nearby',
    icon: BadgePercent,
  },
  {
    href: '/new',
    eyebrow: 'New here',
    title: 'Get oriented to the 5Cs fast',
    icon: Compass,
  },
]

export function HomeTodaySection({ events }: HomeTodaySectionProps) {
  const campusPreference = useCampusPreference()

  const preview = splitHomepageEvents(events, {
    tonightLimit: 2,
    thisWeekLimit: 3,
    prioritizeEvent: campusPreference
      ? (event) => getEventCampus(event) === campusPreference
      : undefined,
  })
  const tonight = preview.tonight
  const thisWeek = preview.thisWeek
  const hasEvents = tonight.length > 0 || thisWeek.length > 0

  return (
    <section aria-labelledby="home-today-title" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="cl-eyebrow">Daily preview</p>
          <h2
            id="home-today-title"
            className="mt-2 text-3xl font-semibold tracking-[-0.055em] text-foreground md:text-4xl"
          >
            Tonight / This Week
          </h2>
        </div>
        <Link
          href="/events"
          className="hidden items-center gap-1 rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:text-primary md:flex"
        >
          All events <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {hasEvents ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <EventPreviewBucket
            title="Tonight"
            emptyText="No events surfaced for the rest of tonight yet."
            events={tonight}
          />
          <EventPreviewBucket
            title="This week"
            emptyText="Check the events page for the latest weekly listings."
            events={thisWeek}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FALLBACK_CARDS.map((card) => {
            const Icon = card.icon

            return (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-[1.25rem] border border-border/80 bg-background/72 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-full bg-foreground p-2 text-background">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {card.eyebrow}
                </p>
                <p className="mt-1 font-semibold leading-snug tracking-[-0.02em]">{card.title}</p>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

function EventPreviewBucket({
  title,
  emptyText,
  events,
}: {
  title: string
  emptyText: string
  events: ClaremontEvent[]
}) {
  return (
    <div className="rounded-[1.35rem] border border-border/80 bg-background/68 p-3 shadow-sm backdrop-blur-xl">
      <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h3>
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          {emptyText}
        </p>
      )}
    </div>
  )
}
