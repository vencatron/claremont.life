import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const cheapEatsPagePath = join(root, 'src/app/guides/cheap-eats/page.tsx')
const shareButtonPath = join(root, 'src/components/ShareGuideButton.tsx')
const homePagePath = join(root, 'src/app/page.tsx')

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

const cheapEatsSource = readIfExists(cheapEatsPagePath)
const shareButtonSource = readIfExists(shareButtonPath)
const homePageSource = readFileSync(homePagePath, 'utf8')

test('/guides/cheap-eats exists as a polished direct landing page', () => {
  assert.equal(existsSync(cheapEatsPagePath), true, 'expected src/app/guides/cheap-eats/page.tsx to exist')
  assert.match(cheapEatsSource, /cheap eats|cheap food/i)
  assert.match(cheapEatsSource, /Claremont|5C|Five Colleges/i)
  assert.match(cheapEatsSource, /screenshot|share|send this/i)
  assert.match(cheapEatsSource, /claremont\.life\/guides\/cheap-eats|\/guides\/cheap-eats/i)
})

test('/guides/cheap-eats includes required utility links and newsletter CTA', () => {
  for (const href of ['/eat', '/deals', '/events', '/new']) {
    assert.match(cheapEatsSource, new RegExp(`href=[{]?['\"]${href}['\"]`), `expected an internal link to ${href}`)
  }

  assert.match(cheapEatsSource, /NewsletterSignup/)
  assert.match(cheapEatsSource, /student|5C/i)
})

test('/guides/cheap-eats has at least four compact student-first cheap-eats cards', () => {
  const cardMatches = cheapEatsSource.match(/title:\s*['\"]/g) ?? []
  assert.ok(cardMatches.length >= 4, `expected at least 4 compact tip cards, found ${cardMatches.length}`)
  assert.match(cheapEatsSource, /dining hall|meal swipe|Village|grocery|finals|late/i)
})

test('ShareGuideButton uses safe browser share/copy APIs with graceful fallback', () => {
  assert.equal(existsSync(shareButtonPath), true, 'expected src/components/ShareGuideButton.tsx to exist')
  assert.match(shareButtonSource, /['"]use client['"]|['"]use client['"]/)
  assert.match(shareButtonSource, /navigator\.share/)
  assert.match(shareButtonSource, /navigator\.clipboard|clipboard\.writeText/)
  assert.match(shareButtonSource, /typeof window|typeof navigator/)
  assert.match(shareButtonSource, /fallback|copy this URL|address bar|setStatus/i)
})

test('homepage links to the cheap-eats guide without replacing the existing student flow', () => {
  assert.match(homePageSource, /href=[{]?['"]\/guides\/cheap-eats['"]/, 'expected homepage discovery link to /guides/cheap-eats')
  assert.match(homePageSource, /cheap eats|cheap food|budget meal/i)
  assert.match(homePageSource, /StudentVoice/)
  assert.match(homePageSource, /StudentQuickActions/)
})
