/**
 * Pitzer College Events Scraper
 *
 * Pitzer runs a Drupal site that exposes events via an XML feed at:
 *   GET https://www.pitzer.edu/events/xml-feed
 *
 * Verified: returns well-formed XML with <events><event>...</event></events>
 *
 * Field mapping (observed from live XML):
 *   id, title, startDateTime, endDateTime, descriptionForPrint,
 *   location, consortiumCategory, tags, imageURL, url, college
 */

import type { ScrapedEvent, ScraperResult } from './types.js'

const SOURCE = 'pitzer_calendar'
const XML_URL = 'https://www.pitzer.edu/events/xml-feed'

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`, 'i')
  const m = xml.match(re)
  if (!m) return null
  const val = (m[1] ?? m[2] ?? '').trim()
  return val || null
}

function htmlDecode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x2013;/g, '\u2013')
    .replace(/&#x2014;/g, '\u2014')
    .replace(/&#x2019;/g, '\u2019')
    .replace(/&#x201C;/g, '\u201C')
    .replace(/&#x201D;/g, '\u201D')
    .replace(/&#\d+;/g, (m) => {
      const code = parseInt(m.slice(2, -1))
      return String.fromCharCode(code)
    })
}

function mapCategory(cat: string | null): string | null {
  if (!cat) return null
  const c = cat.toLowerCase()
  if (c.includes('concert') || c.includes('music') || c.includes('perform')) return 'concert'
  if (c.includes('lecture')) return 'lecture'
  if (c.includes('workshop')) return 'workshop'
  if (c.includes('sport') || c.includes('athletic')) return 'sports'
  if (c.includes('exhibit') || c.includes('art') || c.includes('gallery')) return 'exhibition'
  if (c.includes('live performance')) return 'concert'
  if (c.includes('social') || c.includes('reception')) return 'social'
  if (c.includes('symposium') || c.includes('conference') || c.includes('forum')) return 'lecture'
  if (c.includes('screening')) return 'screening'
  return null
}

export async function scrapePitzer(): Promise<ScraperResult> {
  const events: ScrapedEvent[] = []

  try {
    const res = await fetch(XML_URL, {
      headers: { 'Accept': 'text/xml, application/xml', 'User-Agent': 'ClaremontLifeBot/1.0' },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const xmlText = await res.text()

    // Split on <event> tags
    const eventBlocks = xmlText.split('<event>').slice(1)

    const now = new Date()

    for (const block of eventBlocks) {
      const endIdx = block.indexOf('</event>')
      const eventXml = endIdx >= 0 ? block.slice(0, endIdx) : block

      const id = extractTag(eventXml, 'id')
      const title = extractTag(eventXml, 'title')
      const startDateTimeStr = extractTag(eventXml, 'startDateTime')
      const endDateTimeStr = extractTag(eventXml, 'endDateTime')
      const description = extractTag(eventXml, 'descriptionForPrint')
      const location = extractTag(eventXml, 'location')
      const category = extractTag(eventXml, 'consortiumCategory')
      const imageURL = extractTag(eventXml, 'imageURL')
      const url = extractTag(eventXml, 'url')

      if (!title || !startDateTimeStr) continue

      const startsAt = new Date(startDateTimeStr)
      if (isNaN(startsAt.getTime())) continue

      // Only include upcoming events
      if (startsAt < now) continue

      events.push({
        title: htmlDecode(title.trim()),
        description: description ? htmlDecode(description.trim()) : undefined,
        college: 'Pitzer',
        event_type: mapCategory(category),
        location: location ? htmlDecode(location.trim()) : null,
        starts_at: startsAt.toISOString(),
        ends_at: endDateTimeStr ? new Date(endDateTimeStr).toISOString() : null,
        url: url || null,
        image_url: imageURL || null,
        source: SOURCE,
        source_id: id ?? `pitzer-${startDateTimeStr}-${title.slice(0, 30)}`,
      })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { source: SOURCE, events: [], error: `Pitzer scraper failed: ${message}` }
  }

  return { source: SOURCE, events }
}
