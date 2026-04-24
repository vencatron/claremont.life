/**
 * CampusLabs Engage (Claremont) Events Scraper
 *
 * Claremont uses the CampusLabs Engage platform at https://claremont.campuslabs.com/engage
 * The discovery search endpoint returns approved events across all Claremont campuses:
 *   GET /engage/api/discovery/event/search?take=100&skip=0&orderByField=endsOn&orderByDirection=ascending&status=Approved&endsAfter=<ISO>
 *
 * No auth required. Offset paginated via skip/take.
 */

import type { ScrapedEvent, ScraperResult } from './types'

const SOURCE = 'engage_claremont'
const BASE_URL = 'https://claremont.campuslabs.com/engage/api/discovery/event/search'
const IMAGE_CDN = 'https://se-images.campuslabs.com/clink/images'
const PAGE_SIZE = 100
const MAX_PAGES = 10

interface EngageEvent {
  id: string | number
  name: string
  description?: string | null
  location?: string | null
  startsOn: string
  endsOn?: string | null
  imagePath?: string | null
  theme?: string | null
  categoryNames?: string[] | null
  branchId?: number | null
  organizationName?: string | null
  status: string
}

interface EngageResponse {
  '@odata.count'?: number
  value: EngageEvent[]
}

function stripHtml(input: string | null | undefined): string {
  if (!input) return ''
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function inferCollege(branchId: number | null | undefined, organizationName: string | null | undefined): string | null {
  // Exact branchId mapping first
  switch (branchId) {
    case 383902: return 'CMC'
    case 392462: return 'Harvey Mudd'
    case 384886: return 'Pitzer'
    case 384744: return 'Scripps'
  }

  // Name heuristic on organizationName
  const name = (organizationName ?? '').toLowerCase()
  if (!name) return null
  if (name.includes('(po)') || name.includes('pomona')) return 'Pomona'
  if (name.includes('(cm)') || name.includes('cmc') || name.includes('claremont mckenna')) return 'CMC'
  if (name.includes('(hm)') || name.includes('mudd')) return 'Harvey Mudd'
  if (name.includes('(sc)') || name.includes('(scr)') || name.includes('scripps')) return 'Scripps'
  if (name.includes('(pz)') || name.includes('pitzer')) return 'Pitzer'
  if (name.includes('cgu') || name.includes('claremont graduate')) return 'CGU'
  if (name.includes('kgi') || name.includes('keck graduate')) return 'KGI'
  return null
}

export async function scrapeEngage(): Promise<ScraperResult> {
  const events: ScrapedEvent[] = []

  try {
    const endsAfter = new Date().toISOString()
    let skip = 0
    let page = 0

    while (page < MAX_PAGES) {
      const url = `${BASE_URL}?take=${PAGE_SIZE}&skip=${skip}&orderByField=endsOn&orderByDirection=ascending&status=Approved&endsAfter=${encodeURIComponent(endsAfter)}`
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ClaremontLifeBot/1.0 (+https://claremont.life)',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)

      const data = await res.json() as EngageResponse
      const batch = data.value ?? []

      for (const ev of batch) {
        // Defensive: skip non-approved and invalid records
        if (ev.status !== 'Approved') continue
        if (!ev.id || !ev.name || !ev.startsOn) continue

        const descText = stripHtml(ev.description).slice(0, 1000)
        const locationClean = ev.location?.trim() || null

        events.push({
          title: ev.name.trim(),
          description: descText || undefined,
          college: inferCollege(ev.branchId ?? null, ev.organizationName ?? null),
          event_type: ev.theme?.toLowerCase() ?? ev.categoryNames?.[0]?.toLowerCase() ?? null,
          location: locationClean,
          address: null,
          starts_at: new Date(ev.startsOn).toISOString(),
          ends_at: ev.endsOn ? new Date(ev.endsOn).toISOString() : null,
          url: `https://claremont.campuslabs.com/engage/event/${ev.id}`,
          image_url: ev.imagePath ? `${IMAGE_CDN}/${ev.imagePath}` : null,
          source: SOURCE,
          source_id: String(ev.id),
        })
      }

      page++
      // Stop when we get a short page
      if (batch.length < PAGE_SIZE) break
      skip += PAGE_SIZE
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { source: SOURCE, events: [], error: `Engage scraper failed: ${message}` }
  }

  return { source: SOURCE, events }
}
