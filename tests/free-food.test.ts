import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type { ClaremontEvent } from '../src/types'
import {
  freeFoodWindowLabel,
  groupFreeFoodByDay,
  selectFreeFoodEvents,
} from '../src/lib/free-food'

const NOW = new Date('2026-07-07T12:00:00-07:00') // Tuesday noon PDT; window Jul 7 – Jul 13

function event(overrides: Partial<ClaremontEvent>): ClaremontEvent {
  return {
    id: overrides.id ?? 'event',
    source: overrides.source ?? 'claremont_edu_events',
    source_id: overrides.source_id ?? overrides.id ?? 'event',
    title: overrides.title ?? 'Campus event',
    description: overrides.description ?? null,
    url: overrides.url ?? null,
    starts_at: overrides.starts_at ?? '2026-07-08T18:00:00-07:00',
    ends_at: overrides.ends_at ?? null,
    college: overrides.college ?? null,
    event_type: overrides.event_type ?? null,
    location: overrides.location ?? null,
    address: overrides.address ?? null,
    image_url: overrides.image_url ?? null,
    is_active: overrides.is_active ?? true,
  }
}

test('requires both the free and food category inference (decided-contract fixtures)', () => {
  const fixtures = [
    event({ id: 'free-pizza', title: 'Free pizza night' }),
    event({ id: 'free-parking', title: 'Free parking for reunion weekend' }),
    event({ id: 'paid-pizza', title: 'Pizza fundraiser — $5 a slice' }),
    event({
      id: 'free-boba-description',
      title: 'Summer research talks',
      description: 'Free boba and snacks provided',
    }),
    event({
      id: 'lunch-provided',
      title: 'Summer research symposium',
      description: 'Lunch provided, RSVP required',
    }),
    event({
      id: 'refreshments-served',
      title: 'Gallery opening',
      description: 'Refreshments will be served',
    }),
    event({
      id: 'no-proximity',
      title: 'Summer concert, free admission',
      description: 'Food trucks on site (cash)',
    }),
    event({ id: 'gluten-free', title: 'Gluten-free snacks for purchase' }),
  ]

  assert.deepEqual(selectFreeFoodEvents(fixtures, { now: NOW }).map((item) => item.id), [
    'free-pizza',
    'free-boba-description',
    'no-proximity',
    'gluten-free',
  ])
})

test('applies a 7-day Pacific calendar window, not a UTC one', () => {
  const fixtures = [
    event({ id: 'last-in-window', title: 'Free pizza', starts_at: '2026-07-13T23:30:00-07:00' }),
    event({ id: 'day-eight', title: 'Free pizza', starts_at: '2026-07-14T00:30:00-07:00' }),
    event({ id: 'utc-trap', title: 'Free pizza', starts_at: '2026-07-14T04:00:00Z' }),
  ]

  assert.deepEqual(selectFreeFoodEvents(fixtures, { now: NOW }).map((item) => item.id), [
    'utc-trap',
    'last-in-window',
  ])
})

test('excludes already-started events and includes an event starting exactly at now', () => {
  const fixtures = [
    event({ id: 'this-morning', title: 'Free pizza', starts_at: '2026-07-07T09:00:00-07:00' }),
    event({ id: 'exactly-now', title: 'Free pizza', starts_at: '2026-07-07T12:00:00-07:00' }),
  ]

  assert.deepEqual(selectFreeFoodEvents(fixtures, { now: NOW }).map((item) => item.id), ['exactly-now'])
})

test('ignores invalid dates and never throws on empty or invalid input', () => {
  const fixtures = [
    event({ id: 'not-a-date', title: 'Free pizza', starts_at: 'not-a-date' }),
    event({ id: 'empty-date', title: 'Free pizza', starts_at: '' }),
    event({ id: 'valid', title: 'Free pizza', starts_at: '2026-07-08T18:00:00-07:00' }),
  ]

  assert.deepEqual(selectFreeFoodEvents(fixtures, { now: NOW }).map((item) => item.id), ['valid'])
  assert.deepEqual(selectFreeFoodEvents([], { now: NOW }), [])
  assert.deepEqual(selectFreeFoodEvents(fixtures, { now: new Date('nope') }), [])
})

test('orders results chronologically across shuffled multi-day input', () => {
  const fixtures = [
    event({ id: 'sunday', title: 'Free pizza', starts_at: '2026-07-12T18:00:00-07:00' }),
    event({ id: 'wednesday', title: 'Free pizza', starts_at: '2026-07-08T12:00:00-07:00' }),
    event({ id: 'friday', title: 'Free pizza', starts_at: '2026-07-10T09:00:00-07:00' }),
    event({ id: 'tuesday', title: 'Free pizza', starts_at: '2026-07-07T19:00:00-07:00' }),
  ]

  assert.deepEqual(selectFreeFoodEvents(fixtures, { now: NOW }).map((item) => item.id), [
    'tuesday',
    'wednesday',
    'friday',
    'sunday',
  ])
})

test('maxDays override shrinks the window', () => {
  const fixtures = [
    event({ id: 'today', title: 'Free pizza', starts_at: '2026-07-07T18:00:00-07:00' }),
    event({ id: 'tomorrow', title: 'Free pizza', starts_at: '2026-07-08T18:00:00-07:00' }),
  ]

  assert.deepEqual(selectFreeFoodEvents(fixtures, { now: NOW, maxDays: 1 }).map((item) => item.id), ['today'])
})

test('groups by Pacific day with Today/Tomorrow/weekday labels', () => {
  const fixtures = [
    event({ id: 'thu', title: 'Free pizza', starts_at: '2026-07-09T18:00:00-07:00' }),
    event({ id: 'tue', title: 'Free pizza', starts_at: '2026-07-07T18:00:00-07:00' }),
    event({ id: 'wed', title: 'Free pizza', starts_at: '2026-07-08T18:00:00-07:00' }),
  ]

  const days = groupFreeFoodByDay(fixtures, { now: NOW })
  assert.deepEqual(days.map((day) => day.dayKey), ['2026-07-07', '2026-07-08', '2026-07-09'])
  assert.deepEqual(days.map((day) => day.dayLabel), ['Today', 'Tomorrow', 'Thursday, Jul 9'])
})

test('omits days with no events — no placeholder groups', () => {
  const fixtures = [
    event({ id: 'thu', title: 'Free pizza', starts_at: '2026-07-09T18:00:00-07:00' }),
    event({ id: 'sun', title: 'Free pizza', starts_at: '2026-07-12T18:00:00-07:00' }),
  ]

  const days = groupFreeFoodByDay(fixtures, { now: NOW })
  assert.deepEqual(days.map((day) => day.dayLabel), ['Thursday, Jul 9', 'Sunday, Jul 12'])
  assert.deepEqual(days.map((day) => day.events.map((item) => item.id)), [['thu'], ['sun']])
})

test('groups same-day events together in chronological order', () => {
  const fixtures = [
    event({ id: 'wed-late', title: 'Free pizza', starts_at: '2026-07-08T20:00:00-07:00' }),
    event({ id: 'wed-early', title: 'Free pizza', starts_at: '2026-07-08T09:00:00-07:00' }),
    event({ id: 'wed-noon', title: 'Free pizza', starts_at: '2026-07-08T12:00:00-07:00' }),
  ]

  const days = groupFreeFoodByDay(fixtures, { now: NOW })
  assert.equal(days.length, 1)
  assert.deepEqual(days[0].events.map((item) => item.id), ['wed-early', 'wed-noon', 'wed-late'])
})

test('returns [] when nothing qualifies, not a list of empty days', () => {
  const fixtures = [event({ id: 'paid', title: 'Pizza fundraiser — $5 a slice' })]

  assert.deepEqual(groupFreeFoodByDay(fixtures, { now: NOW }), [])
  assert.deepEqual(groupFreeFoodByDay([], { now: NOW }), [])
})

test('window and day keys stay on Pacific calendar days across the fall-back transition', () => {
  const fallBackNow = new Date('2026-10-27T12:00:00-07:00') // Tuesday, PDT; window Oct 27 – Nov 2
  const fixtures = [
    event({ id: 'post-transition', title: 'Free pizza', starts_at: '2026-11-01T18:00:00-08:00' }),
    event({ id: 'past-window', title: 'Free pizza', starts_at: '2026-11-03T18:00:00-08:00' }),
  ]

  assert.deepEqual(selectFreeFoodEvents(fixtures, { now: fallBackNow }).map((item) => item.id), ['post-transition'])

  const days = groupFreeFoodByDay(fixtures, { now: fallBackNow })
  assert.equal(days.length, 1)
  assert.equal(days[0].dayKey, '2026-11-01')
})

test('window label stays on Pacific calendar days across DST transitions (key math, not millis)', () => {
  assert.equal(
    freeFoodWindowLabel(new Date('2026-03-03T23:30:00-08:00')),
    'Tuesday, Mar 3 – Monday, Mar 9',
  )
  assert.equal(
    freeFoodWindowLabel(new Date('2026-10-27T00:10:00-07:00')),
    'Tuesday, Oct 27 – Monday, Nov 2',
  )
})

test('window label formats the plain case and returns empty string for an invalid clock', () => {
  assert.equal(freeFoodWindowLabel(NOW), 'Tuesday, Jul 7 – Monday, Jul 13')
  assert.equal(freeFoodWindowLabel(new Date('nope')), '')
})

// ── Source-regex wiring locks ────────────────────────────────────────────────

const pageSource = readFileSync('src/app/guides/free-food/page.tsx', 'utf8')

test('/guides/free-food page is wired to the live data and share affordances', () => {
  assert.match(pageSource, /free food/i)
  assert.match(pageSource, /screenshot|share|send this/i)
  assert.match(pageSource, /claremont\.life\/guides\/free-food/)
  assert.match(pageSource, /export const revalidate = 3600/)
  assert.match(pageSource, /getUpcomingEvents\(500\)/)
  assert.match(pageSource, /groupFreeFoodByDay/)
  assert.match(pageSource, /ShareGuideButton/)
  assert.match(pageSource, /NewsletterSignup/)
  assert.match(pageSource, /EventCard/)
  assert.match(pageSource, /nightly/i)
})

test('freshness honesty: the page never claims hourly updates', () => {
  assert.doesNotMatch(pageSource, /hourly/i)
})

test('empty-state copy is season-neutral', () => {
  assert.match(pageSource, /quiet/i)
  assert.match(pageSource, /bookmark/i)
  assert.doesNotMatch(pageSource, /it is summer/i)
})

test('/guides/free-food includes required internal links', () => {
  for (const href of [
    '/events\\?filter=free',
    '/events\\?filter=food',
    '/guides/cheap-eats',
    '/deals',
    '/events/submit',
    '/events',
  ]) {
    assert.match(
      pageSource,
      new RegExp(`href=[{]?['"]${href.replace(/\//g, '\\/')}['"]`),
      `expected an internal link to ${href}`,
    )
  }
})

test('metadata title leaves the | claremont.life suffix to the layout template', () => {
  assert.doesNotMatch(pageSource, /title:\s*['"][^'"]*\|\s*claremont\.life/)
})

test('the guide is registered in the guides index, sitemap, cheap-eats tip, and quick actions', () => {
  const guidesSource = readFileSync('src/app/guides/page.tsx', 'utf8')
  const sitemapSource = readFileSync('src/app/sitemap.ts', 'utf8')
  const quickActionsSource = readFileSync('src/components/StudentQuickActions.tsx', 'utf8')
  const cheapEatsSource = readFileSync('src/app/guides/cheap-eats/page.tsx', 'utf8')

  assert.match(guidesSource, /href:\s*'\/guides\/free-food'/)
  assert.match(sitemapSource, /\/guides\/free-food/)
  assert.match(quickActionsSource, /'free-food':\s*Pizza/)
  assert.match(quickActionsSource, /'free-food':\s*'border-lime-200\/80 bg-lime-50\/75 text-lime-950'/)
  assert.match(cheapEatsSource, /guides\/free-food/)
})

test('the free-food lib stays pure — no ambient clock', () => {
  const libSource = readFileSync('src/lib/free-food.ts', 'utf8')

  assert.doesNotMatch(libSource, /new Date\(\)/)
  assert.doesNotMatch(libSource, /Date\.now\(/)
})
