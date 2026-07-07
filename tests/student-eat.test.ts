import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { EatPlace } from '../src/types'
import {
  CLOSING_SOON_MINUTES,
  STUDENT_EAT_FILTERS,
  buildStudentEatPlaceCardModel,
  filterStudentEatPlaces,
  getOpenStatus,
  inferStudentEatMetadata,
  isSafeExternalUrl,
  sortStudentEatPlacesByClosingTime,
  type StudentEatFilterId,
} from '../src/lib/student-eat'

const FRIDAY_NOON = new Date('2026-05-01T12:00:00-07:00')
const FRIDAY_940PM = new Date('2026-05-01T21:40:00-07:00')
const SATURDAY_1AM = new Date('2026-05-02T01:00:00-07:00')
const SATURDAY_NOON = new Date('2026-05-02T12:00:00-07:00')
const SUNDAY_NOON = new Date('2026-05-03T12:00:00-07:00')

const OPEN_24_7_HOURS = [
  'Sunday: Open 24 hours',
  'Monday: Open 24 hours',
  'Tuesday: Open 24 hours',
  'Wednesday: Open 24 hours',
  'Thursday: Open 24 hours',
  'Friday: Open 24 hours',
  'Saturday: Open 24 hours',
]

function place(overrides: Partial<EatPlace>): EatPlace {
  return {
    place_id: overrides.place_id ?? overrides.name ?? 'place',
    name: overrides.name ?? 'Campus food spot',
    address: overrides.address ?? '101 N College Ave, Claremont, CA 91711',
    lat: overrides.lat ?? 34.0967,
    lng: overrides.lng ?? -117.7198,
    types: overrides.types ?? ['restaurant'],
    primary_type: overrides.primary_type ?? 'restaurant',
    rating: overrides.rating ?? null,
    rating_count: overrides.rating_count ?? null,
    price_level: overrides.price_level ?? null,
    phone: overrides.phone ?? null,
    website: overrides.website ?? null,
    google_maps_url: overrides.google_maps_url ?? null,
    hours: overrides.hours ?? null,
    editorial_summary: overrides.editorial_summary ?? null,
    business_status: overrides.business_status ?? 'OPERATIONAL',
  }
}

function tagIds(input: EatPlace, now = FRIDAY_NOON): StudentEatFilterId[] {
  return inferStudentEatMetadata(input, { now }).tags.map((tag) => tag.id)
}

test('exports the primary student eat filter ids in display order', () => {
  assert.deepEqual(STUDENT_EAT_FILTERS.map((filter) => filter.id), [
    'all',
    'open-now',
    'open-late',
    'under-10',
    'study-spot',
    'date-spot',
    'parents-visiting',
    'group-friendly',
    'boba-coffee',
    'walkable',
    'student-discount',
    'worth-it',
  ])
})

test('buildStudentEatPlaceCardModel exposes card display data, ordered student tags, details, and safe links', () => {
  const input = place({
    name: 'Open Value Student Cafe',
    primary_type: 'coffee_shop',
    types: ['coffee_shop', 'cafe'],
    price_level: 1,
    website: 'https://example.com/menu',
    google_maps_url: 'javascript:alert(1)',
    hours: ['Friday: 11:00 AM – 11:30 PM'],
    editorial_summary: 'Cheap cafe with a student discount and reliable Wi-Fi.',
  })

  const model = buildStudentEatPlaceCardModel(input, { now: FRIDAY_NOON })

  assert.equal(model.displayType, 'Coffee Shop')
  assert.equal(model.safeWebsiteUrl, 'https://example.com/menu')
  assert.equal(model.safeMapsUrl, null)
  assert.deepEqual(
    model.tags.map((tag) => tag.id),
    ['open-now', 'open-late', 'under-10', 'study-spot', 'boba-coffee', 'walkable', 'student-discount'],
  )
  assert.deepEqual(model.tags, model.metadata.tags)
  assert.deepEqual(model.details, model.metadata.details)
  assert.deepEqual(model.details, ['Open · closes 11:30 PM', 'Good cheap option', 'Works for studying', 'Ask for the student discount'])
})

test('infers conservative student tags for cheap, study, date, parents, group, boba, walkable, discounts, and worth-it', () => {
  const cases: Array<[string, EatPlace, StudentEatFilterId[]]> = [
    ['cheap', place({ name: 'Value tacos', price_level: 1 }), ['under-10', 'walkable']],
    ['study', place({ name: 'Quiet Bean Cafe', types: ['cafe', 'coffee_shop'], editorial_summary: 'Quiet cafe with Wi-Fi and plenty of tables.' }), ['study-spot', 'boba-coffee']],
    ['date', place({ name: 'Date Night Wine Bar', primary_type: 'wine_bar', types: ['wine_bar', 'restaurant'], price_level: 2, editorial_summary: 'Cozy date night spot.' }), ['date-spot']],
    ['parents', place({ name: 'Parents Brunch', price_level: 3, rating: 4.5, rating_count: 200, editorial_summary: 'Upscale brunch good for visiting parents.' }), ['parents-visiting', 'worth-it']],
    ['group', place({ name: 'Pizza Hall', primary_type: 'pizza_restaurant', types: ['pizza_restaurant'], editorial_summary: 'Casual spot for large groups and shared tables.' }), ['group-friendly']],
    ['boba', place({ name: 'Boba Tea House', primary_type: 'bubble_tea_store', types: ['bubble_tea_store', 'cafe'] }), ['boba-coffee']],
    ['student discount', place({ name: '5C Burritos', editorial_summary: '10% student discount with college ID.' }), ['student-discount']],
  ]

  for (const [name, input, expected] of cases) {
    const ids = tagIds(input)
    for (const id of expected) {
      assert.equal(ids.includes(id), true, `${name} should include ${id}; got ${ids.join(', ')}`)
    }
  }
})

test('open-now parsing handles same-day and after-midnight Google-style hours', () => {
  const lateFriday = place({
    name: 'Late Friday noodles',
    hours: [
      'Monday: 11:00 AM – 10:00 PM',
      'Tuesday: 11:00 AM – 10:00 PM',
      'Wednesday: 11:00 AM – 10:00 PM',
      'Thursday: 11:00 AM – 10:00 PM',
      'Friday: 11:00 AM – 2:00 AM',
      'Saturday: 11:00 AM – 2:00 AM',
      'Sunday: 11:00 AM – 9:00 PM',
    ],
  })

  assert.equal(inferStudentEatMetadata(lateFriday, { now: new Date('2026-05-01T12:00:00-07:00') }).openNow, true)
  assert.equal(inferStudentEatMetadata(lateFriday, { now: new Date('2026-05-02T01:30:00-07:00') }).openNow, true)
  assert.equal(inferStudentEatMetadata(lateFriday, { now: new Date('2026-05-02T03:00:00-07:00') }).openNow, false)
  assert.equal(tagIds(lateFriday).includes('open-late'), true)
})

test('missing client time keeps open-now unknown without open-now tag but still allows open-late', () => {
  const lateFriday = place({
    name: 'Late Friday noodles',
    hours: [
      'Monday: 11:00 AM – 10:00 PM',
      'Tuesday: 11:00 AM – 10:00 PM',
      'Wednesday: 11:00 AM – 10:00 PM',
      'Thursday: 11:00 AM – 10:00 PM',
      'Friday: 11:00 AM – 2:00 AM',
      'Saturday: 11:00 AM – 2:00 AM',
      'Sunday: 11:00 AM – 9:00 PM',
    ],
  })

  const metadata = inferStudentEatMetadata(lateFriday, { now: null })

  assert.equal(metadata.openNow, 'unknown')
  assert.equal(metadata.tagIds.includes('open-now'), false)
  assert.equal(metadata.tags.some((tag) => tag.id === 'open-now'), false)
  assert.equal(metadata.tagIds.includes('open-late'), true)
})

test('open-now remains unknown when hours are missing or unparseable and missing fields stay safe', () => {
  const sparse = place({
    name: 'Sparse mystery spot',
    address: '',
    types: [],
    primary_type: '',
    price_level: null,
    rating: null,
    rating_count: null,
    hours: null,
    website: 'javascript:alert(1)',
    google_maps_url: 'ftp://example.com/map',
  })
  const weirdHours = place({ name: 'Weird hours', hours: ['Hours vary seasonally'] })

  assert.doesNotThrow(() => inferStudentEatMetadata(sparse, { now: FRIDAY_NOON }))
  assert.equal(inferStudentEatMetadata(sparse, { now: FRIDAY_NOON }).openNow, 'unknown')
  assert.equal(inferStudentEatMetadata(weirdHours, { now: FRIDAY_NOON }).openNow, 'unknown')
  assert.equal(isSafeExternalUrl(sparse.website), false)
  assert.equal(isSafeExternalUrl(sparse.google_maps_url), false)
})

test('student filtering composes with search and excludes unknown open-now places from open-now results', () => {
  const places = [
    place({ place_id: 'cheap-open', name: 'Value tacos', price_level: 1, hours: ['Friday: 11:00 AM – 9:00 PM'] }),
    place({ place_id: 'cheap-unknown', name: 'Mystery tacos', price_level: 1, hours: null }),
    place({ place_id: 'coffee', name: 'Study Coffee', types: ['cafe', 'coffee_shop'], primary_type: 'cafe' }),
  ]

  assert.deepEqual(filterStudentEatPlaces(places, { studentFilter: 'under-10', search: 'tacos', now: FRIDAY_NOON }).map((p) => p.place_id), [
    'cheap-open',
    'cheap-unknown',
  ])
  assert.deepEqual(filterStudentEatPlaces(places, { studentFilter: 'open-now', now: FRIDAY_NOON }).map((p) => p.place_id), [
    'cheap-open',
  ])
  assert.deepEqual(filterStudentEatPlaces(places, { studentFilter: 'open-now', now: null }).map((p) => p.place_id), [])
})

test('getOpenStatus reports closing label and countdown for an open same-day range', () => {
  const hours = ['Friday: 11:00 AM – 10:00 PM']

  assert.equal(CLOSING_SOON_MINUTES, 60)
  assert.deepEqual(getOpenStatus(hours, FRIDAY_NOON), {
    openNow: true,
    closesAtLabel: '10:00 PM',
    minutesUntilClose: 600,
    opensNextLabel: null,
    isClosingSoon: false,
  })
  assert.deepEqual(getOpenStatus(hours, FRIDAY_940PM), {
    openNow: true,
    closesAtLabel: '10:00 PM',
    minutesUntilClose: 20,
    opensNextLabel: null,
    isClosingSoon: true,
  })
})

test('getOpenStatus follows an overnight range past midnight', () => {
  const status = getOpenStatus(['Friday: 5:00 PM – 2:00 AM'], SATURDAY_1AM)

  assert.equal(status.openNow, true)
  assert.equal(status.closesAtLabel, '2:00 AM')
  assert.equal(status.minutesUntilClose, 60)
  assert.equal(status.isClosingSoon, true)
})

test('getOpenStatus uses the containing segment for split lunch and dinner hours', () => {
  const hours = ['Friday: 11:00 AM – 2:00 PM, 5:00 PM – 9:00 PM']

  const lunch = getOpenStatus(hours, new Date('2026-05-01T13:30:00-07:00'))
  assert.equal(lunch.openNow, true)
  assert.equal(lunch.closesAtLabel, '2:00 PM')
  assert.equal(lunch.minutesUntilClose, 30)
  assert.equal(lunch.isClosingSoon, true)

  const between = getOpenStatus(hours, new Date('2026-05-01T15:00:00-07:00'))
  assert.equal(between.openNow, false)
  assert.equal(between.closesAtLabel, null)
  assert.equal(between.minutesUntilClose, null)
  assert.equal(between.opensNextLabel, '5:00 PM')
  assert.equal(between.isClosingSoon, false)
})

test('getOpenStatus chains midnight-adjacent ranges into one closing time', () => {
  const hours = ['Friday: 11:00 AM – 12:00 AM', 'Saturday: 12:00 AM – 2:00 AM']
  const status = getOpenStatus(hours, new Date('2026-05-01T23:00:00-07:00'))

  assert.equal(status.openNow, true)
  assert.equal(status.closesAtLabel, '2:00 AM')
  assert.equal(status.minutesUntilClose, 180)
})

test('getOpenStatus treats a full week of 24-hour days as open 24/7 with no countdown', () => {
  assert.deepEqual(getOpenStatus(OPEN_24_7_HOURS, FRIDAY_NOON), {
    openNow: true,
    closesAtLabel: null,
    minutesUntilClose: null,
    opensNextLabel: null,
    isClosingSoon: false,
  })
})

test('getOpenStatus counts a single 24-hour day down to midnight', () => {
  const status = getOpenStatus(['Friday: Open 24 hours', 'Saturday: Closed'], FRIDAY_NOON)

  assert.equal(status.openNow, true)
  assert.equal(status.closesAtLabel, '12:00 AM')
  assert.equal(status.minutesUntilClose, 720)
  assert.equal(status.isClosingSoon, false)
})

test('getOpenStatus qualifies chained closes more than 24 hours out with a day', () => {
  const status = getOpenStatus(['Friday: Open 24 hours', 'Saturday: Open 24 hours', 'Sunday: Closed'], FRIDAY_NOON)

  assert.equal(status.openNow, true)
  assert.equal(status.closesAtLabel, '12:00 AM Sun')
  assert.equal(status.minutesUntilClose, 2160)
  assert.equal(status.isClosingSoon, false)
})

test('getOpenStatus labels the next opening as today, tomorrow, or a weekday', () => {
  const laterToday = getOpenStatus(['Friday: 11:00 AM – 10:00 PM'], new Date('2026-05-01T09:00:00-07:00'))
  assert.equal(laterToday.openNow, false)
  assert.equal(laterToday.opensNextLabel, '11:00 AM')

  const tomorrow = getOpenStatus(['Sunday: Closed', 'Monday: 11:00 AM – 10:00 PM'], SUNDAY_NOON)
  assert.equal(tomorrow.openNow, false)
  assert.equal(tomorrow.opensNextLabel, '11:00 AM tomorrow')

  const monday = getOpenStatus(['Saturday: Closed', 'Sunday: Closed', 'Monday: 11:00 AM – 10:00 PM'], SATURDAY_NOON)
  assert.equal(monday.openNow, false)
  assert.equal(monday.opensNextLabel, '11:00 AM Mon')
})

test('getOpenStatus keeps [start, end) boundary semantics at the closing minute', () => {
  const hours = ['Friday: 11:00 AM – 10:00 PM']

  assert.equal(getOpenStatus(hours, new Date('2026-05-01T22:00:00-07:00')).openNow, false)

  const oneMinuteLeft = getOpenStatus(hours, new Date('2026-05-01T21:59:00-07:00'))
  assert.equal(oneMinuteLeft.minutesUntilClose, 1)
  assert.equal(oneMinuteLeft.isClosingSoon, true)
})

test('getOpenStatus stays unknown with null fields for missing, unparseable, or null-now inputs', () => {
  const unknownShape = {
    openNow: 'unknown',
    closesAtLabel: null,
    minutesUntilClose: null,
    opensNextLabel: null,
    isClosingSoon: false,
  }

  assert.doesNotThrow(() => getOpenStatus(['Hours vary seasonally'], FRIDAY_NOON))
  assert.deepEqual(getOpenStatus(null, FRIDAY_NOON), unknownShape)
  assert.deepEqual(getOpenStatus(['Hours vary seasonally'], FRIDAY_NOON), unknownShape)
  assert.deepEqual(getOpenStatus(['Friday: 11:00 AM – 10:00 PM'], null), unknownShape)
})

test('closed places with zero parseable ranges keep the plain Closed now detail', () => {
  const allClosed = place({
    name: 'Always closed spot',
    hours: ['Sunday: Closed', 'Monday: Closed', 'Tuesday: Closed', 'Wednesday: Closed', 'Thursday: Closed', 'Friday: Closed', 'Saturday: Closed'],
  })

  const metadata = inferStudentEatMetadata(allClosed, { now: FRIDAY_NOON })

  assert.equal(metadata.openStatus.openNow, false)
  assert.equal(metadata.openStatus.opensNextLabel, null)
  assert.equal(metadata.details[0], 'Closed now')
})

test('metadata and card model mirror openStatus and upgrade the open/closed detail copy', () => {
  const open = place({ name: 'Open grill', hours: ['Friday: 11:00 AM – 10:00 PM'] })
  const openMetadata = inferStudentEatMetadata(open, { now: FRIDAY_NOON })
  assert.equal(openMetadata.openStatus.openNow, openMetadata.openNow)
  assert.equal(openMetadata.details[0], 'Open · closes 10:00 PM')

  const model = buildStudentEatPlaceCardModel(open, { now: FRIDAY_NOON })
  assert.deepEqual(model.openStatus, model.metadata.openStatus)

  const closedSunday = place({ name: 'Weekday deli', hours: ['Sunday: Closed', 'Monday: 11:00 AM – 10:00 PM'] })
  assert.equal(inferStudentEatMetadata(closedSunday, { now: SUNDAY_NOON }).details[0], 'Closed · opens 11:00 AM tomorrow')

  const alwaysOpen = place({ name: 'All night diner', hours: OPEN_24_7_HOURS })
  assert.equal(inferStudentEatMetadata(alwaysOpen, { now: FRIDAY_NOON }).details[0], 'Open now')
})

test('sortStudentEatPlacesByClosingTime orders open places by time remaining without mutating input', () => {
  const closed = place({ place_id: 'closed', name: 'Closed early', hours: ['Friday: 11:00 AM – 9:00 PM'] })
  const closingSoon = place({ place_id: 'closing-soon', name: 'Closing soon spot', hours: ['Friday: 11:00 AM – 10:00 PM'] })
  const unknown = place({ place_id: 'unknown', name: 'Mystery hours', hours: null })
  const lateNight = place({ place_id: 'late-night', name: 'Late night spot', hours: ['Friday: 11:00 AM – 2:00 AM'] })
  const alwaysOpen = place({ place_id: 'always-open', name: 'Always open diner', hours: OPEN_24_7_HOURS })

  const input = [closed, closingSoon, unknown, lateNight, alwaysOpen]
  const snapshot = [...input]

  assert.deepEqual(
    sortStudentEatPlacesByClosingTime(input, { now: FRIDAY_940PM }).map((p) => p.place_id),
    ['always-open', 'late-night', 'closing-soon', 'closed', 'unknown'],
  )
  assert.deepEqual(input, snapshot)

  assert.deepEqual(
    sortStudentEatPlacesByClosingTime(input, { now: null }).map((p) => p.place_id),
    ['closed', 'closing-soon', 'unknown', 'late-night', 'always-open'],
  )
})

test('eat-guide wires the closing-time sort, closes-soon badge, and hours disclaimer', () => {
  const source = readFileSync(join(process.cwd(), 'src/app/eat/eat-guide.tsx'), 'utf8')

  assert.match(source, /sortStudentEatPlacesByClosingTime/)
  assert.match(source, /studentFilter === 'open-now' \|\| studentFilter === 'open-late'/)
  assert.match(source, /Closes soon/)
  assert.match(source, /Closing now/)
  assert.match(source, /Hours from Google/)
  assert.match(source, /bg-amber-100/)
  assert.doesNotMatch(source, /aria-live/)
})
