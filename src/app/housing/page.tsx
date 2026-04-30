import { getHousingListings } from '@/lib/data'
import { HousingMap } from './housing-map'
import { HousingSurvivalGuide } from './housing-survival-guide'
import { zones, isPointInPolygon } from './zones'

export const revalidate = 3600

// Filter out senior living, property mgmt, real estate, dorms, and non-zone listings
const EXCLUDE_PATTERNS = [
  /senior/i,
  /retirement/i,
  /55\+/i,
  /assisted\s*living/i,
  /property\s*manage/i,
  /real\s*estate/i,
  /realty/i,
  /corporate\s*housing/i,
  /mobile\s*home/i,
  /sotheby/i,
  /\bclub\b/i,
  /\bdorm\b/i,
  /\bhall\b/i,
  /pilgrim\s*place/i,
  /ivy\s*park/i,
  /claremont\s*colleges\s*services/i,
]

function isInAnyZone(lat: number, lng: number): boolean {
  return zones.some(zone => isPointInPolygon({ lat, lng }, zone.polygon))
}

export default async function HousingPage() {
  const allListings = await getHousingListings()

  const filtered = allListings.filter(listing => {
    // Must have coordinates
    if (listing.lat == null || listing.lng == null) return false

    // Must be inside one of the 4 zones
    if (!isInAnyZone(listing.lat, listing.lng)) return false

    // Exclude senior living, property mgmt, etc.
    if (EXCLUDE_PATTERNS.some(pat => pat.test(listing.name))) return false

    return true
  })

  return (
    <>
      <HousingSurvivalGuide />
      <HousingMap listings={filtered} />
    </>
  )
}
