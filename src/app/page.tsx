import Link from 'next/link'
import { ArrowRight, Building2, CalendarDays, Home, MapPinned, Newspaper, Tag, Train, UtensilsCrossed } from 'lucide-react'
import { getUpcomingEvents } from '@/lib/data'
import { CampusPreference } from '@/components/CampusPreference'
import { HomeTodaySection } from '@/components/HomeTodaySection'
import { ScrollScrubHero } from '@/components/ScrollScrubHero'
import { StudentQuickActions } from '@/components/StudentQuickActions'
import { StudentVoice } from '@/components/StudentVoice'

const CATEGORY_LINKS = [
  {
    label: 'Events',
    href: '/events',
    icon: CalendarDays,
    color: 'from-sky-500/14 to-blue-500/6 text-sky-900',
    motif: 'bg-sky-500',
  },
  {
    label: 'Eat',
    href: '/eat',
    icon: UtensilsCrossed,
    color: 'from-orange-500/14 to-amber-500/6 text-orange-950',
    motif: 'bg-orange-500',
  },
  {
    label: 'Deals',
    href: '/deals',
    icon: Tag,
    color: 'from-emerald-500/14 to-lime-500/6 text-emerald-950',
    motif: 'bg-emerald-500',
  },
  {
    label: 'Housing',
    href: '/housing',
    icon: Home,
    color: 'from-violet-500/14 to-fuchsia-500/6 text-violet-950',
    motif: 'bg-violet-500',
  },
]

const LOCALS_PREVIEW = [
  {
    label: 'City services',
    detail: 'Trash, permits, parks, trees, council meetings',
    icon: Building2,
  },
  {
    label: 'Local pulse',
    detail: 'Courier, civic updates, community events',
    icon: Newspaper,
  },
  {
    label: 'Transit basics',
    detail: 'Metrolink, Foothill Transit, biking shortcuts',
    icon: Train,
  },
]

export default async function HomePage() {
  const events = await getUpcomingEvents(24)

  return (
    <main className="aurora-field relative overflow-hidden pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <ScrollScrubHero />

      <section className="cl-container relative z-20 -mt-8 pb-8 md:-mt-12 md:pb-10">
        <div className="cl-card p-4 md:p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-start">
            <div className="space-y-5">
              <div>
                <p className="cl-eyebrow">Claremont.life</p>
                <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.065em] text-foreground md:text-6xl lg:text-7xl">
                  Your guide to life in Claremont.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
                  Open it on your phone for tonight&apos;s events, food ideas, student deals, and a starting point if you&apos;re new.
                </p>
              </div>
              <StudentQuickActions />
              <CampusPreference />
            </div>

            <HomeTodaySection events={events} />
          </div>
        </div>
      </section>

      <section className="cl-container pb-8 md:pb-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="cl-eyebrow">Explore</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-foreground md:text-4xl">
              Campus life essentials
            </h2>
          </div>
          <MapPinned className="hidden h-7 w-7 text-muted-foreground md:block" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {CATEGORY_LINKS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative min-h-[8.5rem] overflow-hidden rounded-[1.5rem] border border-white/70 bg-gradient-to-br ${item.color} p-4 shadow-[0_14px_40px_rgba(20,30,50,0.07)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(20,30,50,0.12)] active:scale-[0.98] md:min-h-[10rem] md:p-5`}
              >
                <span className={`absolute right-4 top-4 h-3 w-3 rounded-full ${item.motif}`} aria-hidden="true" />
                <span className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-current/40 to-transparent" aria-hidden="true" />
                <Icon className="h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
                <span className="mt-8 block text-lg font-semibold tracking-[-0.04em] md:text-xl">{item.label}</span>
                <ArrowRight className="mt-2 h-4 w-4 opacity-55 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="cl-container pb-8 md:pb-10">
        <div className="cl-card overflow-hidden p-5 md:p-6 lg:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-center">
            <div>
              <p className="cl-eyebrow">Locals</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-foreground md:text-4xl">
                Local info for Claremont residents
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                Not just student survival: city services, schools, library, local news, transit, Village resources, and neighborhood basics.
              </p>
              <Link
                href="/locals"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold tracking-[-0.01em] text-background shadow-sm transition-all hover:-translate-y-0.5 hover:bg-foreground/92 active:scale-[0.98]"
              >
                Open locals guide
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {LOCALS_PREVIEW.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.label}
                    href="/locals"
                    className="group rounded-[1.35rem] border border-white/70 bg-white/62 p-4 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <p className="mt-4 text-base font-semibold tracking-[-0.035em] text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.detail}</p>
                    <ArrowRight className="mt-3 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <StudentVoice />

      <section className="cl-container pb-5 md:pb-6">
        <Link
          href="/guides/cheap-eats"
          className="group block overflow-hidden rounded-[1.6rem] border border-orange-200/80 bg-gradient-to-br from-orange-50 to-white p-5 text-orange-950 shadow-[0_16px_50px_rgba(120,65,20,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(120,65,20,0.12)] md:p-6"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] opacity-70">Shareable student guide</p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.035em]">Cheap eats for 5C students</p>
          <p className="mt-1 text-sm opacity-80">A screenshot-friendly budget meal guide for the group chat →</p>
        </Link>
      </section>

      <section className="cl-container pb-5 md:pb-6">
        <Link
          href="/events/submit"
          className="group block rounded-[1.6rem] border border-border bg-foreground p-5 text-center text-background shadow-[0_20px_70px_rgba(10,15,25,0.14)] transition-all hover:-translate-y-0.5 hover:bg-foreground/92 md:p-6"
        >
          <p className="text-lg font-semibold tracking-[-0.03em]">Know about a campus event?</p>
          <p className="mt-1 text-sm opacity-75">Send it for review →</p>
        </Link>
      </section>

      <section className="cl-container pb-5 md:pb-6">
        <Link
          href="/new"
          className="group block rounded-[1.6rem] border border-primary/15 bg-primary p-5 text-center text-primary-foreground shadow-[0_20px_70px_rgba(34,83,160,0.16)] transition-all hover:-translate-y-0.5 hover:bg-primary/92 md:p-6"
        >
          <p className="text-lg font-semibold tracking-[-0.03em]">New to Claremont?</p>
          <p className="mt-1 text-sm opacity-85">Start here →</p>
        </Link>
      </section>
    </main>
  )
}
