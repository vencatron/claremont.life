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

export const CLOSING_SOON_MINUTES = 60

export interface OpenStatus {
  /** Same semantics as getOpenNow — 'unknown' when hours are missing/unparseable or now is null. */
  openNow: OpenNowStatus
  /** e.g. '10:00 PM', '2:00 AM', '12:00 AM Sun'. null when closed, unknown, or open 24/7. */
  closesAtLabel: string | null
  /** Whole minutes until the containing (chained) range ends. null when closed, unknown, or open 24/7. */
  minutesUntilClose: number | null
  /** e.g. '11:00 AM', '5:00 PM', '11:00 AM tomorrow', '11:00 AM Mon'. null when open or unknown, or when no future opening exists in the parsed week. */
  opensNextLabel: string | null
  /** openNow === true && minutesUntilClose !== null && minutesUntilClose <= CLOSING_SOON_MINUTES */
  isClosingSoon: boolean
}

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
  openStatus: OpenStatus
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
  openStatus: OpenStatus
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
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const WEEK_MINUTES = 7 * 1440
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

function toWeekInterval(range: HoursRange): { start: number; end: number } {
  const start = range.startDay * 1440 + range.startMinute
  const end = range.endDay * 1440 + range.endMinute // endDay may be startDay + 1; Saturday overnight yields end > WEEK_MINUTES
  return { start, end }
}

/** 12h clock, matching Google's own hour strings: 0 → '12:00 AM', 570 → '9:30 AM', 1290 → '9:30 PM'. */
function formatMinuteOfDay(minuteOfDay: number): string {
  const m = ((minuteOfDay % 1440) + 1440) % 1440
  const hour24 = Math.floor(m / 60)
  const minute = m % 60
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`
}

/**
 * Formats an absolute minute-of-week with a day qualifier relative to nowWeekday:
 * same calendar day → '10:00 PM'; day offset 1 → '11:00 AM tomorrow';
 * offset 2–6 → '11:00 AM Mon'.
 */
function formatWeekMinuteLabel(weekMinute: number, nowWeekday: number): string {
  const day = Math.floor((((weekMinute % WEEK_MINUTES) + WEEK_MINUTES) % WEEK_MINUTES) / 1440)
  const offset = (day - nowWeekday + 7) % 7
  const time = formatMinuteOfDay(weekMinute % 1440)
  if (offset === 0) return time
  if (offset === 1) return `${time} tomorrow`
  return `${time} ${WEEKDAY_SHORT[day]}`
}

export function getOpenStatus(
  hours: string[] | null | undefined,
  now: Date | null,
  timeZone: string = CLAREMONT_TIME_ZONE,
): OpenStatus {
  const openNow = getOpenNow(hours, now, timeZone)
  const local = now === null ? null : localDateParts(now, timeZone)
  if (openNow === 'unknown' || !local) {
    return { openNow: 'unknown', closesAtLabel: null, minutesUntilClose: null, opensNextLabel: null, isClosingSoon: false }
  }

  const intervals = parseHours(hours).ranges.map(toWeekInterval)
  const t = local.weekday * 1440 + local.minuteOfDay

  if (openNow === true) {
    const containing = intervals.find(({ start, end }) => (start <= t && t < end) || (end > WEEK_MINUTES && t < end - WEEK_MINUTES))
    if (!containing) {
      return { openNow, closesAtLabel: null, minutesUntilClose: null, opensNextLabel: null, isClosingSoon: false }
    }

    let end = containing.end
    let covered = containing.end - containing.start
    while (covered < WEEK_MINUTES) {
      const next = intervals.find((interval) => interval.start === end % WEEK_MINUTES)
      if (!next) break
      covered += next.end - next.start
      end += next.end - next.start
    }

    if (covered >= WEEK_MINUTES) {
      // Open 24/7 — no closing time to count down to.
      return { openNow, closesAtLabel: null, minutesUntilClose: null, opensNextLabel: null, isClosingSoon: false }
    }

    let minutesUntilClose = (end - t) % WEEK_MINUTES
    if (minutesUntilClose <= 0) minutesUntilClose += WEEK_MINUTES
    // Close labels within 24h stay bare ('2:00 AM', never '2:00 AM tomorrow'); rarer >24h chained spans get a day qualifier.
    const closesAtLabel = minutesUntilClose <= 1440
      ? formatMinuteOfDay(end % 1440)
      : formatWeekMinuteLabel(end, local.weekday)

    return {
      openNow,
      closesAtLabel,
      minutesUntilClose,
      opensNextLabel: null,
      isClosingSoon: minutesUntilClose <= CLOSING_SOON_MINUTES,
    }
  }

  let opensNextLabel: string | null = null
  let bestDelta = Number.POSITIVE_INFINITY
  for (const { start } of intervals) {
    const delta = ((start % WEEK_MINUTES) - t + WEEK_MINUTES) % WEEK_MINUTES
    if (delta > 0 && delta < bestDelta) {
      bestDelta = delta
      opensNextLabel = formatWeekMinuteLabel(start % WEEK_MINUTES, local.weekday)
    }
  }

  return { openNow, closesAtLabel: null, minutesUntilClose: null, opensNextLabel, isClosingSoon: false }
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

function studentDetails(place: EatPlace, tagIds: StudentEatTagId[], openStatus: OpenStatus): string[] {
  const details: string[] = []
  if (openStatus.openNow === true) {
    details.push(openStatus.closesAtLabel ? `Open · closes ${openStatus.closesAtLabel}` : 'Open now')
  } else if (openStatus.openNow === false) {
    details.push(openStatus.opensNextLabel ? `Closed · opens ${openStatus.opensNextLabel}` : 'Closed now')
  }

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
  const openStatus = getOpenStatus(place.hours, now, timeZone)
  const openNow = openStatus.openNow
  const openLate = closesLate(place.hours)
  const tagIds = inferTagIds(place, openNow, openLate)
  const tags = tagIds.map((id) => ({ id, label: TAG_LABELS[id] }))

  return {
    tags,
    tagIds,
    details: studentDetails(place, tagIds, openStatus),
    openNow,
    openLate,
    openStatus,
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
    openStatus: metadata.openStatus,
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

/**
 * Stable sort for open-now / open-late result lists: open places with the most
 * time left first (open-24/7 = Infinity, so they lead), places closing soonest
 * last among open ones, closed/unknown places after all open ones (key -1).
 * Ties preserve the incoming order (server-side rating desc). Does not mutate.
 */
export function sortStudentEatPlacesByClosingTime(
  places: EatPlace[],
  options: InferStudentEatOptions = {},
): EatPlace[] {
  const { now = new Date(), timeZone = CLAREMONT_TIME_ZONE } = options
  const key = (place: EatPlace): number => {
    const status = getOpenStatus(place.hours, now, timeZone)
    if (status.openNow !== true) return -1
    return status.minutesUntilClose ?? Number.POSITIVE_INFINITY
  }
  return places
    .map((place, index) => ({ place, k: key(place), index }))
    .sort((a, b) => (b.k === a.k ? a.index - b.index : b.k > a.k ? 1 : -1))
    .map((entry) => entry.place)
}
