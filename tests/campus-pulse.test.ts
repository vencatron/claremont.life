import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function labelsForHref(source: string, href: string): string[] {
  const labels: string[] = []
  const itemPattern = /\{\s*label:\s*['"]([^'"]+)['"],[^}]*href:\s*['"]([^'"]+)['"]/g
  let match: RegExpExecArray | null

  while ((match = itemPattern.exec(source)) !== null) {
    if (match[2] === href) labels.push(match[1])
  }

  return labels
}

test('Know page is reframed as Campus Pulse instead of a generic Community page', () => {
  const source = readFileSync('src/app/know/page.tsx', 'utf8')

  assert.match(source, /title=\{?['"]Campus Pulse['"]\}?|title=\{?['"]Pulse['"]\}?/)
  assert.doesNotMatch(source, /title=\{?['"]Community['"]\}?/)
  assert.match(source, /trending|urgent|weird|useful|relevant/i)
  assert.match(source, /5Cs?|Claremont Colleges/i)
  assert.match(source, /Reddit/i)
  assert.match(source, /Student Life/i)
  assert.match(source, /local notices/i)
  assert.match(source, /weather|air/i)
  assert.match(source, /transit/i)
  assert.match(source, /getRedditPosts\(300\)/)
})

test('Campus Pulse feed exposes student-city topic filters without making Reddit the product identity', () => {
  const source = readFileSync('src/app/know/community-feed.tsx', 'utf8')
  const requiredFilters = ['Campus', 'City', 'Housing', 'Food', 'Safety', 'Transit', 'Events']

  for (const label of requiredFilters) {
    assert.match(source, new RegExp(`label:\\s*['"]${label}['"]`), `missing ${label} filter`)
  }

  assert.match(source, /Search Pulse|Search campus pulse|Search discussions/i)
  assert.match(source, /Pulse lanes|Campus Pulse/i)
  assert.match(source, /Reddit/i)
  assert.match(source, /Student Life|local notices|weather|air quality|transit/i)
})

test('Campus Pulse cards show source and trust context while preserving Reddit card behavior', () => {
  const source = readFileSync('src/app/know/community-feed.tsx', 'utf8')

  assert.match(source, /Source:\s*Reddit community thread|Reddit community thread/i)
  assert.match(source, /third-party|community-sourced|not independently verified|source label/i)
  assert.match(source, /r\/\{post\.subreddit\}/)
  assert.match(source, /href=\{post\.url\}/)
  assert.match(source, /rel=\{?['"]noopener noreferrer['"]\}?/)
  assert.match(source, /Load more/)
  assert.match(source, /No posts found/)
})

test('primary navigation labels /know as Pulse or Campus Pulse, not Community', () => {
  const desktop = readFileSync('src/components/DesktopNav.tsx', 'utf8')
  const bottom = readFileSync('src/components/BottomNav.tsx', 'utf8')

  assert.deepEqual(labelsForHref(desktop, '/know'), ['Pulse'])
  assert.deepEqual(labelsForHref(bottom, '/know'), ['Pulse'])
  assert.doesNotMatch(desktop, /label:\s*['"]Community['"],\s*href:\s*['"]\/know['"]/)
  assert.doesNotMatch(bottom, /label:\s*['"]Community['"],\s*href:\s*['"]\/know['"]/)
})
