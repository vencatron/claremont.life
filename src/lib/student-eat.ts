import type { EatPlace } from '../types'

export const CLAREMONT_TIME_ZONE = 'America/Los_Angeles'

export const STUDENT_EAT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open-now', label: 'Open now' },
  { id: 'open-late', label: 'Open late' },
  { id: 'under-10', label: 'Under $10' },
  { id: 'study-spot', label: 'Study spot' },
  { id: 'date-spot', label: 'Date spot' },
  { id: 'parents-visiting', label: 'Parents visiting' },
  { id: 'group-friendly', label: 'Group-friendly' },
  { id: 'boba-coffee', label: 'Boba/coffee' },
  { id: 'walkable', label: 'Walkable' },
  { id: 'student-discount', label: 'Student discount' },
  { id: 'worth-it', label: 'Actually worth it' },
] as const

export type StudentEatFilterId = (typeof STUDENT_EAT_FILTERS)[number]['id']
export type StudentEatTagId = Exclude<StudentEatFilterId, 'all'>
export type OpenNowStatus = boolean | 'unknown'

export interface StudentEatTag {
  id: StudentEatTagId
  label: string
}

export interface StudentEatMetadata {
  tags: StudentEatTag[]
  tagIds: StudentEatTagId[]
  details: string[]
  openNow: OpenNowStatus
  openLate: boolean
  safeWebsiteUrl: string | null
  safeMapsUrl: string | null
}

export interface InferStudentEatOptions {
  now?: Date | null
  timeZone?: string
}

export interface StudentEatFilterOptions extends InferStudentEatOptions {
  studentFilter?: StudentEatFilterId
  search?: string
}

export interface StudentEatPlaceCardModel {
  metadata: StudentEatMetadata
  displayType: string
  tags: StudentEatTag[]
  details: string[]
  safeWebsiteUrl: string | null
  safeMapsUrl: string | null
}

const TAG_LABELS: Record<StudentEatTagId, string> = {
  'open-now': 'Open now',
  'open-late': 'Open late',
  'under-10': 'Under $10',
  'study-spot': 'Study spot',
  'date-spot': 'Date spot',
  'parents-visiting': 'Parents visiting',
  'group-friendly': 'Group-friendly',
  'boba-coffee': 'Boba/coffee',
  walkable: 'Walkable',
  'student-discount': 'Student discount',
  'worth-it': 'Actually worth it',
}

const TAG_ORDER: StudentEatTagId[] = STUDENT_EAT_FILTERS
  .map((filter) => filter.id)
  .filter((id): id is StudentEatTagId => id !== 'all')

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const WEEKDAY_LOOKUP = new Map(WEEKDAYS.map((day, index) => [day.toLowerCase(), index]))
const CLAREMONT_COLLEGES_CENTER = { lat: 34.1017, lng: -117.7129 }
const WALKABLE_MILES = 2.25

const STUDENT_OVERRIDES: Record<string, Partial<Record<StudentEatTagId, boolean>> & { details?: string[] }> = {
  // Keep this intentionally tiny and non-authoritative: inference should still work without it.
  'i like pie bakeshop': { 'date-spot': true, 'parents-visiting': true, 'worth-it': true },
  'some crust bakery': { 'parents-visiting': true, 'worth-it': true },
  'nosy neighbors coffee': { 'study-spot': true, 'boba-coffee': true },
}

interface HoursRange {
  startDay: number
  startMinute: number
  endDay: number
  endMinute: number
}

interface HoursParseResult {
  ranges: HoursRange[]
  knownDays: Set<number>
}

function normalized(value: string | null | undefined): string {
  return (value ?? '')
    .toLocaleLowerCase('en-US')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function placeText(place: EatPlace): string {
  return [
    place.name,
    place.address,
    place.primary_type,
    ...(place.types ?? []),
    place.editorial_summary,
  ]
    .map((value) => normalized(value))
    .filter(Boolean)
    .join(' ')
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text))
}

function isFiniteCoordinate(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const earthRadiusMiles = 3958.8
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng
  return 2 * earthRadiusMiles * Math.asin(Math.min(1, Math.sqrt(h)))
}

function localDateParts(date: Date, timeZone: string): { weekday: number; minuteOfDay: number } | null {
  if (Number.isNaN(date.getTime())) return null

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  const weekday = WEEKDAY_LOOKUP.get(value('weekday').toLowerCase())
  const hour = Number(value('hour'))
  const minute = Number(value('minute'))

  if (weekday === undefined || Number.isNaN(hour) || Number.isNaN(minute)) return null
  return { weekday, minuteOfDay: hour * 60 + minute }
}

function parseTime(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i)
  if (!match) return null

  let hour = Number(match[1])
  const minute = Number(match[2] ?? '0')
  const period = match[3].toUpperCase()
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null
  if (period === 'AM') {
    if (hour === 12) hour = 0
  } else if (hour !== 12) {
    hour += 12
  }
  return hour * 60 + minute
}

function parseHours(hours: string[] | null | undefined): HoursParseResult {
  const result: HoursParseResult = { ranges: [], knownDays: new Set<number>() }
  if (!hours || hours.length === 0) return result

  for (const rawLine of hours) {
    const line = rawLine.replace(/\u202f/g, ' ').replace(/\s+/g, ' ').trim()
    const dayMatch = line.match(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday):\s*(.+)$/i)
    if (!dayMatch) continue

    const day = WEEKDAY_LOOKUP.get(dayMatch[1].toLowerCase())
    if (day === undefined) continue

    result.knownDays.add(day)
    const body = dayMatch[2].trim()
    if (/^closed$/i.test(body)) continue

    if (/open 24 hours|24 hours/i.test(body)) {
      result.ranges.push({ startDay: day, startMinute: 0, endDay: day + 1, endMinute: 0 })
      continue
    }

    const segments = body.split(/,|;/)
    for (const segment of segments) {
      const rangeMatch = segment.trim().match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*(?:–|—|-|to)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i)
      if (!rangeMatch) continue

      const startMinute = parseTime(rangeMatch[1])
      const endMinute = parseTime(rangeMatch[2])
      if (startMinute === null || endMinute === null) continue

      result.ranges.push({
        startDay: day,
        startMinute,
        endDay: endMinute <= startMinute ? day + 1 : day,
        endMinute,
      })
    }
  }

  return result
}

function rangeContains(range: HoursRange, weekday: number, minuteOfDay: number): boolean {
  const startDay = range.startDay % 7
  const endDay = range.endDay % 7

  if (range.endDay === range.startDay) {
    return weekday === startDay && minuteOfDay >= range.startMinute && minuteOfDay < range.endMinute
  }

  return (
    (weekday === startDay && minuteOfDay >= range.startMinute) ||
    (weekday === endDay && minuteOfDay < range.endMinute)
  )
}

function getOpenNow(hours: string[] | null | undefined, now: Date | null, timeZone: string): OpenNowStatus {
  if (now === null) return 'unknown'

  const parsed = parseHours(hours)
  if (parsed.knownDays.size === 0) return 'unknown'

  const local = localDateParts(now, timeZone)
  if (!local) return 'unknown'

  if (parsed.ranges.some((range) => rangeContains(range, local.weekday, local.minuteOfDay))) {
    return true
  }

  const previousDay = (local.weekday + 6) % 7
  const hasRelevantDay = parsed.knownDays.has(local.weekday) || parsed.ranges.some((range) => range.startDay % 7 === previousDay && range.endDay !== range.startDay)

  return hasRelevantDay ? false : 'unknown'
}

function closesLate(hours: string[] | null | undefined): boolean {
  const parsed = parseHours(hours)
  return parsed.ranges.some((range) => range.endDay !== range.startDay || range.endMinute >= 23 * 60)
}

export function isSafeExternalUrl(value: string | null | undefined): value is string {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function addTag(tags: Set<StudentEatTagId>, id: StudentEatTagId, enabled: boolean): void {
  if (enabled) tags.add(id)
}

function overrideFor(place: EatPlace) {
  return STUDENT_OVERRIDES[normalized(place.name)]
}

function formatDisplayType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function inferTagIds(place: EatPlace, openNow: OpenNowStatus, openLate: boolean): StudentEatTagId[] {
  const text = placeText(place)
  const tags = new Set<StudentEatTagId>()
  const priceLevel = place.price_level
  const rating = place.rating
  const ratingCount = place.rating_count

  addTag(tags, 'open-now', openNow === true)
  addTag(tags, 'open-late', openLate)
  addTag(tags, 'under-10', priceLevel === 1 || hasAny(text, [/\bunder \$?10\b/i, /\bcheap\b/i, /\bbudget\b/i, /\bvalue menu\b/i]))
  addTag(tags, 'study-spot', hasAny(text, [/\bstudy\b/i, /\bquiet\b/i, /\bwifi\b/i, /\bwi fi\b/i, /\bwork\b/i, /\blaptop/i]) && hasAny(text, [/\bcafe\b/i, /\bcoffee\b/i, /\btea\b/i, /\bbakery\b/i]))
  addTag(tags, 'date-spot', hasAny(text, [/\bdate night\b/i, /\bromantic\b/i, /\bcozy\b/i, /\bwine\b/i, /\bcocktail\b/i, /\btapas\b/i]))
  addTag(tags, 'parents-visiting', hasAny(text, [/\bparents?\b/i, /\bvisiting family\b/i, /\bupscale\b/i, /\bfine dining\b/i, /\bbrunch\b/i]) || (priceLevel !== null && priceLevel >= 3 && rating !== null && rating >= 4.2))
  addTag(tags, 'group-friendly', hasAny(text, [/\bgroup/i, /\blarge parties\b/i, /\blarge tables\b/i, /\bshared tables\b/i, /\bfamily style\b/i, /\bpizza\b/i, /\bbrewery\b/i, /\bbeer garden\b/i]))
  addTag(tags, 'boba-coffee', hasAny(text, [/\bboba\b/i, /\bbubble tea\b/i, /\bcoffee\b/i, /\bcafe\b/i, /\btea house\b/i, /\btea store\b/i]))
  addTag(tags, 'walkable', isFiniteCoordinate(place.lat) && isFiniteCoordinate(place.lng) && milesBetween(CLAREMONT_COLLEGES_CENTER, { lat: place.lat, lng: place.lng }) <= WALKABLE_MILES)
  addTag(tags, 'student-discount', hasAny(text, [/\bstudent discount\b/i, /\bcollege id\b/i, /\b5c discount\b/i, /\bstudent id\b/i]))
  addTag(tags, 'worth-it', hasAny(text, [/\bworth it\b/i, /\bactually worth\b/i]) || (rating !== null && rating >= 4.5 && ratingCount !== null && ratingCount >= 100))

  const override = overrideFor(place)
  if (override) {
    for (const id of TAG_ORDER) addTag(tags, id, override[id] === true)
  }

  return TAG_ORDER.filter((id) => tags.has(id))
}

function studentDetails(place: EatPlace, tagIds: StudentEatTagId[], openNow: OpenNowStatus): string[] {
  const details: string[] = []
  if (openNow === true) details.push('Open now')
  else if (openNow === false) details.push('Closed now')

  if (tagIds.includes('under-10')) details.push('Good cheap option')
  if (tagIds.includes('study-spot')) details.push('Works for studying')
  if (tagIds.includes('group-friendly')) details.push('Easy for groups')
  if (tagIds.includes('student-discount')) details.push('Ask for the student discount')
  if (tagIds.includes('walkable')) details.push('Walkable from campus')
  if (place.rating !== null && place.rating_count !== null && place.rating_count > 0) {
    details.push(`${place.rating.toFixed(1)} stars from ${place.rating_count.toLocaleString('en-US')} reviews`)
  }

  const override = overrideFor(place)
  if (override?.details) details.push(...override.details)

  return [...new Set(details)].slice(0, 4)
}

export function inferStudentEatMetadata(place: EatPlace, options: InferStudentEatOptions = {}): StudentEatMetadata {
  const { now = new Date(), timeZone = CLAREMONT_TIME_ZONE } = options
  const openNow = getOpenNow(place.hours, now, timeZone)
  const openLate = closesLate(place.hours)
  const tagIds = inferTagIds(place, openNow, openLate)
  const tags = tagIds.map((id) => ({ id, label: TAG_LABELS[id] }))

  return {
    tags,
    tagIds,
    details: studentDetails(place, tagIds, openNow),
    openNow,
    openLate,
    safeWebsiteUrl: isSafeExternalUrl(place.website) ? place.website : null,
    safeMapsUrl: isSafeExternalUrl(place.google_maps_url) ? place.google_maps_url : null,
  }
}

export function buildStudentEatPlaceCardModel(place: EatPlace, options: InferStudentEatOptions = {}): StudentEatPlaceCardModel {
  const metadata = inferStudentEatMetadata(place, options)

  return {
    metadata,
    displayType: formatDisplayType(place.primary_type || place.types?.[0] || 'restaurant'),
    tags: metadata.tags,
    details: metadata.details,
    safeWebsiteUrl: metadata.safeWebsiteUrl,
    safeMapsUrl: metadata.safeMapsUrl,
  }
}

export function matchesStudentEatSearch(place: EatPlace, query: string | null | undefined, metadata = inferStudentEatMetadata(place)): boolean {
  const needle = normalized(query)
  if (!needle) return true

  const text = [
    placeText(place),
    metadata.tags.map((tag) => tag.label).join(' '),
    metadata.details.join(' '),
  ]
    .map((value) => normalized(value))
    .filter(Boolean)
    .join(' ')

  return text.includes(needle)
}

export function appliesStudentEatFilter(place: EatPlace, filter: StudentEatFilterId, metadata = inferStudentEatMetadata(place)): boolean {
  if (filter === 'all') return true
  if (filter === 'open-now') return metadata.openNow === true
  return metadata.tagIds.includes(filter)
}

export function filterStudentEatPlaces(places: EatPlace[], options: StudentEatFilterOptions = {}): EatPlace[] {
  const {
    studentFilter = 'all',
    search = '',
    now = new Date(),
    timeZone = CLAREMONT_TIME_ZONE,
  } = options

  return places.filter((place) => {
    const metadata = inferStudentEatMetadata(place, { now, timeZone })
    return appliesStudentEatFilter(place, studentFilter, metadata) && matchesStudentEatSearch(place, search, metadata)
  })
}
