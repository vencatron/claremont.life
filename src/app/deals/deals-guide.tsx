'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Globe, Instagram, Tag, BadgeCheck, Sparkles } from 'lucide-react'
import type { Deal } from '@/types'
import {
  STUDENT_DEAL_FILTERS,
  buildStudentDealCardModel,
  filterStudentDeals,
  type StudentDealFilterId,
} from '@/lib/student-deals'

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
  const [studentFilter, setStudentFilter] = useState<StudentDealFilterId>('all')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return filterStudentDeals(deals, {
      studentFilter,
      category: categoryFilter,
      search,
    })
  }, [deals, studentFilter, categoryFilter, search])

  const clearFilters = () => {
    setStudentFilter('all')
    setCategoryFilter('All')
    setSearch('')
  }

  return (
    <div>
      {/* Search */}
      <div className="px-4 md:px-6 pt-3">
        <input
          type="text"
          placeholder="Search by deal, place, badge, or need..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:max-w-md rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Student need filters */}
      <div className="px-4 md:px-6 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Student needs</p>
        <div className="flex gap-2 overflow-x-auto md:flex-wrap [&::-webkit-scrollbar]:hidden">
          {STUDENT_DEAL_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStudentFilter(filter.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                studentFilter === filter.id
                  ? 'bg-primary text-white'
                  : 'border border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category filters */}
      <div className="px-4 md:px-6 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Category</p>
        <div className="flex gap-2 overflow-x-auto md:flex-wrap [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Count + CTA */}
      <div className="px-4 md:px-6 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-500">{filtered.length} verified student deals</p>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">Know a deal?</span>
          <span className="rounded-full bg-green-50 px-3 py-1 text-green-800">Business owner?</span>
        </div>
      </div>

      {/* Deal cards */}
      <div className="px-4 md:px-6 pb-4 space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
        {filtered.map((deal) => {
          const model = buildStudentDealCardModel(deal)

          return (
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
                    {model.badges.map((badge) => (
                      <Badge
                        key={badge.id}
                        variant="outline"
                        className="text-xs text-gray-600 gap-1"
                      >
                        {badge.id === 'student-id' || badge.id === 'verified-this-month' ? (
                          <BadgeCheck className="h-3 w-3" />
                        ) : badge.id === 'exclusive' ? (
                          <Sparkles className="h-3 w-3" />
                        ) : null}
                        {badge.label}
                      </Badge>
                    ))}
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
                {model.safeWebsiteUrl && (
                  <a
                    href={model.safeWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
                  >
                    <Globe className="h-3 w-3" />Website
                  </a>
                )}
                {model.safeInstagramLink && (
                  <a
                    href={model.safeInstagramLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary"
                  >
                    <Instagram className="h-3 w-3" />
                    {model.safeInstagramLink.label}
                  </a>
                )}
              </div>

              {/* Last verified */}
              {model.verificationLabel && (
                <p className="text-xs text-gray-400 mt-2">
                  {model.verificationLabel}
                </p>
              )}
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <Card className="p-6 text-center md:col-span-2 lg:col-span-3">
            <p className="font-medium text-gray-700">No deals found</p>
            <p className="text-sm text-gray-500 mt-1">
              Try a different need, clear your search, or send us a student discount that actually worked.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              Clear filters
            </button>
            <div className="mt-4 flex flex-col gap-2 text-sm text-gray-500 md:flex-row md:justify-center">
              <span>Know a deal? Tell us the discount, location, and whether student ID is required.</span>
              <span>Business owner? Share the student offer and how 5C students can redeem it.</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
