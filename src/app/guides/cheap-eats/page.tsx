import type { Metadata } from 'next'
import Link from 'next/link'
import { NewsletterSignup } from '@/components/NewsletterSignup'
import { ShareGuideButton } from '@/components/ShareGuideButton'

const guideUrl = 'https://claremont.life/guides/cheap-eats'

const cheapEatTips = [
  {
    title: 'Pick one under-$10 Village default',
    tag: 'Decision fatigue killer',
    copy: 'Have a burrito, slice, bowl, or bakery run you can suggest in five seconds when dining hall plans fall apart.',
  },
  {
    title: 'Treat dining halls like budget infrastructure',
    tag: 'Swipe math',
    copy: 'Use meal swipes for real meals, not panic snacks. If you are already paying for a plan, start there before delivery apps.',
  },
  {
    title: 'Stack deals before you are broke',
    tag: 'Student ID ready',
    copy: 'Ask about student pricing in the Village, save recurring specials, and check the deals page before a group order.',
  },
  {
    title: 'Build a grocery backup meal',
    tag: 'Finals-week insurance',
    copy: 'Keep one dorm-safe meal around: noodles, rice, frozen dumplings, oatmeal, or something you will actually eat at 11 p.m.',
  },
  {
    title: 'Know the free-food radar',
    tag: 'Club meeting strategy',
    copy: 'Talks, club events, department mixers, and late-night programming can turn into dinner if you check events early enough.',
  },
  {
    title: 'Make late-night plans before late night',
    tag: 'Avoid the delivery spiral',
    copy: 'Know which walkable options still work after rehearsal, lab, or a long library session so one snack does not become $28.',
  },
]

export const metadata: Metadata = {
  title: 'Cheap Eats Guide for 5C Students | claremont.life',
  description: 'A shareable Claremont cheap-eats guide for 5C students: budget meals, student deals, free-food radar, and practical food links.',
}

export default function CheapEatsGuidePage() {
  return (
    <div className="bg-stone-50 px-4 pb-10 pt-4 text-gray-950 md:px-6 md:pt-6">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-emerald-50 p-5 shadow-sm md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">Cheap eats field guide</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-gray-950 md:text-6xl" style={{ fontFamily: 'var(--font-playfair)' }}>
              The 5C student guide to eating cheap in Claremont without making it sad.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 md:text-lg">
              Send this to the group chat before someone opens a delivery app. It is built to screenshot, share, and turn into a QR code for sponsor tables, dorm boards, or orientation handouts.
            </p>
          </div>

          <aside className="rounded-3xl border border-white/80 bg-white/85 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">QR-friendly URL</p>
            <p className="mt-2 break-all rounded-2xl bg-gray-950 p-3 font-mono text-xs leading-5 text-white">claremont.life/guides/cheap-eats</p>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              One clean landing page for a broke-roommate text, club Discord, or printed flyer.
            </p>
            <ShareGuideButton
              className="mt-4"
              title="Cheap Eats Guide for 5C Students"
              text="A practical Claremont cheap-eats guide for 5C students."
              url={guideUrl}
            />
          </aside>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/eat" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Find food now</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">Walkable meals, coffee, and quick options around the 5Cs.</span>
          </Link>
          <Link href="/deals" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Check student deals</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">Discounts and recurring specials before you pay full price.</span>
          </Link>
          <Link href="/events" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Watch for free food</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">Talks, club nights, and campus events that can save dinner.</span>
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">Screenshot this</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl" style={{ fontFamily: 'var(--font-playfair)' }}>
              Six cheap-eats rules that actually help during a busy week
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-gray-600">
            Compact enough for a screenshot; specific enough to save you from spending your laundry money on delivery fees.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cheapEatTips.map((tip, index) => (
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

      <section className="mx-auto mt-8 grid max-w-6xl gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border border-gray-200 bg-gray-950 p-5 text-white shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">Fast share copy</p>
          <h2 className="mt-2 text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>
            Text this when the group chat says “where should we eat?”
          </h2>
          <p className="mt-4 text-sm leading-6 text-gray-200">
            “Before we order delivery, check this cheap-eats guide: claremont.life/guides/cheap-eats. It links to food, deals, free-food events, and the new-student guide.”
          </p>
        </article>

        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Student-value CTA</p>
          <NewsletterSignup heading="Get the weekly broke-but-fed Claremont student update." />
        </article>
      </section>
    </div>
  )
}
