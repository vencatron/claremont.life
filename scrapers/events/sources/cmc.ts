/**
 * CMC (Claremont McKenna College) Events Scraper
 *
 * CMC uses the Localist platform at https://campusevents.cmc.edu
 * Localist has a well-documented JSON API:
 *   GET /api/2/events?pp=100&days=90
 *
 * Docs: https://help.localist.com/article/show/65027-api-documentation
 */

import type { ScrapedEvent, ScraperResult } from './types'

const SOURCE = 'cmc_calendar'
const BASE_URL = 'https://campusevents.cmc.edu/api/2/events'
const DAYS_AHEAD = 90
const PAGE_SIZE = 100

interface LocalistEventInstance {
  event_instance: {
    id: number
    event_id: number
    start: string
    end: string | null
    all_day: boolean
  }
}

interface LocalistEvent {
  event: {
    id: number
    title: string
    description_text?: string
    description?: string
    url?: string
    location?: string
    location_name?: string
    address?: string
    photo_id?: number | null
    event_instances: LocalistEventInstance[]
    filters?: {
      departments?: Array<{ name: string; id: number }>
      event_types?: Array<{ name: string; id: number }>
    }
    geo?: {
      street?: string
      city?: string
      state?: string
      zip?: string
    }
  }
}

interface LocalistResponse {
  events: LocalistEvent[]
  page: {
    current: number
    size: number
    total: number
  }
}

function mapEventType(filters: LocalistEvent['event']['filters']): string | null {
  const types = filters?.event_types ?? []
  if (!types.length) return null
  const name = types[0].name.toLowerCase()
  if (name.includes('concert') || name.includes('music')) return 'concert'
  if (name.includes('lecture') || name.includes('talk') || name.includes('forum')) return 'lecture'
  if (name.includes('workshop')) return 'workshop'
  if (name.includes('sport') || name.includes('athletic')) return 'sports'
  if (name.includes('social') || name.includes('mixer') || name.includes('reception')) return 'social'
  if (name.includes('exhibit') || name.includes('art')) return 'exhibition'
  return types[0].name.toLowerCase()
}

function buildAddress(geo: LocalistEvent['event']['geo']): string | null {
  if (!geo) return null
  const parts = [geo.street, geo.city, geo.state, geo.zip].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

export async function scrapeCMC(): Promise<ScraperResult> {
  const events: ScrapedEvent[] = []

  try {
    let page = 1
    let totalPages = 1

    do {
      const url = `${BASE_URL}?pp=${PAGE_SIZE}&days=${DAYS_AHEAD}&page=${page}`
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'ClaremontLifeBot/1.0' },
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)

      const data = await res.json() as LocalistResponse

      // Calculate total pages
      if (page === 1) {
        totalPages = data.page.total
      }

      for (const item of data.events) {
        const ev = item.event
        // Expand recurring instances
        for (const inst of ev.event_instances) {
          const instance = inst.event_instance
          events.push({
            title: ev.title.trim(),
            description: ev.description_text?.trim() || undefined,
            college: 'CMC',
            event_type: mapEventType(ev.filters),
            location: ev.location_name?.trim() || ev.location?.trim() || null,
            address: buildAddress(ev.geo) || ev.address?.trim() || null,
            starts_at: new Date(instance.start).toISOString(),
            ends_at: instance.end ? new Date(instance.end).toISOString() : null,
            url: ev.url || null,
            image_url: ev.photo_id
              ? `https://campusevents.cmc.edu/api/2/photos/${ev.photo_id}`
              : null,
            source: SOURCE,
            source_id: String(instance.id),
          })
        }
      }

      page++
    } while (page <= totalPages)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { source: SOURCE, events: [], error: `CMC scraper failed: ${message}` }
  }

  return { source: SOURCE, events }
}
