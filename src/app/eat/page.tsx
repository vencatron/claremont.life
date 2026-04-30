import { getEatPlaces } from '@/lib/data'
import { EatGuide } from './eat-guide'
import { PageHeader } from '@/components/PageHeader'

export const revalidate = 3600

export default async function EatPage() {
  const places = await getEatPlaces()
  return (
    <div>
      <PageHeader title="Eat & Drink" subtitle="Cheap, open, walkable, and actually useful food picks for Claremont students" />
      <EatGuide places={places} />
    </div>
  )
}
