import type { Metadata } from 'next'
import { getDeals } from '@/lib/data'
import { DealsGuide } from './deals-guide'
import { PageHeader } from '@/components/PageHeader'

export const metadata: Metadata = {
  title: 'Student Deals in Claremont',
  description:
    'Student discounts and recurring specials in Claremont and the Village — food, coffee, services, and shops that work with a 5C student ID.',
}

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
