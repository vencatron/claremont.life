/**
 * The Claremont Colleges events calendar source.
 *
 * User-facing page: https://claremont.edu/events/
 * Data endpoint exposed by The Events Calendar plugin:
 *   https://claremont.edu/wp-json/tribe/events/v1/events
 */

import type { ScrapedEvent, ScraperResult } from './types'

export const SOURCE = 'claremont_edu_events'
export const CLAREMONT_EVENTS_API_URL = 'https://claremont.edu/wp-json/tribe/events/v1/events'

const PAGE_SIZE = 100
const MAX_PAGES = 12
const DEFAULT_TIMEZONE = 'America/Los_Angeles'

interface ClaremontOrganizer {
  organizer?: string | null
}

interface ClaremontCategory {
  name?: string | null
}

interface ClaremontVenue {
  venue?: string | null
  address?: string | null
}

interface ClaremontImage {
  url?: string | null
}

interface ClaremontApiEvent {
  id?: string | number | null
  title?: string | null
  description?: string | null
  excerpt?: string | null
  start_date?: string | null
  end_date?: string | null
  url?: string | null
  website?: string | null
  timezone?: string | null
  image?: false | ClaremontImage | null
  categories?: ClaremontCategory[] | null
  organizer?: ClaremontOrganizer[] | null
  venue?: [] | ClaremontVenue | null
}

interface ClaremontApiResponse {
  events?: ClaremontApiEvent[]
  total_pages?: number
  next_rest_url?: string | null
}

function decodeHtml(input: string): string {
  return input
    .replace(/&#(x?[0-9a-f]+);/gi, (_match, code: string) => {
      const value = code.toLowerCase().startsWith('x')
        ? Number.parseInt(code.slice(1), 16)
        : Number.parseInt(code, 10)
      return Number.isFinite(value) ? String.fromCodePoint(value) : ''
    })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function cleanText(input: string | null | undefined): string {
  if (!input) return ''
  return decodeHtml(input)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseLocalDateParts(value: string): [number, number, number, number, number, number] | null {
  const match = value.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i
  )
  if (!match) return null

  const [, year, month, day, rawHour, minute, second = '0', meridiem] = match
  let hour = Number(rawHour)
  if (meridiem) {
    const marker = meridiem.toLowerCase()
    if (marker === 'pm' && hour < 12) hour += 12
    if (marker === 'am' && hour === 12) hour = 0
  }

  return [Number(year), Number(month), Number(day), hour, Number(minute), Number(second)]
}

function getTimeZoneParts(date: Date, timeZone: string): [number, number, number, number, number, number] {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return [
    Number(byType.year),
    Number(byType.month),
    Number(byType.day),
    Number(byType.hour),
    Number(byType.minute),
    Number(byType.second),
  ]
}

export function claremontLocalDateToIso(value: string | null | undefined, timeZone = DEFAULT_TIMEZONE): string | null {
  if (!value) return null
  const parsed = parseLocalDateParts(value)
  if (!parsed) {
    const fallback = new Date(value)
    return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString()
  }

  const [year, month, day, hour, minute, second] = parsed
  const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, second)
  const initial = new Date(desiredAsUtc)
  const [zoneYear, zoneMonth, zoneDay, zoneHour, zoneMinute, zoneSecond] = getTimeZoneParts(initial, timeZone)
  const zoneAsUtc = Date.UTC(zoneYear, zoneMonth - 1, zoneDay, zoneHour, zoneMinute, zoneSecond)
  const offset = zoneAsUtc - desiredAsUtc

  return new Date(desiredAsUtc - offset).toISOString()
}

export function mapOrganizerToCollege(organizers: ClaremontOrganizer[] | null | undefined): string | null {
  const names = (organizers ?? []).map((org) => org.organizer?.toLowerCase() ?? '').join(' | ')
  if (!names) return null

  if (names.includes('pomona')) return 'Pomona'
  if (names.includes('claremont mckenna') || names.includes('cmc')) return 'CMC'
  if (names.includes('harvey mudd') || names.includes('mudd')) return 'Harvey Mudd'
  if (names.includes('scripps')) return 'Scripps'
  if (names.includes('pitzer')) return 'Pitzer'
  if (names.includes('claremont graduate') || names.includes('cgu')) return 'CGU'
  if (names.includes('keck graduate') || names.includes('kgi')) return 'KGI'

  return null
}

function venueName(venue: ClaremontApiEvent['venue']): string | null {
  if (!venue || Array.isArray(venue)) return null
  return cleanText(venue.venue) || null
}

function venueAddress(venue: ClaremontApiEvent['venue']): string | null {
  if (!venue || Array.isArray(venue)) return null
  return cleanText(venue.address) || null
}

function imageUrl(image: ClaremontApiEvent['image']): string | null {
  if (!image) return null
  return image.url ?? null
}

export function mapClaremontApiEvent(event: ClaremontApiEvent): ScrapedEvent | null {
  if (!event.id || !event.title || !event.start_date) return null

  const startsAt = claremontLocalDateToIso(event.start_date, event.timezone ?? DEFAULT_TIMEZONE)
  if (!startsAt) return null

  const description = cleanText(event.description) || cleanText(event.excerpt)
  const category = event.categories?.find((cat) => cleanText(cat.name))?.name
  const eventType = cleanText(category).toLowerCase() || null

  return {
    title: cleanText(event.title),
    description: description ? description.slice(0, 1000) : undefined,
    college: mapOrganizerToCollege(event.organizer),
    event_type: eventType,
    location: venueName(event.venue),
    address: venueAddress(event.venue),
    starts_at: startsAt,
    ends_at: claremontLocalDateToIso(event.end_date, event.timezone ?? DEFAULT_TIMEZONE),
    url: event.url ?? event.website ?? null,
    image_url: imageUrl(event.image),
    source: SOURCE,
    source_id: String(event.id),
  }
}

export async function scrapeClaremontEvents(): Promise<ScraperResult> {
  const events: ScrapedEvent[] = []

  try {
    const startDate = new Date().toISOString().slice(0, 10)
    let nextUrl: string | null = `${CLAREMONT_EVENTS_API_URL}?per_page=${PAGE_SIZE}&start_date=${startDate}`
    let page = 0

    while (nextUrl && page < MAX_PAGES) {
      const res = await fetch(nextUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ClaremontLifeBot/1.0 (+https://claremont.life)',
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status} from ${nextUrl}`)

      const data = await res.json() as ClaremontApiResponse
      for (const apiEvent of data.events ?? []) {
        const mapped = mapClaremontApiEvent(apiEvent)
        if (mapped) events.push(mapped)
      }

      page += 1
      nextUrl = data.next_rest_url ?? null
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { source: SOURCE, events: [], error: `claremont.edu events scraper failed: ${message}` }
  }

  return { source: SOURCE, events }
}
