import type { Metadata } from 'next'
import Link from 'next/link'
import { ShareGuideButton } from '@/components/ShareGuideButton'

const guideUrl = 'https://claremont.life/guides/new-student-checklist'

const packingTips = [
  {
    title: 'Pack for two seasons at once',
    tag: 'SoCal weather math',
    copy: 'August through October runs hot — often 90s during the day — but desert-adjacent nights get genuinely cold by late fall. Layers beat one heavy coat: t-shirts, a hoodie, and one real jacket cover almost everything.',
  },
  {
    title: 'Skip the rain gear aisle',
    tag: 'Leave it home',
    copy: 'Claremont gets a handful of rainy weeks, mostly in winter. One packable rain shell is plenty. Rain boots, a golf umbrella, and a waterproof parka are closet space you will never get back.',
  },
  {
    title: 'A fan is not optional',
    tag: 'Dorm reality',
    copy: 'Many dorm rooms run warm into October. A decent fan is the single most-borrowed item on campus in September — bring your own and sleep better the first month.',
  },
  {
    title: 'Mattress topper and power strips',
    tag: 'Dorm reality',
    copy: 'Dorm mattresses are dorm mattresses everywhere. A foam topper is the upgrade people actually notice. Add two power strips or extension cords — outlets are never where your desk is.',
  },
  {
    title: 'Do not bring the whole kitchen',
    tag: 'Leave it home',
    copy: 'You are on a meal plan and the Village is a short walk. A water bottle, one mug, and maybe an electric kettle cover 95% of dorm cooking. Skip the appliance haul — check your college housing rules before buying anything with a heating element.',
  },
  {
    title: 'Sun protection is a school supply',
    tag: 'SoCal weather math',
    copy: 'Sunscreen, sunglasses, and a hat get used year-round here. If you are coming from somewhere gray, this is the thing you will forget and then buy locally at full price.',
  },
  {
    title: 'Get a bike (or plan to walk everything)',
    tag: 'First-week setup',
    copy: 'The campuses and the Village are flat and compact — a basic bike with a solid lock turns every errand into five minutes. Buy used locally or bring one; either way, register it with your campus if your school offers it.',
  },
  {
    title: 'Sort Claremont Cash and campus stores early',
    tag: 'First-week setup',
    copy: 'Set up your campus card and any campus-cash program during orientation, and find your campus store (Huntley Bookstore serves the Claremont Colleges) before you need a charger cable at 9 p.m.',
  },
]

export const metadata: Metadata = {
  title: 'What to Bring to the Claremont Colleges — New Student Checklist',
  description:
    'A packing and setup checklist for new 5C students: what SoCal weather actually requires, dorm essentials, what to leave home, and first-week setup in Claremont.',
}

export default function NewStudentChecklistGuidePage() {
  return (
    <div className="bg-stone-50 px-4 pb-10 pt-4 text-gray-950 md:px-6 md:pt-6">
      <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-amber-50 p-5 shadow-sm md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">New student checklist</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-gray-950 md:text-6xl" style={{ fontFamily: 'var(--font-playfair)' }}>
              What to actually bring to the Claremont Colleges (and what to leave home).
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 md:text-lg">
              Written for people packing in a different climate. Claremont is Southern California: hot through October, cold desert nights by
              November, and almost no rain. Pack for that, not for a generic college checklist.
            </p>
          </div>

          <aside className="rounded-3xl border border-white/80 bg-white/85 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">QR-friendly URL</p>
            <p className="mt-2 break-all rounded-2xl bg-gray-950 p-3 font-mono text-xs leading-5 text-white">claremont.life/guides/new-student-checklist</p>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              One clean landing page for admitted-student groups, family group chats, and orientation handouts.
            </p>
            <ShareGuideButton
              className="mt-4"
              title="What to Bring to the Claremont Colleges"
              text="A packing and first-week setup checklist for new 5C students."
              url={guideUrl}
            />
          </aside>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/new" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Start with the survival guide</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">The broader orientation guide for first-years, transfers, and grads.</span>
          </Link>
          <Link href="/guides/getting-around" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Plan your arrival</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">ONT vs LAX, Metrolink, and getting around without a car.</span>
          </Link>
          <Link href="/guides/cheap-eats" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Eat cheap from day one</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">Budget meals and the free-food radar for 5C students.</span>
          </Link>
          <Link href="/deals" className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-sm font-semibold text-gray-950">Check student deals</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">Discounts that work with your new student ID.</span>
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Screenshot this</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl" style={{ fontFamily: 'var(--font-playfair)' }}>
              Eight packing calls that save you a September shopping run
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-gray-600">
            Everything else — bedding sizes, banned appliances, storage — check your specific college&apos;s housing page before you buy.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packingTips.map((tip, index) => (
            <article key={tip.title} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-700 text-sm font-bold text-white">{index + 1}</span>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">{tip.tag}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-950">{tip.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{tip.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl">
        <article className="rounded-3xl border border-gray-200 bg-gray-950 p-5 text-white shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Fast share copy</p>
          <h2 className="mt-2 text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>
            Text this to the admitted-students group chat
          </h2>
          <p className="mt-4 text-sm leading-6 text-gray-200">
            &ldquo;Before anyone buys a winter parka for SoCal: claremont.life/guides/new-student-checklist. Packing list, dorm essentials, and
            what to leave home — written for Claremont specifically.&rdquo;
          </p>
        </article>
      </section>
    </div>
  )
}
