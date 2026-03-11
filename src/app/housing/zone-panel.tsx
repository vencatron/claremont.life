'use client'

import { useRef } from 'react'
import type { HousingListing } from '@/types'
import type { Zone } from './zones'
import { beforeYouSignTips } from './zones'

interface ZonePanelProps {
  zone: Zone
  listings: HousingListing[]
  apiKey: string
  onClose: () => void
}

const WALKABILITY = {
  walkable: { icon: '🚶', label: 'Walkable', color: 'bg-green-100 text-green-800' },
  bikeable: { icon: '🚲', label: 'Bikeable', color: 'bg-blue-100 text-blue-800' },
  'one-bus': { icon: '🚌', label: 'One Bus', color: 'bg-yellow-100 text-yellow-800' },
  'car-needed': { icon: '🚗', label: 'Car Needed', color: 'bg-red-100 text-red-800' },
}

const COLOR_DOT: Record<string, string> = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
}
const COLOR_BORDER: Record<string, string> = {
  green: 'border-green-200',
  blue: 'border-blue-200',
  orange: 'border-orange-200',
  purple: 'border-purple-200',
}
const COLOR_BG: Record<string, string> = {
  green: 'bg-green-50',
  blue: 'bg-blue-50',
  orange: 'bg-orange-50',
  purple: 'bg-purple-50',
}
const COLOR_TEXT: Record<string, string> = {
  green: 'text-green-700',
  blue: 'text-blue-700',
  orange: 'text-orange-700',
  purple: 'text-purple-700',
}

function streetViewUrl(lat: number, lng: number, heading: number, apiKey: string) {
  return `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${lat},${lng}&fov=80&heading=${heading}&pitch=10&key=${apiKey}`
}

function streetViewMapLink(lat: number, lng: number) {
  return `https://www.google.com/maps/@${lat},${lng},3a,75y,90t/data=!3m6!1e1`
}

function WalkabilityBadge({ walkability }: { walkability: string }) {
  const c = WALKABILITY[walkability as keyof typeof WALKABILITY] ?? WALKABILITY['car-needed']
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
      {c.icon} {c.label}
    </span>
  )
}

export function ZonePanel({ zone, listings, apiKey, onClose }: ZonePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/25 md:hidden"
        onClick={onClose}
      />

      {/* Panel — mobile: slide up from bottom; desktop: right sidebar */}
      <div
        className={[
          'fixed z-50 bg-white shadow-2xl flex flex-col',
          // Mobile
          'bottom-0 left-0 right-0 rounded-t-3xl max-h-[68vh]',
          // Desktop
          'md:top-0 md:right-0 md:bottom-0 md:left-auto md:w-[400px] md:rounded-none md:max-h-full',
          // Animation
          'animate-in slide-in-from-bottom-8 duration-300 ease-out',
          'md:animate-in md:slide-in-from-right-8',
        ].join(' ')}
      >
        {/* Sticky header */}
        <div className="flex-shrink-0 pt-3 px-5 pb-4 border-b border-gray-100 bg-white rounded-t-3xl md:rounded-none">
          {/* Drag handle (mobile only) */}
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 md:hidden" />
          <div className="flex items-start gap-3">
            <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${COLOR_DOT[zone.color]}`} />
            <div className="flex-1 min-w-0">
              <h2
                className="text-xl font-bold text-gray-900 leading-tight"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {zone.name}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">{zone.vibe}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-5 space-y-6 pb-24">

            {/* Insight callout */}
            <div className={`rounded-2xl p-4 border ${COLOR_BG[zone.color]} ${COLOR_BORDER[zone.color]}`}>
              <p className={`text-sm font-medium leading-relaxed ${COLOR_TEXT[zone.color]}`}>
                💡 {zone.insight}
              </p>
            </div>

            {/* Rent ranges */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Typical Rent</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-2xl p-3">
                  <div className="text-xs text-gray-400 mb-0.5">Studio</div>
                  <div className="font-semibold text-gray-900 text-sm">{zone.rent.studio}</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3">
                  <div className="text-xs text-gray-400 mb-0.5">1 Bedroom</div>
                  <div className="font-semibold text-gray-900 text-sm">{zone.rent.oneBR}</div>
                </div>
                {zone.rent.twoBR && (
                  <div className="bg-gray-50 rounded-2xl p-3 col-span-2">
                    <div className="text-xs text-gray-400 mb-0.5">2BR shared (per person)</div>
                    <div className="font-semibold text-gray-900 text-sm">{zone.rent.twoBR}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Street Views */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Street View
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
                {zone.streetViews.map((sv, i) => (
                  <a
                    key={i}
                    href={streetViewMapLink(sv.lat, sv.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-64 snap-start block group"
                  >
                    <div className="relative overflow-hidden rounded-2xl">
                      <img
                        src={streetViewUrl(sv.lat, sv.lng, sv.heading, apiKey)}
                        alt={sv.label}
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-xs font-medium">{sv.label}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Rental listings */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {listings.length > 0
                  ? `${listings.length} Rental${listings.length !== 1 ? 's' : ''} in This Area`
                  : 'Rentals in This Area'}
              </h3>

              {listings.length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-sm text-gray-500">No listings mapped to this zone yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Check Zillow, Craigslist, and 5C Facebook groups.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {listings.slice(0, 10).map(listing => {
                    const distKm = listing.distance_to_campus_m
                      ? (listing.distance_to_campus_m / 1000).toFixed(1)
                      : null
                    const w = WALKABILITY[listing.walkability as keyof typeof WALKABILITY] ?? WALKABILITY['car-needed']
                    return (
                      <div key={listing.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{listing.name}</p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{listing.address}</p>
                          </div>
                          <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${w.color}`}>
                            {w.icon} {w.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {listing.rating && (
                            <span>⭐ {listing.rating}{listing.rating_count ? ` (${listing.rating_count})` : ''}</span>
                          )}
                          {distKm && <span>📍 {distKm} km</span>}
                          {listing.price_min && (
                            <span className="font-semibold text-gray-800">
                              ${listing.price_min.toLocaleString()}
                              {listing.price_max && listing.price_max !== listing.price_min
                                ? `–$${listing.price_max.toLocaleString()}`
                                : ''}
                              /mo
                            </span>
                          )}
                        </div>

                        {(listing.has_ac !== null || listing.has_parking !== null || listing.has_laundry !== null) && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {listing.has_ac && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">❄️ AC</span>
                            )}
                            {listing.has_parking && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">🅿️ Parking</span>
                            )}
                            {listing.has_laundry && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">🧺 Laundry</span>
                            )}
                            {listing.pet_friendly && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">🐾 Pets OK</span>
                            )}
                          </div>
                        )}

                        <div className="flex gap-3 mt-3 pt-2 border-t border-gray-50">
                          {listing.website && (
                            <a
                              href={listing.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                            >
                              Website →
                            </a>
                          )}
                          {listing.listing_url && listing.listing_url !== listing.website && (
                            <a
                              href={listing.listing_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Listing →
                            </a>
                          )}
                          {listing.phone && (
                            <a href={`tel:${listing.phone}`} className="text-xs text-gray-500 hover:text-gray-700">
                              {listing.phone}
                            </a>
                          )}
                          {listing.google_maps_url && (
                            <a
                              href={listing.google_maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Maps →
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {listings.length > 10 && (
                    <p className="text-xs text-gray-400 text-center py-1">
                      +{listings.length - 10} more listings in this area
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Zone tips */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Local Tips</h3>
              <div className="space-y-2">
                {zone.tips.map((tip, i) => (
                  <div key={i} className="flex gap-2.5 text-sm text-gray-700">
                    <span className="flex-shrink-0 text-gray-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Before you sign */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-3">📋 Before You Sign Anything</h3>
              <div className="space-y-2">
                {beforeYouSignTips.map((tip, i) => (
                  <div key={i} className="flex gap-2 text-xs text-amber-800">
                    <span className="flex-shrink-0 font-bold">{i + 1}.</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
