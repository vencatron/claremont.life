import { PageHeader } from '@/components/PageHeader'
import { EatGuide } from './eat-guide'

export default function EatPage() {
  return (
    <div>
      <PageHeader title="Eat & Drink" subtitle="The Claremont food guide, opinionated" />
      <EatGuide />
    </div>
  )
}
