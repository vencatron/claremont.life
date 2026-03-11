import { getHousingListings } from '@/lib/data'
import { HousingMap } from './housing-map'

export const revalidate = 3600

export default async function HousingPage() {
  const listings = await getHousingListings()
  return <HousingMap listings={listings} />
}
