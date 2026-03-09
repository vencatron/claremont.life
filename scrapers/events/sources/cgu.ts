/**
 * CGU (Claremont Graduate University) Events Scraper
 *
 * CGU uses The Events Calendar WordPress plugin.
 * REST API verified at: https://www.cgu.edu/wp-json/tribe/events/v1/events
 */

import type { ScrapedEvent, ScraperResult } from './types.js'

const SOURCE = 'cgu_calendar'
const API_BASE = 'https://www.cgu.edu/wp-json/tribe/events/v1/events'
const PER_PAGE = 50

interface TribeEvent {
  id: number
  url: string
  title: string
  description: string
  start_date: string
  end_date: string
  all_day: boolean
  image?: { url: string } | false
  venue?: { venue?: string; address?: string; city?: string; state?: string; zip?: string }
  categories?: Array<{ name: string; slug: string }>
}

interface TribeResponse {
  events: TribeEvent[]
  total: number
  total_pages: number
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function mapCategory(cats: TribeEvent['categories']): string | null {
  if (!cats?.length) return null
  const c = cats[0].name.toLowerCase()
  if (c.includes('concert') || c.includes('music') || c.includes('perform')) return 'concert'
  if (c.includes('lecture') || c.includes('talk') || c.includes('colloquium')) return 'lecture'
  if (c.includes('workshop')) return 'workshop'
  if (c.includes('exhibit') || c.includes('art')) return 'exhibition'
  return null
}

export async function scrapeCGU(): Promise<ScraperResult> {
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

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json() as TribeResponse
      if (page === 1) totalPages = data.total_pages ?? 1

      for (const ev of data.events) {
        const venue = ev.venue
        const address = venue
          ? [venue.address, venue.city, venue.state, venue.zip].filter(Boolean).join(', ') || null
          : null

        events.push({
          title: ev.title.trim(),
          description: ev.description ? stripHtml(ev.description).slice(0, 1000) : undefined,
          college: 'CGU',
          event_type: mapCategory(ev.categories),
          location: venue?.venue?.trim() || null,
          address,
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
    return { source: SOURCE, events: [], error: `CGU scraper failed: ${message}` }
  }

  return { source: SOURCE, events }
}
