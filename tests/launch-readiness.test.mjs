import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const trustFooterPath = join(root, 'src/components/LaunchTrustFooter.tsx')
const layoutPath = join(root, 'src/app/layout.tsx')
const newsletterPath = join(root, 'src/components/NewsletterSignup.tsx')
const eventsPagePath = join(root, 'src/app/events/page.tsx')
const eventCardPath = join(root, 'src/components/EventCard.tsx')

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

const trustFooterSource = readIfExists(trustFooterPath)
const layoutSource = readFileSync(layoutPath, 'utf8')
const newsletterSource = readFileSync(newsletterPath, 'utf8')
const eventsPageSource = readFileSync(eventsPagePath, 'utf8')
const eventCardSource = readFileSync(eventCardPath, 'utf8')

test('launch trust footer exists and exposes source, freshness, corrections, and privacy signals', () => {
  assert.equal(existsSync(trustFooterPath), true, 'expected src/components/LaunchTrustFooter.tsx to exist')
  assert.match(trustFooterSource, /public calendars|official calendars|source/i)
  assert.match(trustFooterSource, /updated|fresh|refresh/i)
  assert.match(trustFooterSource, /correction|report/i)
  assert.match(trustFooterSource, /newsletter/i)
  assert.match(trustFooterSource, /no spam|unsubscribe|privacy/i)
})

test('layout renders launch trust footer globally without replacing existing nav wrappers', () => {
  assert.match(layoutSource, /LaunchTrustFooter/)
  assert.match(layoutSource, /<DesktopNav \/>/)
  assert.match(layoutSource, /<BottomNav \/>/)
  assert.match(layoutSource, /<LayoutWrapper>/)
})

test('newsletter signup states a clear privacy/no-spam promise near the form', () => {
  assert.match(newsletterSource, /no spam|unsubscribe|privacy/i)
  assert.match(newsletterSource, /weekly|student|Claremont/i)
})

test('events page includes an above-feed freshness and correction note', () => {
  assert.match(eventsPageSource, /refresh|updated|fresh/i)
  assert.match(eventsPageSource, /public calendars|7C calendars|source/i)
  assert.match(eventsPageSource, /correction|missing|report/i)
})

test('event cards render explicit source/trust copy beyond inferred badges', () => {
  assert.match(eventCardSource, /Source:/)
  assert.match(eventCardSource, /event\.source/)
  assert.match(eventCardSource, /sourceDetail/)
  assert.match(eventCardSource, /not independently verified|public calendar|source/i)
  assert.doesNotMatch(eventCardSource, /\{event\.source\}\)/, 'should not render a literal undefined source detail')
})
