import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  CLAREMONT_EVENTS_API_URL,
  mapClaremontApiEvent,
  mapOrganizerToCollege,
} from '../scrapers/events/sources/claremont-events'

test('uses claremont.edu events API as the single events source', () => {
  assert.equal(CLAREMONT_EVENTS_API_URL, 'https://claremont.edu/wp-json/tribe/events/v1/events')
})

test('maps The Claremont Colleges organizer names to college filters', () => {
  assert.equal(mapOrganizerToCollege([{ organizer: 'Pomona College' }]), 'Pomona')
  assert.equal(mapOrganizerToCollege([{ organizer: 'Claremont McKenna College' }]), 'CMC')
  assert.equal(mapOrganizerToCollege([{ organizer: 'Harvey Mudd College' }]), 'Harvey Mudd')
  assert.equal(mapOrganizerToCollege([{ organizer: 'Scripps College' }]), 'Scripps')
  assert.equal(mapOrganizerToCollege([{ organizer: 'Pitzer College' }]), 'Pitzer')
  assert.equal(mapOrganizerToCollege([{ organizer: 'Claremont Graduate University' }]), 'CGU')
  assert.equal(mapOrganizerToCollege([{ organizer: 'Keck Graduate Institute' }]), 'KGI')
})

test('maps a claremont.edu API event into the app event shape', () => {
  const event = mapClaremontApiEvent({
    id: 32843,
    title: 'AI in Teaching &#038; Learning',
    description: '<p>Conference details &amp; notes.</p>',
    excerpt: '',
    start_date: '2026-10-23 00:00:00',
    end_date: '2026-10-23 23:59:00',
    url: 'https://claremont.edu/event/ai-in-teaching-learning/',
    website: 'https://www.cmc.edu/events/ai',
    timezone: 'America/Los_Angeles',
    image: { url: 'https://claremont.edu/image.jpg' },
    categories: [{ name: 'Conference' }],
    organizer: [{ organizer: 'Claremont McKenna College' }],
    venue: { venue: 'Marian Miner Cook Athenaeum', address: '385 E 8th St' },
  })

  assert.deepEqual(event, {
    title: 'AI in Teaching & Learning',
    description: 'Conference details & notes.',
    college: 'CMC',
    event_type: 'conference',
    location: 'Marian Miner Cook Athenaeum',
    address: '385 E 8th St',
    starts_at: '2026-10-23T07:00:00.000Z',
    ends_at: '2026-10-24T06:59:00.000Z',
    url: 'https://claremont.edu/event/ai-in-teaching-learning/',
    image_url: 'https://claremont.edu/image.jpg',
    source: 'claremont_edu_events',
    source_id: '32843',
  })
})

test('events page query reads only the claremont.edu source', () => {
  const dataSource = readFileSync(join(process.cwd(), 'src/lib/data.ts'), 'utf8')
  const sourceFilterCount = dataSource.match(/\.eq\('source', 'claremont_edu_events'\)/g)?.length ?? 0

  assert.equal(sourceFilterCount, 2)
})
