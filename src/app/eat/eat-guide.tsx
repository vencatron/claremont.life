'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Globe, Star, ExternalLink } from 'lucide-react'
import type { EatPlace } from '@/types'

interface EatGuideProps {
  places: EatPlace[]
}

const CATEGORIES = [
  { label: 'All', match: () => true },
  { label: 'Restaurant', match: (p: EatPlace) => p.primary_type.includes('restaurant') || p.types.some(t => t.includes('restaurant')) },
  { label: 'Coffee & Cafe', match: (p: EatPlace) => p.types.some(t => t.includes('cafe') || t.includes('coffee')) },
  { label: 'Bar & Brewery', match: (p: EatPlace) => p.types.some(t => t.includes('bar') || t.includes('brewery') || t.includes('pub') || t.includes('wine')) },
  { label: 'Bakery', match: (p: EatPlace) => p.types.some(t => t.includes('bakery')) },
  { label: 'Dessert & Ice Cream', match: (p: EatPlace) => p.types.some(t => t.includes('ice_cream') || t.includes('dessert') || t.includes('donut') || t.includes('cookie')) },
  { label: 'Boba & Tea', match: (p: EatPlace) => p.types.some(t => t.includes('tea') || t.includes('bubble') || t.includes('boba')) },
  { label: 'Fast Food', match: (p: EatPlace) => p.types.some(t => t.includes('fast_food')) },
] as const

function formatPriceLevel(level: number | null): string {
  if (level === null || level === 0) return ''
  return '$'.repeat(level)
}

function formatType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

export function EatGuide({ places }: EatGuideProps) {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const cat = CATEGORIES.find(c => c.label === filter) ?? CATEGORIES[0]
    return places
      .filter(cat.match)
      .filter(p => {
        if (!search) return true
        const q = search.toLowerCase()
        return p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.primary_type.toLowerCase().replace(/_/g, ' ').includes(q)
      })
  }, [places, filter, search])

  return (
    <div>
      {/* Search */}
      <div className="px-4 md:px-6 pt-3">
        <input
          type="text"
          placeholder="Search places..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:max-w-md rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto py-3 px-4 md:px-6 md:flex-wrap [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setFilter(cat.label)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === cat.label
                ? 'bg-primary text-white'
                : 'border border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="px-4 md:px-6 pb-2">
        <p className="text-sm text-gray-500">{filtered.length} places</p>
      </div>

      {/* Place cards */}
      <div className="px-4 md:px-6 pb-4 space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
        {filtered.map((place) => (
          <Card key={place.place_id} className="p-4 shadow-sm rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-base truncate" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {place.google_maps_url ? (
                    <a href={place.google_maps_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {place.name}
                    </a>
                  ) : place.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {formatType(place.primary_type || place.types[0] || 'restaurant')}
                  </Badge>
                  {place.price_level !== null && place.price_level > 0 && (
                    <span className="text-xs text-gray-500 font-medium">{formatPriceLevel(place.price_level)}</span>
                  )}
                </div>
              </div>
              {place.rating && (
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold">{place.rating}</span>
                  {place.rating_count && (
                    <span className="text-xs text-gray-400">({place.rating_count})</span>
                  )}
                </div>
              )}
            </div>

            {place.editorial_summary && (
              <p className="text-sm text-gray-700 mt-2">{place.editorial_summary}</p>
            )}

            <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{place.address}</span>
            </div>

            {/* Action links */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {place.phone && (
                <a href={`tel:${place.phone}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary">
                  <Phone className="h-3 w-3" />{place.phone}
                </a>
              )}
              {place.website && (
                <a href={place.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary">
                  <Globe className="h-3 w-3" />Website
                </a>
              )}
              {place.google_maps_url && (
                <a href={place.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary">
                  <ExternalLink className="h-3 w-3" />Maps
                </a>
              )}
            </div>

            {/* Hours (collapsible could be added later) */}
            {place.hours && place.hours.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Hours</summary>
                <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                  {place.hours.map((h, i) => (
                    <div key={i}>{h}</div>
                  ))}
                </div>
              </details>
            )}
          </Card>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8 md:col-span-2 lg:col-span-3">No places found</p>
        )}
      </div>
    </div>
  )
}
