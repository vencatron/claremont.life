import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readFile, rm } from 'node:fs/promises'
import { NextRequest } from 'next/server'

import {
  normalizeEventSubmission,
  toEventSubmissionInsertRow,
  type EventSubmissionRecord,
} from '../src/lib/event-submissions'
import { POST } from '../src/app/api/events/submit/route'

const validPayload = {
  title: '  Free Pizza Night <b>for first-years</b>  ',
  startsAt: '2026-05-01T19:30:00-07:00',
  location: '  Walker Lounge  ',
  campusOrOrg: '  Pomona ASPC  ',
  audience: 'Open to all 5C students',
  eventUrl: 'https://example.edu/rsvp?event=pizza',
  foodFreeCost: 'Free pizza while supplies last',
  notes: 'Bring a friend <script>alert(1)</script>',
  submitterEmail: ' CLUB-LEAD@Pomona.edu ',
}

function setProcessEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, name)
    return
  }

  process.env[name] = value
}

test('normalizes a student event submission as pending and strips HTML-like input', () => {
  const result = normalizeEventSubmission(validPayload)

  assert.equal(result.ok, true)
  const submission = (result as { ok: true; value: EventSubmissionRecord }).value
  assert.equal(submission.status, 'pending')
  assert.equal(submission.isVerified, false)
  assert.equal(submission.title, 'Free Pizza Night for first-years')
  assert.equal(submission.location, 'Walker Lounge')
  assert.equal(submission.campusOrOrg, 'Pomona ASPC')
  assert.equal(submission.audience, 'Open to all 5C students')
  assert.equal(submission.submitterEmail, 'club-lead@pomona.edu')
  assert.equal(submission.eventUrl, 'https://example.edu/rsvp?event=pizza')
  assert.doesNotMatch(submission.notes ?? '', /<|>|script/i)
})

test('requires the minimum fields needed for review before accepting an event submission', () => {
  const result = normalizeEventSubmission({
    title: '',
    startsAt: 'not a date',
    location: ' ',
    campusOrOrg: '',
    audience: '',
    submitterEmail: 'not-an-email',
  })

  assert.equal(result.ok, false)
  assert.deepEqual(Object.keys((result as { ok: false; errors: Record<string, string> }).errors).sort(), [
    'audience',
    'campusOrOrg',
    'location',
    'startsAt',
    'submitterEmail',
    'title',
  ])
})

test('accepts dateTime/rsvpLink/openTo aliases from the public form', () => {
  const result = normalizeEventSubmission({
    title: 'Mixer',
    dateTime: '2026-05-02T20:00:00-07:00',
    location: 'Vita Nova Courtyard',
    campusOrOrg: 'Scripps club',
    openTo: 'Scripps and 5C friends',
    rsvpLink: 'https://example.com/mixer',
    submitterEmail: 'leader@scrippscollege.edu',
  })

  assert.equal(result.ok, true)
  const submission = (result as { ok: true; value: EventSubmissionRecord }).value
  assert.equal(submission.audience, 'Scripps and 5C friends')
  assert.equal(submission.eventUrl, 'https://example.com/mixer')
  assert.match(submission.startsAt, /^2026-05-03T03:00:00\.000Z$/)
})

test('interprets browser datetime-local values as Claremont time, not server timezone', () => {
  const previousTimeZone = process.env.TZ
  setProcessEnv('TZ', 'UTC')
  try {
    const result = normalizeEventSubmission({
      title: 'Dinner social',
      dateTime: '2026-07-01T19:30',
      location: 'Courtyard',
      campusOrOrg: '5C Club',
      openTo: 'All 5C students',
      submitterEmail: 'leader@example.edu',
    })

    assert.equal(result.ok, true)
    const submission = (result as { ok: true; value: EventSubmissionRecord }).value
    assert.equal(submission.startsAt, '2026-07-02T02:30:00.000Z')
  } finally {
    setProcessEnv('TZ', previousTimeZone)
  }
})

test('rejects impossible browser datetime-local calendar values', () => {
  const result = normalizeEventSubmission({
    title: 'Impossible date social',
    dateTime: '2026-02-31T19:30',
    location: 'Courtyard',
    campusOrOrg: '5C Club',
    openTo: 'All 5C students',
    submitterEmail: 'leader@example.edu',
  })

  assert.equal(result.ok, false)
  assert.match((result as { ok: false; errors: Record<string, string> }).errors.startsAt, /valid/i)
})

test('rejects non-http RSVP links instead of storing unsafe URLs', () => {
  const result = normalizeEventSubmission({
    ...validPayload,
    eventUrl: 'javascript:alert(1)',
  })

  assert.equal(result.ok, false)
  assert.match((result as { ok: false; errors: Record<string, string> }).errors.eventUrl, /valid/i)
})

test('event submission API returns field errors for invalid JSON payloads', async () => {
  const response = await POST(new NextRequest('http://localhost/api/events/submit', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.77',
    },
    body: JSON.stringify({
      title: '',
      dateTime: 'not-a-date',
      location: '',
      campusOrOrg: '',
      openTo: '',
      submitterEmail: 'not-an-email',
    }),
  }))
  const data = await response.json() as { success: boolean; errors: Record<string, string> }

  assert.equal(response.status, 400)
  assert.equal(data.success, false)
  assert.deepEqual(Object.keys(data.errors).sort(), [
    'audience',
    'campusOrOrg',
    'location',
    'startsAt',
    'submitterEmail',
    'title',
  ])
})

test('maps accepted submissions to pending review table rows without public event fields', () => {
  const result = normalizeEventSubmission(validPayload)
  assert.equal(result.ok, true)

  const row = toEventSubmissionInsertRow((result as { ok: true; value: EventSubmissionRecord }).value)

  assert.equal(row.title, 'Free Pizza Night for first-years')
  assert.equal(row.status, 'pending')
  assert.equal(row.is_verified, false)
  assert.equal(row.submitter_email, 'club-lead@pomona.edu')
  assert.equal('source_id' in row, false)
  assert.equal('is_active' in row, false)
})

test('event submission API queues a valid request locally in development without Supabase secrets', async () => {
  const previousNodeEnv = process.env.NODE_ENV
  setProcessEnv('NODE_ENV', 'development')
  await rm('.local/event-submissions.jsonl', { force: true })

  try {
    const response = await POST(new NextRequest('http://localhost/api/events/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validPayload),
    }))
    const data = await response.json() as { success: boolean; queued: boolean }
    const queued = await readFile('.local/event-submissions.jsonl', 'utf8')
    const row = JSON.parse(queued.trim()) as { status: string; is_verified: boolean; title: string }

    assert.equal(response.status, 200)
    assert.deepEqual(data, {
      success: true,
      message: 'Thanks — your event was queued for review.',
      queued: true,
    })
    assert.equal(row.status, 'pending')
    assert.equal(row.is_verified, false)
    assert.equal(row.title, 'Free Pizza Night for first-years')
  } finally {
    await rm('.local/event-submissions.jsonl', { force: true })
    setProcessEnv('NODE_ENV', previousNodeEnv)
  }
})

test('event submissions migration creates a service-role-only pending review queue', () => {
  const migration = readFileSync('scrapers/migrations/006_event_submissions.sql', 'utf8')

  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.event_submissions/i)
  assert.match(migration, /status\s+TEXT\s+NOT NULL\s+DEFAULT 'pending'/i)
  assert.match(migration, /is_verified\s+BOOLEAN\s+NOT NULL\s+DEFAULT false/i)
  assert.match(migration, /CHECK \(status = 'pending'\)/i)
  assert.match(migration, /CHECK \(is_verified = false\)/i)
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/i)
  assert.match(migration, /FORCE ROW LEVEL SECURITY/i)
  assert.match(migration, /REVOKE ALL ON TABLE public\.event_submissions FROM anon/i)
  assert.match(migration, /REVOKE ALL ON TABLE public\.event_submissions FROM authenticated/i)
  assert.match(migration, /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.event_submissions TO service_role/i)
  assert.doesNotMatch(migration, /CREATE\s+POLICY/i)
})

test('event submission API source stores only pending review rows, never public events', () => {
  const source = readFileSync('src/app/api/events/submit/route.ts', 'utf8')

  assert.match(source, /rateLimit\(['"]event-submit['"]/)
  assert.match(source, /getClientIp/)
  assert.match(source, /\.from\(['"]event_submissions['"]\)/)
  assert.match(source, /toEventSubmissionInsertRow/)
  assert.equal(/\.from\(['"]events['"]\)/.test(source), false)
})

test('events UI links students to the reviewed event submission flow', () => {
  const feedSource = readFileSync('src/components/EventsFeed.tsx', 'utf8')
  const eventsPageSource = readFileSync('src/app/events/page.tsx', 'utf8')
  const homePageSource = readFileSync('src/app/page.tsx', 'utf8')
  const submitPageSource = readFileSync('src/app/events/submit/page.tsx', 'utf8')

  assert.match(feedSource, /href=\{?['"]\/events\/submit['"]\}?/)
  assert.match(eventsPageSource, /\/events\/submit/)
  assert.match(homePageSource, /\/events\/submit/)
  assert.match(submitPageSource, /reviewed|pending|not instantly/i)
  assert.match(submitPageSource, /title/i)
  assert.match(submitPageSource, /submitterEmail|email/i)
})
