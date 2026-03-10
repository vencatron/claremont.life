import { getEatPlaces } from '@/lib/data'
import { EatGuide } from './eat-guide'
import { PageHeader } from '@/components/PageHeader'

export const revalidate = 3600

export default async function EatPage() {
  const places = await getEatPlaces()
  return (
    <div>
      <PageHeader title="Eat & Drink" subtitle="Every spot walkable to the Claremont Colleges" />
      <EatGuide places={places} />
    </div>
  )
}
