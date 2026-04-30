import { beforeYouSignTips, zones } from './zones'

const commuteReality: Record<string, string> = {
  'college-ave': 'True walk zone. You pay for rolling out of bed and still making class, but parking is tight and leases disappear early.',
  village: 'Walkable if you are okay with 10–15 minutes to most classrooms. Best for students who want food, coffee, and Metrolink nearby.',
  'indian-hill': 'Usually a bike or quick drive zone. Better value, but test Indian Hill traffic before you commit.',
  'padua-hills': 'Car needed. Pretty, quieter, and often cheaper, but the commute becomes part of your daily life.',
}

const redFlags = [
  'No AC or vague “window unit maybe” answers. Summer heat in Claremont is not a minor detail.',
  'No dedicated parking near campus or The Village. Street parking can become a daily tax on your life.',
  'Laundry that is “nearby,” coin-only, broken often, or shared with too many units.',
  'Foothill Blvd or Indian Hill frontage without a night/rush-hour visit. Traffic noise is real.',
  'Lease terms that dodge basics: total move-in cost, deposits, utilities, guest rules, repairs, and whether subletting is allowed.',
  'Scam or unverified listings: pressure to wire money, no live tour, no real address, copied photos, or a landlord who will not verify ownership.',
]

const timeline = [
  {
    window: 'January / February',
    reality: 'Start looking and pick roommates. The best fall leases and walkable units often surface before everyone is panicking.',
  },
  {
    window: 'March / April',
    reality: 'Peak scramble. Tour fast, compare rent ranges, and do not let urgency make you ignore red flags.',
  },
  {
    window: 'May / June',
    reality: 'Leftovers plus negotiation. Good fits still happen, but expect tradeoffs on walkability, parking, or price.',
  },
  {
    window: 'Summer',
    reality: 'Sublets are everywhere in 5C groups. Useful bridge, but verify dates, deposits, keys, and landlord permission.',
  },
]

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 md:text-3xl" style={{ fontFamily: 'var(--font-playfair)' }}>
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 md:text-base">{children}</p>
    </div>
  )
}

export function HousingSurvivalGuide() {
  return (
    <div className="px-4 pb-8 pt-4 md:px-6 md:pt-6">
      <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-gradient-to-br from-red-50 via-white to-amber-50 p-5 shadow-sm md:p-8">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Housing survival guide</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950 md:text-6xl" style={{ fontFamily: 'var(--font-playfair)' }}>
            Don’t get screwed on housing.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 md:text-lg">
            Before you open the map, get the practical version: where students actually live, what “walkable” really
            means, what typical rents look like, and which red flags should make you slow down.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-950">Best walkability</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">College Ave and The Village go first.</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-950">Better value</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">Indian Hill often means more space for less.</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-950">Car reality</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">North Claremont / Padua Hills is not a casual walk.</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-950">Not legal advice</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">Use this as a student checklist, then read the lease.</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading eyebrow="Where students actually live" title="Walkability, commute reality, and price expectations">
          Most students and grad students optimize for one of three things: walking distance, rent, or quiet. You usually
          only get two.
        </SectionHeading>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {zones.map((zone) => (
            <article key={zone.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: zone.colorHex }} />
                <h3 className="font-bold text-gray-950">{zone.name}</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-700">{zone.vibe}</p>
              <p className="mt-3 rounded-2xl bg-gray-50 p-3 text-sm leading-6 text-gray-700">
                <span className="font-semibold text-gray-950">Commute reality:</span> {commuteReality[zone.id]}
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <p className="font-semibold text-gray-950">Typical rent ranges</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="rounded-xl bg-gray-50 p-2">
                    <span className="block text-gray-400">Studio</span>
                    <span className="font-semibold text-gray-900">{zone.rent.studio}</span>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-2">
                    <span className="block text-gray-400">1BR</span>
                    <span className="font-semibold text-gray-900">{zone.rent.oneBR}</span>
                  </div>
                  {zone.rent.twoBR && (
                    <div className="col-span-2 rounded-xl bg-gray-50 p-2">
                      <span className="block text-gray-400">2BR shared</span>
                      <span className="font-semibold text-gray-900">{zone.rent.twoBR}</span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm md:p-6">
          <SectionHeading eyebrow="Red flags checklist" title="Before You Sign Anything">
            Fast leases are normal. Bad surprises are not. Verify the boring stuff before sending money.
          </SectionHeading>
          <ul className="space-y-3">
            {redFlags.map((flag) => (
              <li key={flag} className="flex gap-3 text-sm leading-6 text-amber-900">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[11px] font-bold text-amber-900">
                  !
                </span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl bg-white/70 p-4">
            <p className="text-sm font-semibold text-amber-950">Also ask:</p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-amber-900">
              {beforeYouSignTips.slice(0, 4).map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          </div>
        </article>

        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <SectionHeading eyebrow="When to start looking" title="Housing timeline">
            Timing matters in Claremont because the truly walkable places are limited and student demand is predictable.
          </SectionHeading>
          <ol className="space-y-4">
            {timeline.map((item, index) => (
              <li key={item.window} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-950 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-950">{item.window}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{item.reality}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
            Future landlord or sublet boards should be moderated. Until then, treat any listing as unverified until you
            have a real tour, real lease, and a payment trail you trust.
          </p>
        </article>
      </section>

      <section className="mt-8 rounded-3xl border border-gray-200 bg-gray-950 p-5 text-white shadow-sm md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Map next</p>
        <h2 className="mt-2 text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>
          Use the map for specifics, not survival basics.
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-200">
          Tap a zone below to compare listings, street views, local tips, and the same rent expectations by area. Sparse
          listings do not mean the guide is useless—the neighborhood tradeoffs still apply.
        </p>
      </section>
    </div>
  )
}
