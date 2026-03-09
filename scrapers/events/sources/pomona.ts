/**
 * Pomona College Events Scraper
 *
 * Pomona uses Trumba calendar (trumba.com) with web name "pomona-college-events".
 * The calendar is rendered entirely client-side via JavaScript, making direct HTML
 * scraping unreliable without a headless browser.
 *
 * Approach: Use Trumba's undocumented "spud" REST API, which the browser JS calls
 * to fetch events. The endpoint returns a JSON payload.
 *
 * Alternative (if Trumba API changes): Pomona's Trumba calendar also publishes
 * an iCal feed at https://www.trumba.com/calendar/pomona-college-events.ics
 * which can be parsed with an ics parser.
 *
 * NOTE: If this scraper returns 0 events, check the Trumba web name on
 * https://www.pomona.edu/events (inspect the $Trumba.addSpud() calls).
 */

import type { ScrapedEvent, ScraperResult } from './types.js'

const SOURCE = 'pomona_calendar'
const TRUMBA_WEB_NAME = 'pomona-college-events'
const TRUMBA_ICS_URL = `https://www.trumba.com/calendar/${TRUMBA_WEB_NAME}.ics`
const TRUMBA_JSON_URL = `https://www.trumba.com/calendar/${TRUMBA_WEB_NAME}/list.json`

// Trumba "spuds" API — fetches the event list as JSON
// Format: ?tmsource=public&spudtype=list&pagedate=YYYY-MM-DD
const TRUMBA_SPUD_URL = `https://www.trumba.com/calendar/${TRUMBA_WEB_NAME}?tmsource=public&spudtype=list&format=json`

interface TrumbaEvent {
  eventID?: number
  title?: string
  description?: string
  location?: string
  startDateTime?: string
  endDateTime?: string
  eventUrl?: string
  imageUrl?: string
  eventTypeDescription?: string
}

function guessEventType(title: string, category?: string): string | null {
  const t = (title + ' ' + (category ?? '')).toLowerCase()
  if (t.includes('concert') || t.includes('recital') || t.includes('music')) return 'concert'
  if (t.includes('lecture') || t.includes('talk') || t.includes('symposium')) return 'lecture'
  if (t.includes('workshop') || t.includes('training')) return 'workshop'
  if (t.includes('sport') || t.includes('game') || t.includes('match') || t.includes('athletic')) return 'sports'
  if (t.includes('exhibit') || t.includes('gallery') || t.includes('art')) return 'exhibition'
  return null
}

export async function scrapePomona(): Promise<ScraperResult> {
  const events: ScrapedEvent[] = []

  try {
    // Try the Trumba spud JSON endpoint first
    const res = await fetch(TRUMBA_SPUD_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ClaremontLifeBot/1.0)',
        'Accept': 'application/json, text/html',
      },
      signal: AbortSignal.timeout(15000),
    })

    const text = await res.text()

    // Trumba returns JSON embedded in HTML sometimes; try to parse as JSON directly
    let parsed: TrumbaEvent[] | null = null
    try {
      const json = JSON.parse(text)
      // Trumba JSON structure varies; try common shapes
      if (Array.isArray(json)) parsed = json
      else if (Array.isArray(json?.events)) parsed = json.events
      else if (Array.isArray(json?.d)) parsed = json.d
    } catch {
      // Not pure JSON — Trumba may have returned HTML
      // Try to extract JSON from HTML script tags (Trumba sometimes embeds data)
      const jsonMatch = text.match(/\bvar\s+trumbaEvents\s*=\s*(\[.*?\]);/s)
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[1]) } catch { /* noop */ }
      }
    }

    if (parsed && parsed.length > 0) {
      for (const ev of parsed) {
        if (!ev.title || !ev.startDateTime) continue
        events.push({
          title: ev.title.trim(),
          description: ev.description?.replace(/<[^>]+>/g, '').trim() || undefined,
          college: 'Pomona',
          event_type: guessEventType(ev.title, ev.eventTypeDescription),
          location: ev.location?.trim() || null,
          starts_at: new Date(ev.startDateTime).toISOString(),
          ends_at: ev.endDateTime ? new Date(ev.endDateTime).toISOString() : null,
          url: ev.eventUrl || null,
          image_url: ev.imageUrl || null,
          source: SOURCE,
          source_id: String(ev.eventID ?? `${ev.title}-${ev.startDateTime}`),
        })
      }
    }

    if (events.length === 0) {
      // The Trumba spud API didn't return usable data.
      // Log a warning for operators — this source needs manual investigation.
      console.warn(
        '[pomona] Trumba API returned no parseable events. ' +
        'Consider fetching the ICS feed at ' + TRUMBA_ICS_URL + ' instead, ' +
        'or using a headless browser. Skipping source.'
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      source: SOURCE,
      events: [],
      error: `Pomona scraper failed: ${message}. ` +
             `Note: Pomona uses Trumba (web name: ${TRUMBA_WEB_NAME}). ` +
             `Try the ICS feed at ${TRUMBA_ICS_URL} as an alternative.`,
    }
  }

  return { source: SOURCE, events }
}
