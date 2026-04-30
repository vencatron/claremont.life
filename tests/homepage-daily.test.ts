import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  HOME_QUICK_ACTIONS,
  splitHomepageEvents,
} from '../src/lib/homepage-daily'
import type { ClaremontEvent } from '../src/types'

function event(id: string, starts_at: string): ClaremontEvent {
  return {
    id,
    source: 'claremont_edu_events',
    source_id: id,
    title: `Event ${id}`,
    starts_at,
  }
}

test('homepage quick actions expose the student daily utility entry points', () => {
  assert.deepEqual(
    HOME_QUICK_ACTIONS.map((action) => ({ id: action.id, label: action.label, href: action.href })),
    [
      { id: 'today', label: 'Today', href: '/events' },
      { id: 'tonight', label: 'Tonight', href: '/events' },
      { id: 'weekend', label: 'This Weekend', href: '/events' },
      { id: 'free-food', label: 'Free Food', href: '/events' },
      { id: 'open-late', label: 'Open Late', href: '/eat' },
      { id: 'student-deals', label: 'Student Deals', href: '/deals' },
      { id: 'new-here', label: 'New Here', href: '/new' },
    ],
  )
})

test('homepage quick actions avoid unimplemented filter query params', () => {
  assert.equal(
    HOME_QUICK_ACTIONS.every((action) => !action.href.includes('?')),
    true,
  )
})

test('home today fallback links avoid unimplemented utility query params', () => {
  const source = readFileSync('src/components/HomeTodaySection.tsx', 'utf8')
  const unsupportedUtilityLinks = source.match(/href:\s*['"][^'"]*\?(?:tag|window)=/g) ?? []

  assert.deepEqual(unsupportedUtilityLinks, [])
})

test('homepage event preview splits upcoming events into tonight and this week buckets', () => {
  const preview = splitHomepageEvents(
    [
      event('past', '2026-04-29T17:30:00.000Z'),
      event('tomorrow', '2026-04-30T19:00:00.000Z'),
      event('tonight-late', '2026-04-29T23:00:00.000Z'),
      event('next-week', '2026-05-07T18:00:00.000Z'),
      event('tonight-soon', '2026-04-29T18:30:00.000Z'),
      event('six-days', '2026-05-05T20:00:00.000Z'),
    ],
    { now: new Date('2026-04-29T18:00:00.000Z'), tonightLimit: 2, thisWeekLimit: 2 },
  )

  assert.deepEqual(preview.tonight.map((item) => item.id), ['tonight-soon', 'tonight-late'])
  assert.deepEqual(preview.thisWeek.map((item) => item.id), ['tomorrow', 'six-days'])
})

test('homepage event preview prioritizes matching events before slicing but returns the selected bucket chronologically', () => {
  const preview = splitHomepageEvents(
    [
      event('other-earliest', '2026-04-29T18:30:00.000Z'),
      event('other-middle', '2026-04-29T19:00:00.000Z'),
      event('other-later', '2026-04-29T20:00:00.000Z'),
      event('preferred-earlier', '2026-04-29T21:00:00.000Z'),
      event('preferred-later', '2026-04-29T22:00:00.000Z'),
    ],
    {
      now: new Date('2026-04-29T18:00:00.000Z'),
      tonightLimit: 3,
      prioritizeEvent: (item) => item.id.startsWith('preferred'),
    },
  )

  assert.deepEqual(preview.tonight.map((item) => item.id), [
    'other-earliest',
    'preferred-earlier',
    'preferred-later',
  ])
})

test('homepage event preview ignores malformed event dates', () => {
  const preview = splitHomepageEvents(
    [
      event('invalid', 'not-a-date'),
      event('tonight-valid', '2026-04-29T21:00:00-07:00'),
      event('week-valid', '2026-04-30T12:00:00-07:00'),
    ],
    { now: new Date('2026-04-29T20:00:00-07:00') },
  )

  assert.deepEqual(preview.tonight.map((item) => item.id), ['tonight-valid'])
  assert.deepEqual(preview.thisWeek.map((item) => item.id), ['week-valid'])
})

test('homepage event preview uses the Pacific midnight boundary for tonight', () => {
  const preview = splitHomepageEvents(
    [
      event('before-pacific-midnight', '2026-04-29T23:59:00-07:00'),
      event('after-pacific-midnight', '2026-04-30T00:01:00-07:00'),
    ],
    { now: new Date('2026-04-29T20:00:00-07:00'), tonightLimit: 5, thisWeekLimit: 5 },
  )

  assert.deepEqual(preview.tonight.map((item) => item.id), ['before-pacific-midnight'])
  assert.deepEqual(preview.thisWeek.map((item) => item.id), ['after-pacific-midnight'])
})
