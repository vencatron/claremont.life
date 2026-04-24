/**
 * City of Claremont Events Scraper
 *
 * The City of Claremont (claremontca.gov) lists city events on their
 * Events Directory page. The page is rendered server-side with structured HTML.
 *
 * URL: https://www.claremontca.gov/Events-directory
 *
 * This scraper uses cheerio to parse the events listing HTML.
 * City events typically include: special events, city meetings, recreation programs.
 *
 * NOTE: If the page structure changes and events stop being scraped, check:
 *   - https://www.claremontca.gov/Activities-Recreation/Special-Events
 *   - The city may also have a CivicPlus or similar platform with a JSON API
 */

import * as cheerio from 'cheerio'
import type { ScrapedEvent, ScraperResult } from './types'

const SOURCE = 'city_claremont'
const EVENTS_URL = 'https://www.claremontca.gov/Events-directory'
const SPECIAL_EVENTS_URL = 'https://www.claremontca.gov/Activities-Recreation/Special-Events'

function guessEventType(title: string): string | null {
  const t = title.toLowerCase()
  if (t.includes('concert') || t.includes('music') || t.includes('band')) return 'concert'
  if (t.includes('movie') || t.includes('film') || t.includes('screening')) return 'screening'
  if (t.includes('meeting') || t.includes('council') || t.includes('board')) return 'civic'
  if (t.includes('workshop') || t.includes('class') || t.includes('training')) return 'workshop'
  if (t.includes('market') || t.includes('fair') || t.includes('festival')) return 'festival'
  if (t.includes('parade') || t.includes('celebration') || t.includes('ceremony')) return 'festival'
  if (t.includes('egg hunt') || t.includes('halloween') || t.includes('holiday')) return 'social'
  return 'community'
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr.trim())
    return isNaN(d.getTime()) ? null : d.toISOString()
  } catch {
    return null
  }
}

export async function scrapeCityClaremont(): Promise<ScraperResult> {
  const events: ScrapedEvent[] = []

  try {
    const res = await fetch(EVENTS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ClaremontLifeBot/1.0)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const html = await res.text()
    const $ = cheerio.load(html)

    // CivicPlus / Granicus platform event cards — common selectors
    const eventSelectors = [
      '.eventItem',
      '.event-item',
      '.event-listing',
      '[class*="event-card"]',
      '[class*="EventCard"]',
      '.cal_info',
      'article[class*="event"]',
      '.listing-item',
    ]

    let foundEvents = false

    for (const selector of eventSelectors) {
      const items = $(selector)
      if (!items.length) continue

      foundEvents = true
      items.each((_, el) => {
        const $el = $(el)

        // Try various title/link patterns
        const titleEl = $el.find('h2, h3, h4, .event-title, .event-name, [class*="title"]').first()
        const title = titleEl.text().trim()
        if (!title) return

        const linkEl = $el.find('a').first()
        const href = linkEl.attr('href')
        const url = href
          ? href.startsWith('http') ? href : `https://www.claremontca.gov${href}`
          : null

        const dateEl = $el.find('[class*="date"], time, .event-date, .cal_date').first()
        const dateText = dateEl.attr('datetime') || dateEl.text().trim()
        const startsAt = parseDate(dateText)

        if (!startsAt) return // Skip events we can't date

        const sourceId = url ?? `claremont-${title}-${dateText}`

        events.push({
          title,
          college: null,
          event_type: guessEventType(title),
          location: 'Claremont, CA',
          starts_at: startsAt,
          url,
          source: SOURCE,
          source_id: sourceId,
        })
      })

      break // Stop after first matching selector
    }

    if (!foundEvents || events.length === 0) {
      // Fall back: look for any structured data (JSON-LD)
      const jsonLd = $('script[type="application/ld+json"]').text()
      if (jsonLd) {
        try {
          const data = JSON.parse(jsonLd)
          const items: unknown[] = Array.isArray(data) ? data : [data]
          for (const item of items) {
            if (typeof item !== 'object' || item === null) continue
            const ev = item as Record<string, unknown>
            if (ev['@type'] !== 'Event') continue
            const name = String(ev['name'] ?? '')
            const startDate = String(ev['startDate'] ?? '')
            const endDate = ev['endDate'] ? String(ev['endDate']) : undefined
            const location = ev['location'] as Record<string, unknown> | undefined
            const locationName = location ? String(location['name'] ?? '') : null
            if (!name || !startDate) continue
            events.push({
              title: name,
              college: null,
              event_type: guessEventType(name),
              location: locationName,
              starts_at: new Date(startDate).toISOString(),
              ends_at: endDate ? new Date(endDate).toISOString() : null,
              url: ev['url'] ? String(ev['url']) : null,
              source: SOURCE,
              source_id: `jsonld-${name}-${startDate}`,
            })
          }
        } catch { /* noop */ }
      }
    }

    if (events.length === 0) {
      console.warn(
        '[city-claremont] Could not parse events from the city website. ' +
        'The page structure may have changed. Check: ' + EVENTS_URL
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      source: SOURCE,
      events: [],
      error: `City Claremont scraper failed: ${message}. URL: ${EVENTS_URL}`,
    }
  }

  return { source: SOURCE, events }
}
