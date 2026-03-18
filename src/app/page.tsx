import Link from 'next/link'
import { Calendar, UtensilsCrossed, Home, Tag } from 'lucide-react'
import { getUpcomingEvents } from '@/lib/data'
import { EventCard } from '@/components/EventCard'
import { NewsletterSignup } from '@/components/NewsletterSignup'
import { ScrollScrubHero } from '@/components/ScrollScrubHero'

export default async function HomePage() {
  const events = await getUpcomingEvents(3)

  return (
    <>
      {/* Fixed scroll-scrub video background */}
      <ScrollScrubHero />

      {/* Page layout: transparent runway for pillar animations, then overlaid content */}
      <div className="relative">
        {/* Transparent runway — 500vh of scroll space for the pillar animations (mobile only) */}
        <div style={{ height: '500vh' }} className="pointer-events-none md:hidden" />

        {/* Content sections overlay the video background */}
        <div className="relative z-10">
          {/* Fade-in gradient transition (mobile only) */}
          <div className="h-16 bg-gradient-to-b from-transparent to-black/70 pointer-events-none md:hidden" />

          {/* Hero text */}
          <section className="px-4 md:px-6 pt-8 pb-6 bg-black/70 backdrop-blur-md md:bg-transparent md:backdrop-blur-none">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-white md:text-foreground"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Your guide to life in Claremont.
            </h1>
            <p className="text-white/70 md:text-muted-foreground mt-2 text-lg md:text-xl italic">
              Because living here should be as good as learning here.
            </p>
          </section>

          {/* Quick nav grid */}
          <section className="px-4 md:px-6 pb-6 bg-black/70 backdrop-blur-md md:bg-transparent md:backdrop-blur-none">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: 'Events',  href: '/events',  icon: Calendar,         color: 'bg-blue-500/20 border border-blue-400/30', desktopColor: 'md:bg-blue-50 md:border-blue-200' },
                { label: 'Eat',     href: '/eat',     icon: UtensilsCrossed,  color: 'bg-orange-500/20 border border-orange-400/30', desktopColor: 'md:bg-orange-50 md:border-orange-200' },
                { label: 'Deals',   href: '/deals',   icon: Tag,              color: 'bg-green-500/20 border border-green-400/30', desktopColor: 'md:bg-green-50 md:border-green-200' },
                { label: 'Housing', href: '/housing', icon: Home,             color: 'bg-purple-500/20 border border-purple-400/30', desktopColor: 'md:bg-purple-50 md:border-purple-200' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${item.color} ${item.desktopColor} rounded-xl p-4 md:p-6 flex flex-col items-center justify-center gap-2 min-h-[80px] md:min-h-[100px] hover:opacity-80 active:scale-95 transition-all`}
                  >
                    <Icon className="h-6 w-6 md:h-7 md:w-7 text-white md:text-foreground" />
                    <span className="font-medium text-sm md:text-base text-white md:text-foreground">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* This Week */}
          {events.length > 0 && (
            <section className="px-4 md:px-6 pb-6 bg-black/70 backdrop-blur-md md:bg-transparent md:backdrop-blur-none">
              <h2
                className="text-xl md:text-2xl font-semibold mb-3 text-white md:text-foreground"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                This Week
              </h2>
              <div className="space-y-3 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* New to Claremont CTA */}
          <section className="mx-4 md:mx-6 mb-6 bg-black/70 backdrop-blur-md md:bg-transparent md:backdrop-blur-none rounded-xl overflow-hidden">
            <Link
              href="/new"
              className="block bg-primary/80 backdrop-blur text-white rounded-xl p-5 md:p-6 text-center hover:bg-primary/90 transition-colors"
            >
              <p className="font-semibold text-lg">New to Claremont?</p>
              <p className="text-sm opacity-90 mt-1">Start here →</p>
            </Link>
          </section>

          {/* Newsletter */}
          <section className="px-4 md:px-6 pb-8 bg-black/70 backdrop-blur-md md:bg-transparent md:backdrop-blur-none">
            <NewsletterSignup heading="Weekly. Free. Worth it." />
          </section>
        </div>
      </div>
    </>
  )
}
