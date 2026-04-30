import Link from 'next/link'
import { ArrowRight, BadgePercent, CalendarDays, Compass, UtensilsCrossed } from 'lucide-react'
import { EventCard } from '@/components/EventCard'
import { splitHomepageEvents } from '@/lib/homepage-daily'
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
  const { tonight, thisWeek } = splitHomepageEvents(events, { tonightLimit: 2, thisWeekLimit: 3 })
  const hasEvents = tonight.length > 0 || thisWeek.length > 0

  return (
    <section aria-labelledby="home-today-title" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55 md:text-muted-foreground">
            Daily preview
          </p>
          <h2
            id="home-today-title"
            className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-foreground"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Tonight / This Week
          </h2>
        </div>
        <Link
          href="/events"
          className="hidden items-center gap-1 text-sm font-medium text-white/75 transition-colors hover:text-white md:flex md:text-primary md:hover:text-primary/80"
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
                className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/15 md:border-border md:bg-card md:text-card-foreground md:hover:bg-accent"
              >
                <div className="mb-4 inline-flex rounded-full bg-white/15 p-2 text-white md:bg-primary/10 md:text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55 md:text-muted-foreground">
                  {card.eyebrow}
                </p>
                <p className="mt-1 font-semibold leading-snug">{card.title}</p>
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
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3 shadow-sm backdrop-blur md:border-border md:bg-card/80">
      <h3 className="mb-3 px-1 text-sm font-semibold uppercase tracking-[0.18em] text-white/60 md:text-muted-foreground">
        {title}
      </h3>
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-white/15 bg-black/10 p-4 text-sm text-white/65 md:border-border md:bg-muted/40 md:text-muted-foreground">
          {emptyText}
        </p>
      )}
    </div>
  )
}
