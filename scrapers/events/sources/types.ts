/**
 * Shared types for event scrapers
 */

export interface ScrapedEvent {
  title: string
  description?: string
  college?: string | null      // 'Pomona' | 'CMC' | 'Harvey Mudd' | 'Scripps' | 'Pitzer' | 'CGU' | 'KGI' | null
  event_type?: string | null   // 'lecture' | 'concert' | 'sports' | 'social' | 'workshop' | ...
  location?: string | null
  address?: string | null
  starts_at: string            // ISO 8601
  ends_at?: string | null      // ISO 8601
  url?: string | null
  image_url?: string | null
  source: string               // e.g. 'pomona_calendar'
  source_id: string            // unique ID within that source for deduplication
}

export interface ScraperResult {
  source: string
  events: ScrapedEvent[]
  error?: string
}
