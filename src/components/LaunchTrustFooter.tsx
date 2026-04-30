'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TRUST_ITEMS = [
  {
    label: 'Freshness',
    copy: 'Events refresh hourly; food, housing, and deals show the freshest public or verified data we have.',
  },
  {
    label: 'Sources',
    copy: 'Built from public calendars, local listings, student submissions, and clearly labeled community sources.',
  },
  {
    label: 'Privacy',
    copy: 'Newsletter means useful Claremont updates only: no spam, no resale, unsubscribe anytime.',
  },
]

export function LaunchTrustFooter() {
  const pathname = usePathname()

  if (pathname === '/explore') return null

  return (
    <footer className="relative z-20 border-t border-white/10 bg-black px-4 pb-24 pt-6 text-white md:border-border md:bg-background md:px-6 md:pb-8 md:text-foreground">
      <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:border-border md:bg-card md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50 md:text-muted-foreground">
              Launch readiness
            </p>
            <h2 className="mt-1 text-lg font-semibold" style={{ fontFamily: 'var(--font-playfair)' }}>
              Useful first, transparent always.
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/65 md:text-muted-foreground">
              Claremont.life is a student-facing guide, not an official college site. Check primary sources for high-stakes decisions, and report anything stale or wrong.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <Link
              href="/events/submit"
              className="rounded-full border border-white/15 px-3 py-1.5 text-white/85 transition-colors hover:bg-white/10 md:border-border md:text-foreground md:hover:bg-accent"
            >
              Submit missing event
            </Link>
            <a
              href="mailto:corrections@claremont.life?subject=Correction%20for%20claremont.life"
              className="rounded-full border border-white/15 px-3 py-1.5 text-white/85 transition-colors hover:bg-white/10 md:border-border md:text-foreground md:hover:bg-accent"
            >
              Report a correction
            </a>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {TRUST_ITEMS.map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-black/20 p-3 md:border-border md:bg-background">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{item.label}</p>
              <p className="mt-1 text-sm leading-5 text-white/70 md:text-muted-foreground">{item.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
