import test from 'node:test'
import assert from 'node:assert/strict'

import {
  isMissingColumnError,
  normalizeEventRow,
  toLegacyEventRow,
  toModernEventRow,
} from '../src/lib/events-compat'
import type { ScrapedEvent } from '../scrapers/events/sources/types'

test('detects Supabase/Postgres missing-column errors', () => {
  assert.equal(isMissingColumnError({ code: '42703', message: 'column events.starts_at does not exist' }), true)
  assert.equal(isMissingColumnError({ code: 'PGRST204', message: "Could not find the 'starts_at' column" }), true)
  assert.equal(isMissingColumnError({ code: '23505', message: 'duplicate key value violates unique constraint' }), false)
})

test('normalizes legacy event rows to the app event shape', () => {
  const row = {
    id: 'abc',
    source: 'legacy_source',
    source_id: 'legacy-1',
    title: 'Legacy event',
    description: 'desc',
    url: 'https://example.com',
    start_date: '2026-05-04T16:00:00+00:00',
    end_date: '2026-05-04T19:00:00+00:00',
    location: 'Village',
    category: 'Community',
    image_url: null,
  }

  assert.deepEqual(normalizeEventRow(row), {
    id: 'abc',
    source: 'legacy_source',
    source_id: 'legacy-1',
    title: 'Legacy event',
    description: 'desc',
    url: 'https://example.com',
    starts_at: '2026-05-04T16:00:00+00:00',
    ends_at: '2026-05-04T19:00:00+00:00',
    college: 'Community',
    event_type: null,
    location: 'Village',
    address: null,
    image_url: null,
    is_active: true,
  })
})

test('normalizes legacy college categories for filter buttons', () => {
  const event = normalizeEventRow({
    id: 'pomona-1',
    source: 'claremont_edu_events',
    source_id: '32819',
    title: 'Pomona event',
    start_date: '2026-05-04T16:00:00+00:00',
    category: 'Pomona',
  })

  assert.equal(event.college, 'Pomona')
  assert.equal(event.event_type, null)
})

test('maps scraped events to both modern and legacy database schemas', () => {
  const scraped: ScrapedEvent = {
    title: 'Scraped event',
    description: 'body',
    college: 'Pomona',
    event_type: 'lecture',
    location: 'Campus',
    address: '123 College Ave',
    starts_at: '2026-05-05T01:00:00.000Z',
    ends_at: '2026-05-05T02:00:00.000Z',
    url: 'https://example.com/event',
    image_url: 'https://example.com/image.jpg',
    source: 'engage_claremont',
    source_id: '42',
  }

  assert.deepEqual(toModernEventRow(scraped), {
    title: 'Scraped event',
    description: 'body',
    college: 'Pomona',
    event_type: 'lecture',
    location: 'Campus',
    address: '123 College Ave',
    starts_at: '2026-05-05T01:00:00.000Z',
    ends_at: '2026-05-05T02:00:00.000Z',
    url: 'https://example.com/event',
    image_url: 'https://example.com/image.jpg',
    source: 'engage_claremont',
    source_id: '42',
    is_active: true,
  })

  assert.deepEqual(toLegacyEventRow(scraped), {
    title: 'Scraped event',
    description: 'body',
    location: 'Campus',
    category: 'Pomona',
    start_date: '2026-05-05T01:00:00.000Z',
    end_date: '2026-05-05T02:00:00.000Z',
    url: 'https://example.com/event',
    image_url: 'https://example.com/image.jpg',
    source: 'engage_claremont',
    source_id: '42',
  })
})
