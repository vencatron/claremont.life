import Link from 'next/link'
import { Calendar, Home, Tag, UtensilsCrossed } from 'lucide-react'
import { getUpcomingEvents } from '@/lib/data'
import { HomeTodaySection } from '@/components/HomeTodaySection'
import { NewsletterSignup } from '@/components/NewsletterSignup'
import { ScrollScrubHero } from '@/components/ScrollScrubHero'
import { StudentQuickActions } from '@/components/StudentQuickActions'

const CATEGORY_LINKS = [
  {
    label: 'Events',
    href: '/events',
    icon: Calendar,
    color: 'bg-blue-500/20 border border-blue-400/30',
    desktopColor: 'md:bg-blue-50 md:border-blue-200',
  },
  {
    label: 'Eat',
    href: '/eat',
    icon: UtensilsCrossed,
    color: 'bg-orange-500/20 border border-orange-400/30',
    desktopColor: 'md:bg-orange-50 md:border-orange-200',
  },
  {
    label: 'Deals',
    href: '/deals',
    icon: Tag,
    color: 'bg-green-500/20 border border-green-400/30',
    desktopColor: 'md:bg-green-50 md:border-green-200',
  },
  {
    label: 'Housing',
    href: '/housing',
    icon: Home,
    color: 'bg-purple-500/20 border border-purple-400/30',
    desktopColor: 'md:bg-purple-50 md:border-purple-200',
  },
]

export default async function HomePage() {
  const events = await getUpcomingEvents(24)

  return (
    <>
      {/* Fixed scroll-scrub video background / desktop visual identity */}
      <ScrollScrubHero />

      {/* Immediate mobile-first utility layer before the mobile scroll runway. */}
      <section className="relative z-30 px-4 pb-6 pt-5 md:px-6 md:pb-8 md:pt-8">
        <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-white/10 bg-black/75 p-4 text-white shadow-2xl backdrop-blur-md md:border-border md:bg-background/90 md:p-6 md:text-foreground md:shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50 md:text-muted-foreground">
                  Claremont.life
                </p>
                <h1
                  className="mt-2 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl md:text-foreground lg:text-6xl"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Your guide to life in Claremont.
                </h1>
                <p className="mt-3 text-base text-white/70 md:text-lg md:text-muted-foreground">
                  Open it on your phone for tonight&apos;s events, food ideas, student deals, and a starting point if you&apos;re new.
                </p>
              </div>
              <StudentQuickActions />
            </div>

            <HomeTodaySection events={events} />
          </div>
        </div>
      </section>

      {/* Page layout: transparent runway for pillar animations, then overlaid content */}
      <div className="relative">
        {/* Transparent runway — 500vh of scroll space for the pillar animations (mobile only) */}
        <div style={{ height: '500vh' }} className="pointer-events-none md:hidden" />

        {/* Content sections overlay the video background */}
        <div className="relative z-10">
          {/* Fade-in gradient transition (mobile only) */}
          <div className="h-16 bg-gradient-to-b from-transparent to-black/70 pointer-events-none md:hidden" />

          {/* Category grid */}
          <section className="px-4 pb-6 md:px-6 md:pb-8 bg-black/70 backdrop-blur-md md:bg-transparent md:backdrop-blur-none">
            <div className="mx-auto max-w-6xl">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55 md:text-muted-foreground">
                    Explore
                  </p>
                  <h2
                    className="text-xl font-semibold text-white md:text-2xl md:text-foreground"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Campus life essentials
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {CATEGORY_LINKS.map((item) => {
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
            </div>
          </section>

          {/* New to Claremont CTA */}
          <section className="mx-4 md:mx-6 mb-6 bg-black/70 backdrop-blur-md md:bg-transparent md:backdrop-blur-none rounded-xl overflow-hidden">
            <div className="mx-auto max-w-6xl">
              <Link
                href="/new"
                className="block bg-primary/80 backdrop-blur text-white rounded-xl p-5 md:p-6 text-center hover:bg-primary/90 transition-colors"
              >
                <p className="font-semibold text-lg">New to Claremont?</p>
                <p className="text-sm opacity-90 mt-1">Start here →</p>
              </Link>
            </div>
          </section>

          {/* Newsletter */}
          <section className="px-4 md:px-6 pb-8 bg-black/70 backdrop-blur-md md:bg-transparent md:backdrop-blur-none">
            <div className="mx-auto max-w-6xl">
              <NewsletterSignup heading="Weekly. Free. Worth it." />
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
