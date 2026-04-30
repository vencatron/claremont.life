import { getDeals } from '@/lib/data'
import { DealsGuide } from './deals-guide'
import { PageHeader } from '@/components/PageHeader'

export const revalidate = 3600

export default async function DealsPage() {
  const deals = await getDeals()
  return (
    <div>
      <PageHeader title="Student Deals" subtitle="Discounts that work with student ID, finals needs, birthdays, and 5C life" />
      <DealsGuide deals={deals} />
    </div>
  )
}
