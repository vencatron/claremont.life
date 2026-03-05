import { PageHeader } from '@/components/PageHeader'

export default function HousingPage() {
  return (
    <div className="px-4 pb-8">
      <PageHeader title="Off-Campus Housing" subtitle="What they don't tell you at orientation" />
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>Where to Look</h2>
        <ul className="space-y-2 text-gray-700">
          <li><strong>College Ave Corridor</strong> — Walking distance to all 5Cs. Most popular. Goes fast in spring.</li>
          <li><strong>Indian Hill Blvd</strong> — Quieter, more space. 10-min bike ride to campus.</li>
          <li><strong>Padua Hills</strong> — Up the hill. You need a car or a very good bike. Cheaper.</li>
          <li><strong>Claremont Heights</strong> — North side. Close to the Village. Slightly older buildings.</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>Average Rent</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm"><span className="font-medium">Studio</span><span className="text-gray-600">$1,400-$1,800/mo</span></div>
          <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm"><span className="font-medium">1 Bedroom</span><span className="text-gray-600">$1,700-$2,200/mo</span></div>
          <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm"><span className="font-medium">2BR (shared)</span><span className="text-gray-600">$1,100-$1,400/person</span></div>
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>Before You Sign</h2>
        <ol className="space-y-2 text-gray-700 list-decimal list-inside">
          <li>Check if the unit has AC. The Inland Empire gets 100F+ in summer. This is non-negotiable.</li>
          <li>Ask for month-to-month after the initial lease. Many landlords will agree if you ask.</li>
          <li>Street parking near the colleges is a nightmare. If the unit has no dedicated spot, factor that in.</li>
          <li>Laundry in-unit vs. shared matters more than you think. Ask before you sign.</li>
          <li>If the unit faces Foothill Blvd, visit at night first. Traffic noise is real.</li>
        </ol>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>Subletting</h2>
        <p className="text-gray-700">Summer sublets are everywhere — check the 5C Facebook housing groups and your college&apos;s housing listserv starting in March. If you&apos;re looking to sublet your place, post early (February–March) and include photos. Furnished sublets with AC go within days.</p>
      </section>
    </div>
  )
}
