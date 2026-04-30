import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const pageSource = readFileSync(join(root, 'src/app/new/page.tsx'), 'utf8')
const guideSource = readFileSync(join(root, 'src/app/new/new-guide.tsx'), 'utf8')
const source = `${pageSource}\n${guideSource}`

test('/new is positioned as a shareable incoming-student orientation flagship', () => {
  assert.match(source, /New Here|new here/i)
  assert.match(source, /incoming (5C |student)|first-year|transfer|grad/i)
  assert.match(source, /send this|share|screenshot|save this/i)
  assert.match(source, /avoid being clueless|don.?t be clueless|not feel lost/i)
})

test('/new includes the required orientation content modules', () => {
  const requiredModules = [
    /first 24 hours/i,
    /first week/i,
    /first month/i,
    /first semester/i,
    /20 things every incoming 5C student should know/i,
    /what each campus is like|social geography/i,
    /LA without a car|without a car/i,
    /cheap food/i,
    /study spots/i,
    /not get isolated|avoid getting isolated|isolated on one campus/i,
  ]

  for (const pattern of requiredModules) {
    assert.match(source, pattern)
  }
})

test('/new links into the rest of claremont.life student surfaces', () => {
  for (const href of ['/eat', '/deals', '/events', '/housing', '/explore']) {
    assert.match(source, new RegExp(`href=[{]?['\"]${href}['\"]`), `expected an internal link to ${href}`)
  }
})

test('/new content is renderable without hiding core guidance behind tabs', () => {
  assert.doesNotMatch(guideSource, /use client|TabsTrigger|TabsContent/)
  assert.match(guideSource, /<ol|<section/i)
})

test('/new guide avoids nested main landmarks and inaccurate aria-labelledby wiring', () => {
  assert.doesNotMatch(guideSource, /<main\b/, 'NewGuide must not render a main landmark inside the layout main')

  const divIds = new Set([...guideSource.matchAll(/<div[^>]*\bid=["']([^"']+)["']/g)].map((match) => match[1]))
  const ariaLabelledByIds = [...guideSource.matchAll(/aria-labelledby=["']([^"']+)["']/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  )

  for (const id of ariaLabelledByIds) {
    assert.equal(divIds.has(id), false, `aria-labelledby="${id}" must not point to a wrapper div`)
  }
})
