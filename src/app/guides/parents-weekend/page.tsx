import type { Metadata } from 'next'
import Link from 'next/link'
import { ShareGuideButton } from '@/components/ShareGuideButton'

const guideUrl = 'https://claremont.life/guides/parents-weekend'

const visitTips = [
  {
    title: 'Book the hotel before the flight',
    tag: 'The hard constraint',
    copy: 'Claremont itself has only a handful of in-town hotels — Hotel Casa 425 in the Village and the DoubleTree by Hilton Claremont are the walkable picks — and they sell out fast for family weekends and commencement. Book the moment you know your dates, or plan on staying in a neighboring town and driving in.',
  },
  {
    title: 'Know which meals need a reservation',
    tag: 'Restaurant strategy',
    copy: 'The Village’s sit-down restaurants take reservations and need them on busy weekends — call or book online a week or more ahead for dinner. Casual counter-service spots, cafes, and bakeries are walk-in and easy; save those for lunch.',
  },
  {
    title: 'Morning belongs to the Village',
    tag: 'Day-plan structure',
    copy: 'Start with coffee and a slow walk through the Village while it is cool and quiet: independent shops, the farmers market on Sundays, and breakfast without a wait. It is all a few flat blocks — no car needed once you park.',
  },
  {
    title: 'Afternoon belongs to campus',
    tag: 'Day-plan structure',
    copy: 'Let your student give the tour: their dorm, the dining hall, the buildings they actually live in. The five undergraduate campuses sit side by side and are genuinely walkable — comfortable shoes cover all of it.',
  },
  {
    title: 'Check the events feed before you land',
    tag: 'Free entertainment',
    copy: 'Concerts, talks, athletics, and gallery shows run constantly during the semester, and most are free and open to visitors. A quick scan of the events page can anchor your Saturday evening.',
  },
  {
    title: 'Build in unscheduled time',
    tag: 'The real advice',
    copy: 'The best hour of a family visit is usually the unplanned one — a second coffee, a grocery run for the dorm, a walk with no destination. Leave room for it; the itinerary is not the point.',
  },
]

export const metadata: Metadata = {
  title: 'Visiting the Claremont Colleges — Parents & Family Weekend Guide',
  description:
    'Planning a family visit to the Claremont Colleges: where to stay near campus, how Village restaurant reservations work, and a simple day plan that actually flows.',
}

export default function ParentsWeekendGuidePage() {
  return (
    <div className="bg-stone-50 px-4 pb-10 pt-4 text-gray-950 md:px-6 md:pt-6">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-orange-50 p-5 shadow-sm md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">Family visit field guide</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-gray-950 md:text-6xl" style={{ fontFamily: 'var(--font-playfair)' }}>
              Visiting your student in Claremont, planned like someone who lives here.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 md:text-lg">
              Where to stay, when reservations matter, and a day plan that works with the town instead of against it. Claremont is small,
              walkable, and easy to enjoy — if you book the two things that sell out.
            </p>
          </div>

          <aside className="rounded-3xl border border-white/80 bg-white/85 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">QR-friendly URL</p>
            <p className="mt-2 break-all rounded-2xl bg-gray-950 p-3 font-mono text-xs leading-5 text-white">claremont.life/guides/parents-weekend</p>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Send it to your family the day they mention booking flights.
            </p>
            <ShareGuideButton
              className="mt-4"
              title="Visiting the Claremont Colleges — Family Weekend Guide"
              text="Where to stay, where to eat, and a simple day plan for visiting family."
              url={guideUrl}
            />
          </aside>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/guides/getting-around" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Fly into the right airport</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">ONT is 15 minutes away — the getting-around guide explains the rest.</span>
          </Link>
          <Link href="/eat" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Browse Village restaurants</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">The eat guide covers what is open, walkable, and worth it.</span>
          </Link>
          <Link href="/events" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">See what&apos;s on that weekend</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">Concerts, talks, and campus events — most free and open to visitors.</span>
          </Link>
          <Link href="/explore" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Preview the Village</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">An interactive map of the blocks you&apos;ll be walking.</span>
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">Screenshot this</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl" style={{ fontFamily: 'var(--font-playfair)' }}>
              Six calls that make a family weekend actually relaxing
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-gray-600">
            Prices and availability shift constantly — book hotels and dinner directly and treat this as the checklist of what to book, not a rate sheet.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visitTips.map((tip, index) => (
            <article key={tip.title} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-700 text-sm font-bold text-white">{index + 1}</span>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">{tip.tag}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-950">{tip.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{tip.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl">
        <article className="rounded-3xl border border-gray-200 bg-gray-950 p-5 text-white shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">Fast share copy</p>
          <h2 className="mt-2 text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>
            Text this when your family says &ldquo;we&apos;re thinking of visiting&rdquo;
          </h2>
          <p className="mt-4 text-sm leading-6 text-gray-200">
            &ldquo;Book the hotel first — Claremont only has a couple in town and they fill up. Everything else is here:
            claremont.life/guides/parents-weekend.&rdquo;
          </p>
        </article>
      </section>
    </div>
  )
}
