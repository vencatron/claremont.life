import { getDeals } from '@/lib/data'
import { DealsGuide } from './deals-guide'
import { PageHeader } from '@/components/PageHeader'

export const revalidate = 3600

export default async function DealsPage() {
  const deals = await getDeals()
  return (
    <div>
      <PageHeader title="Student Deals" subtitle="Verified discounts with your college ID" />
      <DealsGuide deals={deals} />
    </div>
  )
}
