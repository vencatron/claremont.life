/**
 * Scripps College Events Scraper
 *
 * Scripps runs a WordPress site at https://www.scrippscollege.edu/events/
 * using The Events Calendar plugin by Tribe.
 *
 * The plugin exposes a public REST API:
 *   GET /wp-json/tribe/events/v1/events
 *
 * Docs: https://docs.theeventscalendar.com/reference/rest-api/v1/
 *
 * Verified: https://www.scrippscollege.edu/events/wp-json/tribe/events/v1/events
 */

import type { ScrapedEvent, ScraperResult } from './types.js'

const SOURCE = 'scripps_calendar'
const API_BASE = 'https://www.scrippscollege.edu/events/wp-json/tribe/events/v1/events'
const PER_PAGE = 50

interface TribeEventVenue {
  venue?: string
  address?: string
  city?: string
  state?: string
  zip?: string
}

interface TribeEvent {
  id: number
  url: string
  title: string
  description: string
  excerpt: string
  slug: string
  start_date: string    // 'YYYY-MM-DD HH:mm:ss'
  end_date: string
  all_day: boolean
  timezone: string
  image?: { url: string } | false
  venue?: TribeEventVenue
  categories?: Array<{ name: string; slug: string }>
  tags?: Array<{ name: string; slug: string }>
}

interface TribeResponse {
  events: TribeEvent[]
  total: number
  total_pages: number
  next_rest_url?: string
}

function mapTribeCategory(categories: TribeEvent['categories']): string | null {
  if (!categories?.length) return null
  const cat = categories[0].name.toLowerCase()
  if (cat.includes('concert') || cat.includes('music') || cat.includes('perform')) return 'concert'
  if (cat.includes('lecture') || cat.includes('talk') || cat.includes('forum')) return 'lecture'
  if (cat.includes('workshop')) return 'workshop'
  if (cat.includes('sport') || cat.includes('athletic')) return 'sports'
  if (cat.includes('exhibit') || cat.includes('art') || cat.includes('gallery')) return 'exhibition'
  if (cat.includes('social') || cat.includes('reception') || cat.includes('mixer')) return 'social'
  return categories[0].name.toLowerCase()
}

function buildVenueAddress(venue?: TribeEventVenue): string | null {
  if (!venue) return null
  const parts = [venue.address, venue.city, venue.state, venue.zip].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function scrapeScripps(): Promise<ScraperResult> {
  const events: ScrapedEvent[] = []

  try {
    const startDate = new Date().toISOString().split('T')[0]
    let page = 1
    let totalPages = 1

    do {
      const url = `${API_BASE}?per_page=${PER_PAGE}&page=${page}&start_date=${startDate}&status=publish`

      const res = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'ClaremontLifeBot/1.0' },
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)

      const data = await res.json() as TribeResponse

      if (page === 1) totalPages = data.total_pages ?? 1

      for (const ev of data.events) {
        events.push({
          title: ev.title.trim(),
          description: ev.description ? stripHtml(ev.description).slice(0, 1000) : undefined,
          college: 'Scripps',
          event_type: mapTribeCategory(ev.categories),
          location: ev.venue?.venue?.trim() || null,
          address: buildVenueAddress(ev.venue),
          starts_at: new Date(ev.start_date).toISOString(),
          ends_at: ev.end_date ? new Date(ev.end_date).toISOString() : null,
          url: ev.url || null,
          image_url: ev.image && ev.image.url ? ev.image.url : null,
          source: SOURCE,
          source_id: String(ev.id),
        })
      }

      page++
    } while (page <= totalPages)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { source: SOURCE, events: [], error: `Scripps scraper failed: ${message}` }
  }

  return { source: SOURCE, events }
}
