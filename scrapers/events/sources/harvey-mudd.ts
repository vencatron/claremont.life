/**
 * Harvey Mudd College Events Scraper
 *
 * HMC runs a WordPress calendar site at https://www.hmc.edu/calendar/
 * using the Events Manager plugin.
 *
 * The correct RSS feed for events (not posts) is:
 *   GET https://www.hmc.edu/calendar/?post_type=event&feed=rss2
 *
 * Each <item> contains:
 *   - pubDate: the event date as UTC (this IS the event start time)
 *   - description: "{Date} - {time}<br/>{venue}<br/>{address}<br/>{city}"
 *
 * Verified: 20 upcoming events returned as of March 2026.
 */

import type { ScrapedEvent, ScraperResult } from './types'

const SOURCE = 'hmc_calendar'
const RSS_URL = 'https://www.hmc.edu/calendar/?post_type=event&feed=rss2'

function extractText(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))<\\/${tag}>`, 'i')
  const m = xml.match(re)
  if (!m) return null
  return (m[1] ?? m[2] ?? '').trim() || null
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Parse HMC description format:
 * "March 29, 2026 - 7:00 pm–9:00 pm <br/>Shanahan Center <br/>320 E. Foothill Blvd. <br/>Claremont"
 * Returns { location, address }
 */
function parseHMCDescription(raw: string): { location: string | null; address: string | null } {
  // Split on <br/> or <br> tags
  const parts = raw.split(/<br\s*\/?>/i).map((p) => stripHtml(p)).filter(Boolean)
  // parts[0] = "March 29, 2026 - 7:00 pm–9:00 pm"
  // parts[1] = venue name (if present)
  // parts[2] = street address (if present)
  // parts[3] = city (if present)

  if (parts.length <= 1) return { location: null, address: null }

  const venue = parts[1] || null
  const addressParts = parts.slice(2).filter((p) => p && p !== '&nbsp;' && p.trim() !== '')
  const address = addressParts.length ? addressParts.join(', ') : null

  return { location: venue, address }
}

function guessEventType(title: string): string | null {
  const t = title.toLowerCase()
  if (t.includes('concert') || t.includes('recital') || t.includes('music') || t.includes('ensemble')) return 'concert'
  if (t.includes('colloquium') || t.includes('lecture') || t.includes('talk') || t.includes('seminar') || t.includes('speaker')) return 'lecture'
  if (t.includes('workshop') || t.includes('training')) return 'workshop'
  if (t.includes('sport') || t.includes('game') || t.includes('match') || t.includes('clinic')) return 'sports'
  if (t.includes('exhibit') || t.includes('gallery') || t.includes('art')) return 'exhibition'
  if (t.includes('social') || t.includes('mixer') || t.includes('reception') || t.includes('coffee') || t.includes('celebration')) return 'social'
  if (t.includes('office hours')) return 'social'
  return null
}

interface RSSItem {
  title: string
  link: string
  pubDate: string
  description: string
  guid: string
}

function parseRSSItems(rssText: string): RSSItem[] {
  const items: RSSItem[] = []
  const itemBlocks = rssText.split('<item>').slice(1)

  for (const block of itemBlocks) {
    const endIdx = block.indexOf('</item>')
    const itemXml = endIdx >= 0 ? block.slice(0, endIdx) : block

    const title = extractText(itemXml, 'title')
    const link = extractText(itemXml, 'link')
    const pubDate = extractText(itemXml, 'pubDate')
    const description = extractText(itemXml, 'description')
    const guid = extractText(itemXml, 'guid')

    if (!title) continue

    items.push({
      title,
      link: (link ?? guid ?? '').replace(/&amp;/g, '&'),
      pubDate: pubDate ?? '',
      description: description ?? '',
      guid: guid ?? link ?? title,
    })
  }

  return items
}

export async function scrapeHarveyMudd(): Promise<ScraperResult> {
  const events: ScrapedEvent[] = []

  try {
    const res = await fetch(RSS_URL, {
      headers: {
        'User-Agent': 'ClaremontLifeBot/1.0',
        'Accept': 'application/rss+xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const rssText = await res.text()
    const items = parseRSSItems(rssText)

    for (const item of items) {
      // pubDate IS the event start time (UTC) for HMC events
      const startsAt = item.pubDate ? new Date(item.pubDate).toISOString() : null
      if (!startsAt) continue

      const { location, address } = parseHMCDescription(item.description)

      events.push({
        title: item.title.trim(),
        college: 'Harvey Mudd',
        event_type: guessEventType(item.title),
        location,
        address: address ? `${address}, Claremont, CA` : null,
        starts_at: startsAt,
        url: item.link || null,
        source: SOURCE,
        source_id: item.guid || item.link || item.title,
      })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { source: SOURCE, events: [], error: `HMC scraper failed: ${message}` }
  }

  return { source: SOURCE, events }
}
