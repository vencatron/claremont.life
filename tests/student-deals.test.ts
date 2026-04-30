import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type { Deal } from '../src/types'
import {
  STUDENT_DEAL_FILTERS,
  buildInstagramLink,
  buildStudentDealCardModel,
  filterStudentDeals,
  inferStudentDealMetadata,
  isSafeDealUrl,
  type StudentDealFilterId,
} from '../src/lib/student-deals'

const NOW = new Date('2026-04-30T12:00:00-07:00')

function deal(overrides: Partial<Deal>): Deal {
  return {
    id: overrides.id ?? overrides.name ?? 'deal',
    name: overrides.name ?? 'Campus Deal',
    category: overrides.category ?? 'Food & Drink',
    deal_description: overrides.deal_description ?? '10% off with student ID.',
    discount_pct: overrides.discount_pct ?? null,
    address: overrides.address ?? '101 N College Ave, Claremont, CA 91711',
    website: overrides.website ?? null,
    instagram: overrides.instagram ?? null,
    phone: overrides.phone ?? null,
    requires_student_id: overrides.requires_student_id ?? true,
    expiration: overrides.expiration ?? null,
    source: overrides.source ?? 'manual',
    is_active: overrides.is_active ?? true,
    notes: overrides.notes ?? null,
    last_verified: overrides.last_verified ?? '2026-04-20',
  }
}

function badgeIds(input: Deal, now = NOW): StudentDealFilterId[] {
  return inferStudentDealMetadata(input, { now }).badgeIds
}

test('exports primary student deal filters in display order', () => {
  assert.deepEqual(STUDENT_DEAL_FILTERS.map((filter) => filter.id), [
    'all',
    'student-id',
    'verified-this-month',
    'exclusive',
    'all-5c',
    'under-15',
    'finals',
    'birthday',
  ])
})

test('buildStudentDealCardModel exposes ordered trust/use-case badges, verification copy, and safe links', () => {
  const input = deal({
    id: 'coffee',
    name: 'Finals Fuel Cafe',
    category: 'Food & Drink',
    deal_description: 'Claremont.life exclusive: coffee, caffeine, and snack combo under $15 with student ID. Free drink on your birthday.',
    discount_pct: 15,
    website: 'https://example.com/deals',
    instagram: '@finals.fuel_5c',
    notes: 'All 5C students. Verified in-store with a promo code.',
    last_verified: '2026-04-20',
  })

  const model = buildStudentDealCardModel(input, { now: NOW })

  assert.equal(model.safeWebsiteUrl, 'https://example.com/deals')
  assert.deepEqual(model.safeInstagramLink, {
    url: 'https://instagram.com/finals.fuel_5c',
    label: '@finals.fuel_5c',
  })
  assert.equal(model.verificationLabel, 'Verified Apr 20, 2026')
  assert.deepEqual(
    model.badges.map((badge) => badge.id),
    ['student-id', 'verified-this-month', 'exclusive', 'all-5c', 'under-15', 'finals', 'birthday'],
  )
  assert.deepEqual(
    model.badges.map((badge) => badge.label),
    ['Student ID', 'Verified this month', 'Exclusive', 'All 5C', 'Under $15', 'Good for finals', 'Birthday'],
  )
})

test('infers conservative student-native deal badges from existing fields only', () => {
  const cases: Array<[string, Deal, StudentDealFilterId[]]> = [
    ['student id', deal({ deal_description: 'Show a college ID for 10% off.', requires_student_id: true }), ['student-id', 'all-5c']],
    ['verified this month', deal({ last_verified: '2026-04-01' }), ['verified-this-month']],
    ['exclusive', deal({ deal_description: 'Use promo code CLAREMONTLIFE for the student special.', requires_student_id: false }), ['exclusive']],
    ['all 5c', deal({ deal_description: 'Valid for all Claremont Colleges and 5C students.', requires_student_id: false }), ['all-5c']],
    ['under 15', deal({ deal_description: 'Lunch combo under $15.', requires_student_id: false }), ['under-15']],
    ['finals', deal({ category: 'Food & Drink', deal_description: 'Late-night coffee and snacks for finals week.', requires_student_id: false }), ['finals']],
    ['birthday', deal({ deal_description: 'Free dessert on your birthday.', requires_student_id: false }), ['birthday']],
  ]

  for (const [name, input, expected] of cases) {
    const ids = badgeIds(input)
    for (const id of expected) {
      assert.equal(ids.includes(id), true, `${name} should include ${id}; got ${ids.join(', ')}`)
    }
  }
})

test('infers under-15 badge and filter for price-only student ticket copy', () => {
  const ticketDeal = deal({
    id: 'student-tickets',
    category: 'Arts & Culture',
    deal_description: '$10 student tickets with ID.',
    requires_student_id: false,
  })
  const fullPriceDeal = deal({
    id: 'full-price-tickets',
    category: 'Arts & Culture',
    deal_description: '$20 student tickets with ID.',
    requires_student_id: false,
  })

  assert.equal(badgeIds(ticketDeal).includes('under-15'), true)
  assert.deepEqual(
    filterStudentDeals([ticketDeal, fullPriceDeal], { studentFilter: 'under-15', now: NOW }).map((item) => item.id),
    ['student-tickets'],
  )
})

test('safe link helpers allow only http/https websites and sanitize Instagram handles', () => {
  assert.equal(isSafeDealUrl('https://example.com/student'), true)
  assert.equal(isSafeDealUrl('http://example.com/student'), true)
  assert.equal(isSafeDealUrl('javascript:alert(1)'), false)
  assert.equal(isSafeDealUrl('ftp://example.com/student'), false)
  assert.deepEqual(buildInstagramLink('@claremont_deals.5c'), {
    url: 'https://instagram.com/claremont_deals.5c',
    label: '@claremont_deals.5c',
  })
  assert.deepEqual(buildInstagramLink('https://www.instagram.com/good.handle/?utm_source=x'), {
    url: 'https://instagram.com/good.handle',
    label: '@good.handle',
  })
  assert.equal(buildInstagramLink('bad/../../handle'), null)
  assert.equal(buildInstagramLink('javascript:alert(1)'), null)
})

test('student deal filtering composes need filters with category and search', () => {
  const deals = [
    deal({ id: 'coffee', name: 'Finals Coffee', category: 'Food & Drink', deal_description: 'Coffee and snacks under $15 for finals week.', last_verified: '2026-04-15' }),
    deal({ id: 'salon', name: 'Birthday Blowout', category: 'Beauty & Wellness', deal_description: 'Birthday discount for students.', last_verified: '2026-04-01' }),
    deal({ id: 'shop', name: 'Village Books', category: 'Shopping', deal_description: '10% off with college ID.', last_verified: '2026-02-01' }),
  ]

  assert.deepEqual(filterStudentDeals(deals, { studentFilter: 'finals', category: 'Food & Drink', search: 'coffee', now: NOW }).map((item) => item.id), [
    'coffee',
  ])
  assert.deepEqual(filterStudentDeals(deals, { studentFilter: 'verified-this-month', now: NOW }).map((item) => item.id), [
    'coffee',
    'salon',
  ])
  assert.deepEqual(filterStudentDeals(deals, { studentFilter: 'all', category: 'Shopping', search: 'college id', now: NOW }).map((item) => item.id), [
    'shop',
  ])
})

test('missing optional deal fields stay safe and do not crash metadata', () => {
  const sparse = deal({
    id: 'sparse',
    name: 'Sparse Deal',
    deal_description: '',
    address: null,
    website: 'data:text/html,<script>alert(1)</script>',
    instagram: 'bad/handle',
    notes: null,
    last_verified: '',
    requires_student_id: false,
  })

  assert.doesNotThrow(() => buildStudentDealCardModel(sparse, { now: NOW }))
  const model = buildStudentDealCardModel(sparse, { now: NOW })
  assert.equal(model.safeWebsiteUrl, null)
  assert.equal(model.safeInstagramLink, null)
  assert.equal(model.verificationLabel, null)
})

test('DealsGuide renders student need chips, trust badges, safe model links, and CTAs', () => {
  const source = readFileSync(new URL('../src/app/deals/deals-guide.tsx', import.meta.url), 'utf8')

  assert.match(source, /STUDENT_DEAL_FILTERS/)
  assert.match(source, /Student needs/)
  assert.match(source, /Category/)
  assert.match(source, /safeWebsiteUrl/)
  assert.match(source, /safeInstagramLink/)
  assert.match(source, /Know a deal\?/)
  assert.match(source, /Business owner\?/)
  assert.match(source, /Clear filters/)
})
