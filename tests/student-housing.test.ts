import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const pageSource = readFileSync(join(root, 'src/app/housing/page.tsx'), 'utf8')
const zonesSource = readFileSync(join(root, 'src/app/housing/zones.ts'), 'utf8')
const guidePath = join(root, 'src/app/housing/housing-survival-guide.tsx')
const guideSource = existsSync(guidePath) ? readFileSync(guidePath, 'utf8') : ''
const routeSource = `${pageSource}\n${guideSource}`

test('/housing shows pre-map student survival guidance', () => {
  assert.match(routeSource, /don.?t get screwed|housing survival|before you open the map/i)
  assert.match(routeSource, /where students actually live/i)
  assert.match(routeSource, /student|grad/i)
})

test('/housing includes required practical housing modules before map interaction', () => {
  const requiredModules = [
    /walkability|walkable/i,
    /commute|bike|car needed|drive/i,
    /red flags?|checklist|before you sign/i,
    /when to start looking|timeline|jan(?:uary)?|feb(?:ruary)?/i,
    /typical rents?|price expectations?|rent ranges?/i,
    /AC|air conditioning/i,
    /parking/i,
    /laundry/i,
    /Foothill|Indian Hill/i,
    /scam|unverified/i,
  ]

  for (const pattern of requiredModules) {
    assert.match(routeSource, pattern)
  }
})

test('/housing still fetches, filters, and passes listings to HousingMap', () => {
  assert.match(pageSource, /getHousingListings\s*\(/)
  assert.match(pageSource, /allListings\.filter\s*\(/)
  assert.match(pageSource, /isInAnyZone\s*\(\s*listing\.lat\s*,\s*listing\.lng\s*\)/)
  assert.match(pageSource, /EXCLUDE_PATTERNS\.some/)
  assert.match(pageSource, /<HousingMap\s+listings=\{filtered\}/)
  assert.ok(
    pageSource.indexOf('<HousingSurvivalGuide />') >= 0 &&
      pageSource.indexOf('<HousingSurvivalGuide />') < pageSource.indexOf('<HousingMap listings={filtered} />'),
    'HousingSurvivalGuide should render before HousingMap so guidance appears before map interaction',
  )
})

test('/housing zones preserve the four key student housing zones and signing tips', () => {
  for (const zoneName of [
    /College Ave Corridor/i,
    /The Village & Claremont Heights/i,
    /Indian Hill Blvd Corridor/i,
    /North Claremont \/ Padua Hills/i,
  ]) {
    assert.match(zonesSource, zoneName)
  }

  assert.match(zonesSource, /beforeYouSignTips/)
  assert.match(zonesSource, /AC|air conditioning/i)
  assert.match(zonesSource, /parking/i)
  assert.match(zonesSource, /laundry/i)
})
