import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import type { ClaremontEvent } from '../src/types'
import {
  CAMPUS_PREFERENCE_STORAGE_KEY,
  STUDENT_CAMPUSES,
  clearCampusPreference,
  isStudentCampus,
  readCampusPreference,
  sortEventsByCampusPreference,
  writeCampusPreference,
} from '../src/lib/preferences'

function event(overrides: Partial<ClaremontEvent>): ClaremontEvent {
  return {
    id: overrides.id ?? 'event',
    source: overrides.source ?? 'claremont_edu_events',
    source_id: overrides.source_id ?? overrides.id ?? 'event',
    title: overrides.title ?? 'Campus event',
    starts_at: overrides.starts_at ?? '2026-05-01T02:30:00.000Z',
    college: overrides.college ?? null,
    description: overrides.description ?? null,
    url: overrides.url ?? null,
    ends_at: overrides.ends_at ?? null,
    event_type: overrides.event_type ?? null,
    location: overrides.location ?? null,
    address: overrides.address ?? null,
    image_url: overrides.image_url ?? null,
    is_active: overrides.is_active ?? true,
  }
}

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

test('student campus preferences only include real school campuses', () => {
  assert.deepEqual(STUDENT_CAMPUSES, ['Pomona', 'CMC', 'Harvey Mudd', 'Scripps', 'Pitzer', 'CGU', 'KGI'])

  assert.equal(isStudentCampus('Pomona'), true)
  assert.equal(isStudentCampus('Harvey Mudd'), true)
  assert.equal(isStudentCampus('All'), false)
  assert.equal(isStudentCampus('Community'), false)
  assert.equal(isStudentCampus('Forum'), false)
  assert.equal(isStudentCampus(null), false)
})

test('campus preference read/write/clear persists valid campuses locally', () => {
  const storage = new MemoryStorage()

  assert.equal(readCampusPreference(storage), null)
  writeCampusPreference('Scripps', storage)

  assert.equal(storage.getItem(CAMPUS_PREFERENCE_STORAGE_KEY), 'Scripps')
  assert.equal(readCampusPreference(storage), 'Scripps')

  clearCampusPreference(storage)
  assert.equal(storage.getItem(CAMPUS_PREFERENCE_STORAGE_KEY), null)
  assert.equal(readCampusPreference(storage), null)
})

test('campus preference ignores invalid stored values', () => {
  const storage = new MemoryStorage()

  storage.setItem(CAMPUS_PREFERENCE_STORAGE_KEY, 'Community')
  assert.equal(readCampusPreference(storage), null)

  storage.setItem(CAMPUS_PREFERENCE_STORAGE_KEY, 'All')
  assert.equal(readCampusPreference(storage), null)
})

test('campus preference storage helpers stay safe when storage is unavailable or throws', () => {
  const throwingStorage = {
    getItem() {
      throw new Error('blocked')
    },
    setItem() {
      throw new Error('blocked')
    },
    removeItem() {
      throw new Error('blocked')
    },
  } satisfies Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

  assert.equal(readCampusPreference(throwingStorage), null)
  assert.doesNotThrow(() => writeCampusPreference('KGI', throwingStorage))
  assert.doesNotThrow(() => clearCampusPreference(throwingStorage))
  assert.doesNotThrow(() => readCampusPreference())
})

test('campus preference sorting keeps every event while moving preferred campus first stably', () => {
  const events = [
    event({ id: 'community', source: 'claremont_edu_events' }),
    event({ id: 'cmc-1', source: 'cmc_calendar' }),
    event({ id: 'pomona', college: 'Pomona' }),
    event({ id: 'cmc-2', college: 'CMC' }),
    event({ id: 'scripps', source: 'scripps_calendar' }),
  ]

  const sorted = sortEventsByCampusPreference(events, 'CMC')

  assert.notEqual(sorted, events)
  assert.deepEqual(sorted.map((item) => item.id), ['cmc-1', 'cmc-2', 'community', 'pomona', 'scripps'])
  assert.deepEqual(events.map((item) => item.id), ['community', 'cmc-1', 'pomona', 'cmc-2', 'scripps'])
  assert.deepEqual(sortEventsByCampusPreference(events, null).map((item) => item.id), events.map((item) => item.id))
})

test('CampusPreference component is a client localStorage prompt with reset/change affordance', () => {
  const source = readFileSync('src/components/CampusPreference.tsx', 'utf8')

  assert.match(source, /['"]use client['"]/)
  assert.match(source, /Choose your campus/i)
  assert.match(source, /localStorage/)
  assert.match(source, /STUDENT_CAMPUSES\.map/)
  assert.match(source, /readCampusPreference/)
  assert.match(source, /writeCampusPreference/)
  assert.match(source, /clearCampusPreference/)
  assert.match(source, /CAMPUS_PREFERENCE_CHANGE_EVENT/)
  assert.match(source, /useSyncExternalStore/)
  assert.match(source, /export function useCampusPreference/)
  assert.match(source, /Reset campus|Change campus|Choose a different campus/i)
})

test('campus preference consumers use the shared external-store hook, not effect-driven reads', () => {
  const eventsSource = readFileSync('src/components/EventsFeed.tsx', 'utf8')
  const homeTodaySource = readFileSync('src/components/HomeTodaySection.tsx', 'utf8')

  for (const source of [eventsSource, homeTodaySource]) {
    assert.match(source, /useCampusPreference\(\)/)
    assert.doesNotMatch(source, /setCampusPreference\s*\(\s*readCampusPreference/)
    assert.doesNotMatch(source, /CAMPUS_PREFERENCE_CHANGE_EVENT/)
    assert.doesNotMatch(source, /CAMPUS_PREFERENCE_STORAGE_KEY/)
  }
})

test('homepage renders CampusPreference and prioritizes home events by campus preference', () => {
  const pageSource = readFileSync('src/app/page.tsx', 'utf8')
  const homeTodaySource = readFileSync('src/components/HomeTodaySection.tsx', 'utf8')

  assert.match(pageSource, /CampusPreference/)
  assert.match(pageSource, /<CampusPreference\s*\/?/)
  assert.match(homeTodaySource, /['"]use client['"]/)
  assert.match(homeTodaySource, /useCampusPreference/)
  assert.match(homeTodaySource, /getEventCampus/)
  assert.match(homeTodaySource, /prioritizeEvent:\s*campusPreference/s)
  assert.match(homeTodaySource, /getEventCampus\(event\)\s*===\s*campusPreference/)
})

test('EventsFeed applies campus preference sorting only for All and keeps explicit campus filtering', () => {
  const source = readFileSync('src/components/EventsFeed.tsx', 'utf8')

  assert.match(source, /useCampusPreference/)
  assert.match(source, /sortEventsByCampusPreference/)
  assert.match(source, /CampusPreference/)
  assert.match(source, /Prioritizing\s*\{?campusPreference\}?|Prioritizing .* first/s)
  assert.match(source, /college:\s*selectedCollege/)
  assert.match(source, /selectedCollege\s*===\s*['"]All['"]/)
  assert.match(source, /selectedCollege\s*!==\s*['"]All['"]/)
})

// Regression: campus preference must not move a later preferred-campus day ahead of earlier days.
// Keep the grouped day buckets chronological, then prioritize the preferred campus inside each day only.
test('EventsFeed groups chronological events before sorting each day by campus preference', () => {
  const source = readFileSync('src/components/EventsFeed.tsx', 'utf8')

  assert.doesNotMatch(source, /sortEventsByCampusPreference\(\s*filtered\s*,/)
  assert.match(source, /const\s+chronologicalEvents\s*=\s*\[\s*\.\.\.filtered\s*\]\s*\.sort\s*\(/s)

  const reduceIndex = source.indexOf('chronologicalEvents.reduce')
  const daySortIndex = source.indexOf('sortEventsByCampusPreference(dayEvents, campusPreference)')

  assert.notEqual(reduceIndex, -1)
  assert.notEqual(daySortIndex, -1)
  assert.equal(reduceIndex < daySortIndex, true)
})
