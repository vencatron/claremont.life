import { getHousingListings } from '@/lib/data'
import { PageHeader } from '@/components/PageHeader'
import type { HousingListing } from '@/types'

export const revalidate = 3600  // revalidate every hour

function WalkabilityBadge({ walkability }: { walkability: string }) {
  const config: Record<string, { icon: string; label: string; color: string }> = {
    walkable: { icon: '🚶', label: 'Walkable', color: 'bg-green-100 text-green-800' },
    bikeable: { icon: '🚲', label: 'Bikeable', color: 'bg-blue-100 text-blue-800' },
    'one-bus': { icon: '🚌', label: 'One Bus', color: 'bg-yellow-100 text-yellow-800' },
    'car-needed': { icon: '🚗', label: 'Car Needed', color: 'bg-red-100 text-red-800' },
  }
  const c = config[walkability] || config['car-needed']
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
      {c.icon} {c.label}
    </span>
  )
}

function ListingCard({ listing }: { listing: HousingListing }) {
  const distKm = listing.distance_to_campus_m ? (listing.distance_to_campus_m / 1000).toFixed(1) : null

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{listing.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{listing.address}</p>
        </div>
        <WalkabilityBadge walkability={listing.walkability} />
      </div>

      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
        {listing.rating && (
          <span>⭐ {listing.rating}{listing.rating_count ? ` (${listing.rating_count})` : ''}</span>
        )}
        {distKm && <span>📍 {distKm} km</span>}
        {listing.price_min && (
          <span className="font-medium text-gray-900">
            ${listing.price_min.toLocaleString()}
            {listing.price_max && listing.price_max !== listing.price_min ? `–$${listing.price_max.toLocaleString()}` : ''}
          </span>
        )}
      </div>

      {listing.description && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{listing.description}</p>
      )}

      <div className="flex gap-2 mt-3">
        {listing.website && (
          <a href={listing.website} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Website →
          </a>
        )}
        {listing.phone && (
          <a href={`tel:${listing.phone}`} className="text-xs text-gray-600 hover:text-gray-800">
            {listing.phone}
          </a>
        )}
        {listing.google_maps_url && (
          <a href={listing.google_maps_url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-gray-600 hover:text-gray-800">
            Maps →
          </a>
        )}
      </div>
    </div>
  )
}

export default async function HousingPage() {
  const listings = await getHousingListings()

  const walkable = listings.filter(l => l.walkability === 'walkable')
  const bikeable = listings.filter(l => l.walkability === 'bikeable')
  const oneBus = listings.filter(l => l.walkability === 'one-bus')
  const carNeeded = listings.filter(l => l.walkability === 'car-needed')

  return (
    <div className="px-4 pb-8">
      <PageHeader title="Live" subtitle={`${listings.length} rental properties near the Claremont Colleges`} />

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-700">{walkable.length}</div>
          <div className="text-xs text-green-600">🚶 Walkable</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-700">{bikeable.length}</div>
          <div className="text-xs text-blue-600">🚲 Bikeable</div>
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded-lg">
          <div className="text-lg font-bold text-yellow-700">{oneBus.length}</div>
          <div className="text-xs text-yellow-600">🚌 One Bus</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <div className="text-lg font-bold text-red-700">{carNeeded.length}</div>
          <div className="text-xs text-red-600">🚗 Car</div>
        </div>
      </div>

      {/* Listings by proximity */}
      {walkable.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>
            🚶 Walkable to Campus
          </h2>
          <div className="space-y-3">
            {walkable.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {bikeable.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>
            🚲 Bikeable
          </h2>
          <div className="space-y-3">
            {bikeable.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {oneBus.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>
            🚌 One Bus Ride
          </h2>
          <div className="space-y-3">
            {oneBus.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}

      {carNeeded.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>
            🚗 Car Needed
          </h2>
          <div className="space-y-3">
            {carNeeded.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
      )}
    </div>
  )
}
