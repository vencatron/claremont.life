import type { Metadata } from 'next'
import Link from 'next/link'
import { ShareGuideButton } from '@/components/ShareGuideButton'

const guideUrl = 'https://claremont.life/guides/getting-around'

const transitTips = [
  {
    title: 'Fly into ONT, not LAX',
    tag: 'The airport call',
    copy: 'Ontario International (ONT) is about 15 minutes from campus and is almost always the right answer — a short, cheap rideshare or an easy family pickup. Only choose LAX when the fare difference is dramatic.',
  },
  {
    title: 'If you do land at LAX, take the train',
    tag: 'The LAX escape route',
    copy: 'The car-free route: LAX FlyAway bus to Union Station, then the Metrolink San Bernardino Line to Claremont station — which sits right at the edge of the Village, a walkable distance from every campus. Check metrolinktrains.com for schedules before you fly; service thins out at night.',
  },
  {
    title: 'A rideshare from LAX is a real expense',
    tag: 'Budget honesty',
    copy: 'LAX is roughly 50 freeway miles away, and with traffic that ride gets long and expensive. Split it with other students on your flight if you can, or time your arrival so the FlyAway-plus-Metrolink route still runs.',
  },
  {
    title: 'Metrolink is your LA day-trip machine',
    tag: 'Weekend unlock',
    copy: 'The San Bernardino Line runs from Claremont station to downtown LA without touching a freeway. Check current student discounts and weekend fares on metrolinktrains.com — trains back to Claremont end earlier than your night will, so check the last departure first.',
  },
  {
    title: 'Foothill Transit covers the local gaps',
    tag: 'Errand routes',
    copy: 'Foothill Transit buses connect Claremont to neighboring towns, shopping, and the wider foothill corridor. Routes and fare programs (including student passes some years) are on foothilltransit.org — verify before you rely on a route.',
  },
  {
    title: 'A bike beats everything inside town',
    tag: 'Daily default',
    copy: 'Claremont is flat, compact, and bike-friendly: campuses, the Village, groceries, and the train station are all minutes apart on two wheels. A solid U-lock matters more than a fancy bike.',
  },
  {
    title: 'Save rideshare for the last mile',
    tag: 'Spend it where it counts',
    copy: 'Within Claremont, walking and biking cover nearly everything, so rideshare money is best spent on airport runs, late nights, and the occasional trip transit does not serve. It is a tool, not a commute plan.',
  },
]

export const metadata: Metadata = {
  title: 'Getting to Claremont from LAX or ONT — and Living Here Car-Free',
  description:
    'How to get to the Claremont Colleges from ONT or LAX, use Metrolink and Foothill Transit, and live comfortably in Claremont without a car.',
}

export default function GettingAroundGuidePage() {
  return (
    <div className="bg-stone-50 px-4 pb-10 pt-4 text-gray-950 md:px-6 md:pt-6">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-sm md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Getting around field guide</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-gray-950 md:text-6xl" style={{ fontFamily: 'var(--font-playfair)' }}>
              How to get to Claremont — and live here happily without a car.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 md:text-lg">
              The airport decision, the train that puts LA a ride away, and the honest version of car-free life at the 5Cs. Claremont has its
              own Metrolink station at the edge of the Village — that changes the math on everything.
            </p>
          </div>

          <aside className="rounded-3xl border border-white/80 bg-white/85 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">QR-friendly URL</p>
            <p className="mt-2 break-all rounded-2xl bg-gray-950 p-3 font-mono text-xs leading-5 text-white">claremont.life/guides/getting-around</p>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Send it to anyone flying in — new students, visiting friends, or family planning a trip.
            </p>
            <ShareGuideButton
              className="mt-4"
              title="Getting to Claremont — and Around It Without a Car"
              text="Airports, Metrolink, buses, and biking: the Claremont transit guide."
              url={guideUrl}
            />
          </aside>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a href="https://metrolinktrains.com" target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Metrolink schedules</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">Official San Bernardino Line times and fares at metrolinktrains.com.</span>
          </a>
          <a href="https://foothilltransit.org" target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Foothill Transit routes</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">Local bus routes and fare programs at foothilltransit.org.</span>
          </a>
          <Link href="/guides/new-student-checklist" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Packing for the move?</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">The new-student checklist covers what to bring on that flight.</span>
          </Link>
          <Link href="/new" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">New to Claremont?</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">Pair this with the survival guide for first-years and transfers.</span>
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Screenshot this</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl" style={{ fontFamily: 'var(--font-playfair)' }}>
              Seven transit calls that make Claremont easy without a car
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-gray-600">
            Fares and timetables change — we describe the routes and link the official sources instead of quoting numbers that go stale.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {transitTips.map((tip, index) => (
            <article key={tip.title} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">{index + 1}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">{tip.tag}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-950">{tip.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{tip.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl">
        <article className="rounded-3xl border border-gray-200 bg-gray-950 p-5 text-white shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Fast share copy</p>
          <h2 className="mt-2 text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>
            Text this to whoever is booking the flight
          </h2>
          <p className="mt-4 text-sm leading-6 text-gray-200">
            &ldquo;Fly into ONT, not LAX — it is 15 minutes from campus. Full transit guide here: claremont.life/guides/getting-around. It covers
            the LAX train route too, just in case.&rdquo;
          </p>
        </article>
      </section>
    </div>
  )
}
