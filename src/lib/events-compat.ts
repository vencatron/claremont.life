import type { ClaremontEvent } from '../types'
import { COLLEGES } from './constants'

interface MissingColumnLike {
  code?: string | null
  message?: string | null
}

interface ScrapedEventLike {
  title: string
  description?: string | null
  college?: string | null
  event_type?: string | null
  location?: string | null
  address?: string | null
  starts_at: string
  ends_at?: string | null
  url?: string | null
  image_url?: string | null
  source: string
  source_id: string
}

interface EventRowLike {
  id: string
  source: string
  source_id: string
  title: string
  description?: string | null
  url?: string | null
  starts_at?: string | null
  ends_at?: string | null
  start_date?: string | null
  end_date?: string | null
  college?: string | null
  event_type?: string | null
  category?: string | null
  location?: string | null
  address?: string | null
  image_url?: string | null
  is_active?: boolean | null
}

export function isMissingColumnError(error: MissingColumnLike | null | undefined): boolean {
  if (!error) return false
  if (error.code === '42703' || error.code === 'PGRST204') return true
  return /column .* does not exist|could not find .* column/i.test(error.message ?? '')
}

const LEGACY_COLLEGE_CATEGORIES = new Set<string>(COLLEGES.filter((college) => college !== 'All'))

function legacyCategoryCollege(category: string | null | undefined): string | null {
  if (!category) return null
  return LEGACY_COLLEGE_CATEGORIES.has(category) ? category : null
}

export function normalizeEventRow(row: EventRowLike): ClaremontEvent {
  const legacyCollege = legacyCategoryCollege(row.category)

  return {
    id: row.id,
    source: row.source,
    source_id: row.source_id,
    title: row.title,
    description: row.description ?? null,
    url: row.url ?? null,
    starts_at: row.starts_at ?? row.start_date ?? '',
    ends_at: row.ends_at ?? row.end_date ?? null,
    college: row.college ?? legacyCollege,
    event_type: row.event_type ?? (legacyCollege ? null : row.category ?? null),
    location: row.location ?? null,
    address: row.address ?? null,
    image_url: row.image_url ?? null,
    is_active: row.is_active ?? true,
  }
}

export function toModernEventRow(ev: ScrapedEventLike) {
  return {
    title: ev.title,
    description: ev.description ?? null,
    college: ev.college ?? null,
    event_type: ev.event_type ?? null,
    location: ev.location ?? null,
    address: ev.address ?? null,
    starts_at: ev.starts_at,
    ends_at: ev.ends_at ?? null,
    url: ev.url ?? null,
    image_url: ev.image_url ?? null,
    source: ev.source,
    source_id: ev.source_id,
    is_active: true,
  }
}

export function toLegacyEventRow(ev: ScrapedEventLike) {
  return {
    title: ev.title,
    description: ev.description ?? null,
    location: ev.location ?? null,
    category: ev.college ?? ev.event_type ?? null,
    start_date: ev.starts_at,
    end_date: ev.ends_at ?? null,
    url: ev.url ?? null,
    image_url: ev.image_url ?? null,
    source: ev.source,
    source_id: ev.source_id,
  }
}
