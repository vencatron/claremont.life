import test from 'node:test'
import assert from 'node:assert/strict'

import type { EatPlace } from '../src/types'
import {
  STUDENT_EAT_FILTERS,
  buildStudentEatPlaceCardModel,
  filterStudentEatPlaces,
  inferStudentEatMetadata,
  isSafeExternalUrl,
  type StudentEatFilterId,
} from '../src/lib/student-eat'

const FRIDAY_NOON = new Date('2026-05-01T12:00:00-07:00')

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
  assert.deepEqual(model.details, ['Open now', 'Good cheap option', 'Works for studying', 'Ask for the student discount'])
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
