/**
 * Eventbrite Events Scraper
 *
 * Eventbrite's public API (v3) requires an OAuth token for most search endpoints.
 * The "discover" public search (search.eventbrite.com) was deprecated in 2023.
 *
 * To use this scraper:
 * 1. Create a free Eventbrite developer account at https://www.eventbrite.com/platform
 * 2. Create a new app and get your Private Token
 * 3. Set EVENTBRITE_API_KEY in your .env file
 *
 * API endpoint used:
 *   GET https://www.eventbriteapi.com/v3/events/search/
 *   Params: location.address, location.within, start_date.range_start
 *
 * Docs: https://www.eventbrite.com/platform/api#/reference/event/list/
 */

import type { ScrapedEvent, ScraperResult } from './types'

const SOURCE = 'eventbrite'
const API_BASE = 'https://www.eventbriteapi.com/v3'
const LOCATION = 'Claremont, CA'
const RADIUS = '10mi'

interface EventbriteEvent {
  id: string
  name: { text: string; html: string }
  description: { text: string; html: string }
  start: { local: string; utc: string; timezone: string }
  end: { local: string; utc: string; timezone: string }
  url: string
  logo?: { url: string; original?: { url: string } }
  venue_id?: string
  category_id?: string
}

interface EventbriteVenue {
  id: string
  name: string
  address: {
    address_1?: string
    city?: string
    region?: string
    postal_code?: string
    localized_address_display?: string
  }
}

interface EventbriteResponse {
  events: EventbriteEvent[]
  pagination: {
    page_number: number
    page_size: number
    page_count: number
    has_more_items: boolean
    continuation?: string
  }
}

function mapCategoryId(id: string | undefined): string | null {
  if (!id) return null
  // Eventbrite category IDs: https://www.eventbrite.com/platform/api#/reference/category
  const mapping: Record<string, string> = {
    '103': 'music',
    '110': 'sports',
    '113': 'social',
    '105': 'arts',
    '101': 'business',
    '102': 'science',
    '107': 'health',
    '108': 'sports',
    '111': 'social',
    '114': 'workshop',
    '115': 'social',
    '116': 'social',
  }
  return mapping[id] ?? null
}

export async function scrapeEventbrite(): Promise<ScraperResult> {
  const apiKey = process.env.EVENTBRITE_API_KEY

  if (!apiKey) {
    return {
      source: SOURCE,
      events: [],
      error:
        'EVENTBRITE_API_KEY not set. ' +
        'Get a free API key at https://www.eventbrite.com/platform and set it in your .env file. ' +
        'See scrapers/README.md for setup instructions.',
    }
  }

  const events: ScrapedEvent[] = []

  try {
    const startDate = new Date().toISOString()
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

    let continuation: string | undefined
    let pageCount = 0
    const MAX_PAGES = 5

    do {
      const params = new URLSearchParams({
        'location.address': LOCATION,
        'location.within': RADIUS,
        'start_date.range_start': startDate,
        'start_date.range_end': endDate,
        'expand': 'venue',
        'page_size': '50',
      })
      if (continuation) params.set('continuation', continuation)

      const url = `${API_BASE}/events/search/?${params}`
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'User-Agent': 'ClaremontLifeBot/1.0',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`)
      }

      const data = await res.json() as EventbriteResponse & { events: Array<EventbriteEvent & { venue?: EventbriteVenue }> }

      for (const ev of data.events) {
        const venue = ev.venue
        const address = venue?.address?.localized_address_display
          ?? [venue?.address?.address_1, venue?.address?.city, venue?.address?.region, venue?.address?.postal_code]
              .filter(Boolean).join(', ')
          ?? null

        events.push({
          title: ev.name.text.trim(),
          description: ev.description.text?.slice(0, 1000) || undefined,
          college: null,
          event_type: mapCategoryId(ev.category_id),
          location: venue?.name?.trim() || null,
          address: address || null,
          starts_at: new Date(ev.start.utc).toISOString(),
          ends_at: ev.end ? new Date(ev.end.utc).toISOString() : null,
          url: ev.url,
          image_url: ev.logo?.original?.url ?? ev.logo?.url ?? null,
          source: SOURCE,
          source_id: ev.id,
        })
      }

      continuation = data.pagination.continuation
      pageCount++
    } while (continuation && pageCount < MAX_PAGES)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { source: SOURCE, events: [], error: `Eventbrite scraper failed: ${message}` }
  }

  return { source: SOURCE, events }
}
