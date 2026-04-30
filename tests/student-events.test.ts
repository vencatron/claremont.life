import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type { ClaremontEvent } from '../src/types'
import type { College } from '../src/lib/constants'
import {
  DISCOVERY_FILTERS,
  filterStudentEvents,
  getEventCampus,
  inferStudentEventMetadata,
  matchesEventSearch,
  type StudentEventCategoryId,
} from '../src/lib/student-events'

const NOW = new Date('2026-04-30T19:00:00-07:00') // Thursday evening in Claremont

function event(overrides: Partial<ClaremontEvent>): ClaremontEvent {
  return {
    id: overrides.id ?? 'event',
    source: overrides.source ?? 'claremont_edu_events',
    source_id: overrides.source_id ?? overrides.id ?? 'event',
    title: overrides.title ?? 'Campus event',
    description: overrides.description ?? null,
    url: overrides.url ?? null,
    starts_at: overrides.starts_at ?? '2026-05-01T02:30:00.000Z',
    ends_at: overrides.ends_at ?? null,
    college: overrides.college ?? null,
    event_type: overrides.event_type ?? null,
    location: overrides.location ?? null,
    address: overrides.address ?? null,
    image_url: overrides.image_url ?? null,
    is_active: overrides.is_active ?? true,
  }
}

test('exports the primary student discovery filter ids in display order', () => {
  assert.deepEqual(DISCOVERY_FILTERS.map((filter) => filter.id), [
    'today',
    'tonight',
    'tomorrow',
    'this-weekend',
    'free',
    'food',
    'music',
    'social',
    'talks',
    'career',
    'off-campus',
    'open-to-5c',
  ])
})

test('EventsFeed source keeps student discovery controls ahead of campus/source chips', () => {
  const source = readFileSync('src/components/EventsFeed.tsx', 'utf8')
  const searchControl = source.match(/(?:placeholder|aria-label)=['\"]Search[^'\"]*events/i)
  const filtersIndex = source.indexOf('DISCOVERY_FILTERS.map')
  const campusLabelIndex = source.indexOf('Campus/source')
  const collegeFilterIndex = source.indexOf('<CollegeFilter')

  assert.notEqual(searchControl, null)
  assert.notEqual(filtersIndex, -1)
  assert.notEqual(campusLabelIndex, -1)
  assert.notEqual(collegeFilterIndex, -1)
  assert.equal(filtersIndex < campusLabelIndex, true)
  assert.equal(filtersIndex < collegeFilterIndex, true)
})

test('EventsFeed empty state uses clear/check-back language and links to event submissions', () => {
  const source = readFileSync('src/components/EventsFeed.tsx', 'utf8')

  assert.match(source, /Clear filters/)
  assert.match(source, /check back soon/i)
  assert.match(source, /href=\{?['\"]\/events\/submit['\"]\}?/)
  assert.match(source, /Submit an event|Send us an event/i)
})

test('EventCard source renders metadata badges and gives location prominence before time', () => {
  const source = readFileSync('src/components/EventCard.tsx', 'utf8')
  const badgesIndex = source.indexOf('metadata.badges.map')
  const locationIndex = source.indexOf('event.location')
  const mapPinIndex = source.indexOf('<MapPin')
  const clockIndex = source.indexOf('<Clock')
  const dateIndex = source.indexOf('{date}')

  assert.notEqual(badgesIndex, -1)
  assert.notEqual(locationIndex, -1)
  assert.notEqual(mapPinIndex, -1)
  assert.notEqual(clockIndex, -1)
  assert.notEqual(dateIndex, -1)
  assert.equal(locationIndex < clockIndex, true)
  assert.equal(mapPinIndex < clockIndex, true)
  assert.equal(locationIndex < dateIndex, true)
})

test('EventCard source uses a safe URL guard instead of anchoring raw event URLs', () => {
  const source = readFileSync('src/components/EventCard.tsx', 'utf8')

  assert.match(source, /safeEventUrl|isSafeEventUrl|safeUrl/i)
  assert.equal(source.includes('href={event.url}'), false)
})

test('EventsFeed and EventCard source format dates in the Claremont time zone', () => {
  const feedSource = readFileSync('src/components/EventsFeed.tsx', 'utf8')
  const cardSource = readFileSync('src/components/EventCard.tsx', 'utf8')

  assert.match(feedSource, /CLAREMONT_TIME_ZONE|America\/Los_Angeles/)
  assert.match(cardSource, /CLAREMONT_TIME_ZONE|America\/Los_Angeles/)
})

test('EventsFeed source skips invalid event dates before grouping', () => {
  const source = readFileSync('src/components/EventsFeed.tsx', 'utf8')

  assert.match(source, /Number\.isNaN|isValidEventDate|isValidDate/)
})

test('searches title, description, location, address, source, and derived campus while missing optional fields stay safe', () => {
  const bare = event({
    id: 'bare',
    title: 'Sunset Yoga',
    description: null,
    location: null,
    address: null,
    source: 'pomona_calendar',
    college: null,
  })
  const described = event({
    id: 'described',
    title: 'Quiet title',
    description: 'Late-night breakfast and snacks',
    location: 'Edmunds Ballroom',
    address: '170 E 6th St',
    source: 'custom_source',
    college: 'Scripps',
  })

  assert.equal(matchesEventSearch(bare, 'sunset'), true)
  assert.equal(matchesEventSearch(described, 'breakfast'), true)
  assert.equal(matchesEventSearch(described, 'edmunds'), true)
  assert.equal(matchesEventSearch(described, '170 e 6th'), true)
  assert.equal(matchesEventSearch(bare, 'pomona calendar'), true)
  assert.equal(matchesEventSearch(bare, 'Pomona'), true)
  assert.equal(matchesEventSearch(bare, 'nonexistent'), false)
  assert.equal(matchesEventSearch(bare, ''), true)
})

test('filters today, tonight, tomorrow, and this weekend using a fixed Claremont now', () => {
  const events = [
    event({ id: 'today-afternoon', title: 'Today afternoon', starts_at: '2026-04-30T21:00:00.000Z' }), // Thu 2pm
    event({ id: 'tonight', title: 'Tonight show', starts_at: '2026-05-01T03:00:00.000Z' }), // Thu 8pm
    event({ id: 'tomorrow', title: 'Tomorrow lunch', starts_at: '2026-05-01T19:00:00.000Z' }), // Fri noon
    event({ id: 'saturday', title: 'Saturday social', starts_at: '2026-05-02T22:00:00.000Z' }), // Sat 3pm
    event({ id: 'monday', title: 'Monday talk', starts_at: '2026-05-04T19:00:00.000Z' }),
  ]

  assert.deepEqual(filterStudentEvents(events, { filters: ['today'], now: NOW }).map((e) => e.id), [
    'today-afternoon',
    'tonight',
  ])
  assert.deepEqual(filterStudentEvents(events, { filters: ['tonight'], now: NOW }).map((e) => e.id), ['tonight'])
  assert.deepEqual(filterStudentEvents(events, { filters: ['tomorrow'], now: NOW }).map((e) => e.id), ['tomorrow'])
  assert.deepEqual(filterStudentEvents(events, { filters: ['this-weekend'], now: NOW }).map((e) => e.id), [
    'tomorrow',
    'saturday',
  ])
})

test('tomorrow uses the Pacific calendar day across the spring DST boundary', () => {
  const dstEve = new Date('2026-03-07T23:30:00-08:00')
  const events = [
    event({ id: 'sunday-after-dst', title: 'Sunday after DST', starts_at: '2026-03-08T19:00:00.000Z' }), // Sun Mar 8 noon PDT
    event({ id: 'monday-after-dst', title: 'Monday after DST', starts_at: '2026-03-09T19:00:00.000Z' }),
  ]

  assert.deepEqual(filterStudentEvents(events, { filters: ['tomorrow'], now: dstEve }).map((e) => e.id), [
    'sunday-after-dst',
  ])
})

test('this-weekend uses Pacific calendar dates across the spring DST boundary', () => {
  const dstEve = new Date('2026-03-07T23:30:00-08:00')
  const events = [
    event({ id: 'sunday-after-dst', title: 'Sunday after DST', starts_at: '2026-03-08T19:00:00.000Z' }), // Sun Mar 8 noon PDT
    event({ id: 'monday-after-dst', title: 'Monday after DST', starts_at: '2026-03-09T19:00:00.000Z' }),
  ]

  assert.deepEqual(filterStudentEvents(events, { filters: ['this-weekend'], now: dstEve }).map((e) => e.id), [
    'sunday-after-dst',
  ])
})

test('invalid event dates do not throw and are excluded from time filters', () => {
  const invalid = event({ id: 'invalid-date', title: 'Invalid date social', starts_at: 'not-a-date' })
  const valid = event({ id: 'valid-date', title: 'Valid date social', starts_at: '2026-05-01T03:00:00.000Z' })

  assert.doesNotThrow(() => inferStudentEventMetadata(invalid, NOW))
  assert.deepEqual(filterStudentEvents([invalid, valid], { filters: ['today'], now: NOW }).map((e) => e.id), ['valid-date'])
  assert.deepEqual(filterStudentEvents([invalid, valid], { filters: ['tonight'], now: NOW }).map((e) => e.id), ['valid-date'])
  assert.deepEqual(filterStudentEvents([invalid, valid], { filters: ['tomorrow'], now: NOW }).map((e) => e.id), [])
  assert.deepEqual(filterStudentEvents([invalid, valid], { filters: ['this-weekend'], now: NOW }).map((e) => e.id), [])
})

test('infers student categories conservatively from title, description, event_type, location, address, and source', () => {
  const cases: Array<[string, ClaremontEvent, StudentEventCategoryId[]]> = [
    ['free', event({ title: 'Free admission movie night' }), ['free']],
    ['food', event({ description: 'Dinner, snacks, and boba provided' }), ['food']],
    ['music', event({ title: 'Jazz concert', event_type: 'recital' }), ['music']],
    ['social', event({ title: 'Dorm mixer and game night' }), ['social']],
    ['talks', event({ title: 'Athenaeum lecture and faculty panel', event_type: 'lecture' }), ['talks']],
    ['career', event({ title: 'Internship networking and resume workshop' }), ['career']],
    ['off-campus', event({ title: 'Village art walk', location: 'Claremont Village', source: 'city_claremont' }), ['off-campus']],
    ['open-to-5c', event({ description: 'Open to all 5C students across The Claremont Colleges' }), ['open-to-5c']],
  ]

  for (const [name, input, expected] of cases) {
    const metadata = inferStudentEventMetadata(input, NOW)
    for (const category of expected) {
      assert.equal(metadata.categories.includes(category), true, `${name} should include ${category}`)
    }
  }
})

test('does not infer Open to 5C from a plain claremont.edu source without explicit open or 5C text', () => {
  const metadata = inferStudentEventMetadata(
    event({
      source: 'claremont_edu_events',
      title: 'Campus lecture',
      description: 'Faculty talk for registered guests.',
      location: 'Humanities Auditorium',
    }),
    NOW,
  )

  assert.equal(metadata.isOpenTo5C, false)
  assert.equal(metadata.categories.includes('open-to-5c'), false)
})

test('badges expose campus/source, inferred category, known RSVP/free/open signals, and student time labels', () => {
  const metadata = inferStudentEventMetadata(
    event({
      title: 'Free 5C jazz night',
      description: 'Open to all 5C students. RSVP to save your seat.',
      location: 'Music Hall',
      source: 'scripps_calendar',
      starts_at: '2026-05-01T03:00:00.000Z',
      url: 'https://example.edu/rsvp',
    }),
    NOW,
  )

  assert.equal(metadata.campus, 'Scripps')
  assert.equal(metadata.primaryCategory, 'Music')
  assert.deepEqual(
    metadata.badges.map((badge) => badge.label),
    ['Scripps', 'Music', 'Free', 'Open to 5C', 'RSVP', 'Tonight'],
  )
})

test('campus filtering remains composable with search and discovery filters', () => {
  const events = [
    event({ id: 'pomona-free', title: 'Free Pomona pizza social', college: 'Pomona' }),
    event({ id: 'cmc-free', title: 'Free CMC pizza social', source: 'cmc_calendar' }),
    event({ id: 'pomona-talk', title: 'Pomona lecture', college: 'Pomona', event_type: 'lecture' }),
  ]

  assert.equal(getEventCampus(events[1]), 'CMC' satisfies College)
  assert.deepEqual(
    filterStudentEvents(events, { search: 'pizza', filters: ['free'], college: 'Pomona', now: NOW }).map((e) => e.id),
    ['pomona-free'],
  )
})
