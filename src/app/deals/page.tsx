import { getBusinesses } from '@/lib/data'
import { BusinessCard } from '@/components/BusinessCard'
import { PageHeader } from '@/components/PageHeader'

export const revalidate = 3600

export default async function DealsPage() {
  const businesses = await getBusinesses()
  const grouped = businesses.reduce<Record<string, typeof businesses>>((acc, biz) => {
    if (!acc[biz.category]) acc[biz.category] = []
    acc[biz.category].push(biz)
    return acc
  }, {})

  return (
    <div>
      <PageHeader title="Student Deals" subtitle="Verified discounts with your college ID" />
      <div className="px-4 pb-4 space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{category}</h2>
            <div className="space-y-3">{items.map((business) => <BusinessCard key={business.id} business={business} />)}</div>
          </div>
        ))}
        {businesses.length === 0 && <p className="text-center text-gray-500 py-12">No deals available right now — check back soon.</p>}
      </div>
    </div>
  )
}
