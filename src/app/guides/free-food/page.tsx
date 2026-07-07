import type { Metadata } from 'next'
import Link from 'next/link'
import { getUpcomingEvents } from '@/lib/data'
import { freeFoodWindowLabel, groupFreeFoodByDay } from '@/lib/free-food'
import { EventCard } from '@/components/EventCard'
import { NewsletterSignup } from '@/components/NewsletterSignup'
import { ShareGuideButton } from '@/components/ShareGuideButton'

const guideUrl = 'https://claremont.life/guides/free-food'

const radarTips = [
  {
    title: 'Talks feed you better than parties',
    tag: 'Reliable sources',
    copy: 'Department colloquia, speaker events, and info sessions budget for catering. Heads up: listings that say "lunch provided" or "reception to follow" without the word "free" skip this radar — skim the food filter on the events page to catch them.',
  },
  {
    title: '"Refreshments provided" is a legal term of art',
    tag: 'Read the listing',
    copy: 'It can mean a full taco bar or a sleeve of store-brand cookies. Check the description before you build your evening around it.',
  },
  {
    title: 'Show up on time, not fashionably late',
    tag: 'Pizza math',
    copy: 'The event may run two hours; the food runs out in the first twenty minutes. Plan your arrival around the boba, not the agenda.',
  },
  {
    title: 'Week one is the jackpot',
    tag: 'Timing',
    copy: 'Orientation, club fairs, and the first weeks of the semester are peak free-food season. Bookmark this page now — it fills itself.',
  },
]

export const metadata: Metadata = {
  title: 'Free Food This Week at the 5Cs',
  description:
    'A day-by-day list of Claremont Colleges events offering free food over the next 7 days — pulled nightly from public campus calendars.',
}

export const revalidate = 3600

export default async function FreeFoodGuidePage() {
  const now = new Date()
  const events = await getUpcomingEvents(500)
  const days = groupFreeFoodByDay(events, { now })
  const totalCount = days.reduce((sum, day) => sum + day.events.length, 0)
  const windowLabel = freeFoodWindowLabel(now)

  return (
    <div className="bg-stone-50 px-4 pb-10 pt-4 text-gray-950 md:px-6 md:pt-6">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-emerald-50 p-5 shadow-sm md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">Free food radar</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-gray-950 md:text-6xl" style={{ fontFamily: 'var(--font-playfair)' }}>
              Where the free food is this week, by day.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 md:text-lg">
              Every 5C event whose listing says both free and food, pulled nightly from public
              campus calendars. Send it to the group chat before anyone pays for dinner.
            </p>
          </div>

          <aside className="rounded-3xl border border-white/80 bg-white/85 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">QR-friendly URL</p>
            <p className="mt-2 break-all rounded-2xl bg-gray-950 p-3 font-mono text-xs leading-5 text-white">claremont.life/guides/free-food</p>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              One clean link for a club Discord, a dorm board, or the friend who never checks the events page.
            </p>
            <ShareGuideButton
              className="mt-4"
              title="Free Food This Week at the 5Cs"
              text="Live day-by-day list of free-food events at the Claremont Colleges."
              url={guideUrl}
            />
          </aside>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/events?filter=free" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">All free events</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">Everything free on the calendars, food or not.</span>
          </Link>
          <Link href="/guides/cheap-eats" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">No free food today?</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">The cheap-eats guide keeps dinner under $10.</span>
          </Link>
          <Link href="/deals" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Student deals</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">Discounts in the Village before you pay full price.</span>
          </Link>
          <Link href="/events/submit" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Know about free food we missed?</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">Submit the event so it shows up on the radar.</span>
          </Link>
        </div>
      </section>

      {/* ── Live day-by-day list ─────────────────────────────────────── */}
      <section className="mx-auto mt-8 max-w-6xl">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">This week</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl" style={{ fontFamily: 'var(--font-playfair)' }}>
              Free food, day by day
            </h2>
            <p className="mt-1 text-sm text-gray-600">{windowLabel}</p>
          </div>
          {days.length > 0 && (
            <p className="max-w-xl text-sm leading-6 text-gray-600">
              Only days with confirmed free food show up here. A missing day means nothing was
              announced — not that we forgot to check.
            </p>
          )}
        </div>

        {days.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">The honest answer</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-950" style={{ fontFamily: 'var(--font-playfair)' }}>
              No free food on the calendars right now.
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
              The radar goes quiet whenever campus does — summer, winter break, reading days, slow
              weeks. New listings land overnight (the calendars are scraped nightly), so check back
              tomorrow morning, and bookmark this page — it fills itself when term spins back up.
              One catch worth knowing: events that say &ldquo;lunch provided&rdquo; but never the
              word &ldquo;free&rdquo; don&rsquo;t make this list — <Link href="/events?filter=food" className="underline underline-offset-2">browse food events</Link> to
              catch those. Club Discords and department newsletters announce food before the
              calendars do; that is where the unlisted stuff hides.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link href="/events" className="inline-flex items-center justify-center rounded-full bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800">
                See everything happening
              </Link>
              <Link href="/guides/cheap-eats" className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition hover:border-gray-400">
                Eat cheap instead
              </Link>
              <Link href="/events/submit" className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition hover:border-gray-400">
                Submit an event
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {totalCount <= 2 && (
              <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-950">
                <p className="font-semibold">Slim pickings this week.</p>
                <p className="mt-1 text-orange-900/80">
                  Campus breaks pause most club budgets — and their pizza orders. New listings land
                  overnight, so check back tomorrow morning, or <Link href="/events" className="underline underline-offset-2">browse everything happening</Link> instead.
                </p>
              </div>
            )}
            {days.map((day) => (
              <div key={day.dayKey}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">{day.dayLabel}</h3>
                <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                  {day.events.map((event) => <EventCard key={event.id} event={event} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs leading-5 text-gray-500">
          Pulled nightly from public 7C calendars and submitted listings; expired events drop off
          automatically. Not independently verified — we list whatever mentions free and food, and
          the food is whatever the organizers promised. Listings that say &ldquo;lunch
          provided&rdquo; without &ldquo;free&rdquo; live under <Link href="/events?filter=food" className="underline underline-offset-2">food events</Link>.
        </p>
      </section>

      {/* ── Radar rules (tip cards) ──────────────────────────────────── */}
      <section className="mx-auto mt-8 max-w-6xl">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">Screenshot this</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl" style={{ fontFamily: 'var(--font-playfair)' }}>
              Four free-food radar rules that survive contact with reality
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-gray-600">
            The radar changes nightly; these rules do not. Learn them once and eat free more often.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {radarTips.map((tip, index) => (
            <article key={tip.title} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">{index + 1}</span>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-700">{tip.tag}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-950">{tip.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{tip.copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Fast share copy ──────────────────────────────────────────── */}
      <section className="mx-auto mt-8 max-w-6xl">
        <article className="rounded-3xl border border-gray-200 bg-gray-950 p-5 text-white shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">Fast share copy</p>
          <h2 className="mt-2 text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>
            Text this when the group chat is hungry and broke
          </h2>
          <p className="mt-4 text-sm leading-6 text-gray-200">
            “Before anyone pays for food: claremont.life/guides/free-food — live list of every
            free-food event at the 5Cs this week, by day. It updates itself.”
          </p>
        </article>
      </section>

      {/* ── Newsletter ───────────────────────────────────────────────── */}
      <section className="mx-auto mt-8 max-w-6xl">
        <NewsletterSignup />
      </section>
    </div>
  )
}
