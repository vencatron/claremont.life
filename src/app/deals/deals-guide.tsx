'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Globe, Instagram, Tag, BadgeCheck } from 'lucide-react'
import type { Deal } from '@/types'

interface DealsGuideProps {
  deals: Deal[]
}

const CATEGORIES = [
  'All',
  'Shopping',
  'Food & Drink',
  'Beauty & Wellness',
  'Arts & Culture',
] as const

export function DealsGuide({ deals }: DealsGuideProps) {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return deals
      .filter(d => filter === 'All' || d.category === filter)
      .filter(d => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          d.name.toLowerCase().includes(q) ||
          d.deal_description.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          (d.address?.toLowerCase().includes(q) ?? false)
        )
      })
  }, [deals, filter, search])

  return (
    <div>
      {/* Search */}
      <div className="px-4 md:px-6 pt-3">
        <input
          type="text"
          placeholder="Search deals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:max-w-md rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto py-3 px-4 md:px-6 md:flex-wrap [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === cat
                ? 'bg-primary text-white'
                : 'border border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="px-4 md:px-6 pb-2">
        <p className="text-sm text-gray-500">{filtered.length} deals</p>
      </div>

      {/* Deal cards */}
      <div className="px-4 md:px-6 pb-4 space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
        {filtered.map((deal) => (
          <Card key={deal.id} className="p-4 shadow-sm rounded-xl">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className="font-semibold text-base truncate"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  {deal.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {deal.category}
                  </Badge>
                  {deal.requires_student_id && (
                    <Badge variant="outline" className="text-xs text-gray-500 gap-1">
                      <BadgeCheck className="h-3 w-3" />
                      Student ID
                    </Badge>
                  )}
                </div>
              </div>
              {deal.discount_pct && (
                <Badge className="shrink-0 bg-green-100 text-green-800 hover:bg-green-100 text-sm font-bold px-2.5 py-1">
                  {deal.discount_pct}% OFF
                </Badge>
              )}
            </div>

            <p className="text-sm text-gray-700 mt-2">
              <Tag className="inline h-3.5 w-3.5 mr-1 text-gray-400" />
              {deal.deal_description}
            </p>

            {deal.address && (
              <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{deal.address}</span>
              </div>
            )}

            {/* Links */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {deal.website && (
                <a
                  href={deal.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
                >
                  <Globe className="h-3 w-3" />Website
                </a>
              )}
              {deal.instagram && (
                <a
                  href={`https://instagram.com/${deal.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
                >
                  <Instagram className="h-3 w-3" />
                  {deal.instagram.startsWith('@') ? deal.instagram : `@${deal.instagram}`}
                </a>
              )}
            </div>

            {/* Last verified */}
            {deal.last_verified && (
              <p className="text-xs text-gray-400 mt-2">
                Verified {new Date(deal.last_verified).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </Card>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8 md:col-span-2 lg:col-span-3">No deals found</p>
        )}
      </div>
    </div>
  )
}
