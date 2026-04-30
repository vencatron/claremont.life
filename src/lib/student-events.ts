import { COLLEGES, SOURCE_TO_COLLEGE } from './constants'
import type { College } from './constants'
import type { ClaremontEvent } from '../types'

export const CLAREMONT_TIME_ZONE = 'America/Los_Angeles'

export const DISCOVERY_FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'tonight', label: 'Tonight' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'this-weekend', label: 'This Weekend' },
  { id: 'free', label: 'Free' },
  { id: 'food', label: 'Food' },
  { id: 'music', label: 'Music' },
  { id: 'social', label: 'Social' },
  { id: 'talks', label: 'Talks' },
  { id: 'career', label: 'Career' },
  { id: 'off-campus', label: 'Off campus' },
  { id: 'open-to-5c', label: 'Open to 5C' },
] as const

export type StudentEventFilterId = (typeof DISCOVERY_FILTERS)[number]['id']
export type StudentEventCategoryId = Exclude<StudentEventFilterId, 'today' | 'tonight' | 'tomorrow' | 'this-weekend'>

export interface StudentEventBadge {
  label: string
  kind: 'campus' | 'category' | 'signal' | 'time'
}

export interface StudentEventMetadata {
  campus: College
  categories: StudentEventCategoryId[]
  primaryCategory: string | null
  badges: StudentEventBadge[]
  isFree: boolean
  isOpenTo5C: boolean
  needsRsvp: boolean
  isTonight: boolean
  isThisWeekend: boolean
}

export interface StudentEventFilters {
  search?: string
  filters?: StudentEventFilterId[]
  college?: College
  now?: Date
  timeZone?: string
}

const CATEGORY_LABELS: Record<StudentEventCategoryId, string> = {
  free: 'Free',
  food: 'Food',
  music: 'Music',
  social: 'Social',
  talks: 'Talks',
  career: 'Career',
  'off-campus': 'Off campus',
  'open-to-5c': 'Open to 5C',
}

const PRIMARY_CATEGORY_ORDER: StudentEventCategoryId[] = [
  'food',
  'music',
  'social',
  'talks',
  'career',
  'off-campus',
]

const RSVP_RE = /\b(rsvp|register|registration|required registration|tickets?|ticketed|reserve (a )?(seat|spot))\b/i

const CATEGORY_PATTERNS: Record<StudentEventCategoryId, RegExp[]> = {
  free: [
    /\bfree\b/i,
    /\bno charge\b/i,
    /\bcomplimentary\b/i,
    /\bfree admission\b/i,
  ],
  food: [
    /\b(food|pizza|dinner|lunch|breakfast|brunch|snacks?|refreshments?|boba|coffee|tea|donuts?|tacos?|dessert|catered)\b/i,
  ],
  music: [
    /\b(music|concert|orchestra|band|choir|choral|jazz|recital|dj|opera|symphony|album|song|dance performance)\b/i,
  ],
  social: [
    /\b(party|social|mixer|hangout|game night|meet[- ]?up|trivia|dance|festival|club fair|movie night|screening|community night)\b/i,
  ],
  talks: [
    /\b(talk|lecture|speaker|panel|seminar|forum|symposium|colloquium|keynote|conversation|author|book talk|teach-in)\b/i,
  ],
  career: [
    /\b(career|internship|resume|résumé|recruiter|networking|job|jobs|fellowship|graduate school|grad school|alumni|interview|professional)\b/i,
  ],
  'off-campus': [
    /\b(claremont village|the village|downtown claremont|packing house|memorial park|city hall|public library|laemmle|foothill|indian hill|first street|first st\.?|college avenue|college ave\.?)\b/i,
  ],
  'open-to-5c': [
    /\b(open to (all )?(5c|five-college|five college|claremont colleges) students?)\b/i,
    /\b(all (5c|five-college|five college) students?)\b/i,
    /\b(5c community|5c students|the claremont colleges)\b/i,
  ],
}

const OFF_CAMPUS_SOURCES = new Set(['city_claremont', 'eventbrite'])

function isCollege(value: string | null | undefined): value is College {
  return Boolean(value && (COLLEGES as readonly string[]).includes(value))
}

function sourceToWords(source: string | null | undefined): string {
  return (source ?? '').replace(/[_-]+/g, ' ').trim()
}

function normalized(value: string | null | undefined): string {
  return (value ?? '')
    .toLocaleLowerCase('en-US')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function eventSearchText(event: ClaremontEvent): string {
  const campus = getEventCampus(event)
  return [
    event.title,
    event.description,
    event.location,
    event.address,
    event.event_type,
    event.source,
    sourceToWords(event.source),
    campus,
  ]
    .map((value) => normalized(value))
    .filter(Boolean)
    .join(' ')
}

function eventInferenceText(event: ClaremontEvent): string {
  return [
    event.title,
    event.description,
    event.location,
    event.address,
    event.event_type,
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ')
}

export function isValidEventDate(date: Date): boolean {
  return !Number.isNaN(date.getTime())
}

function calendarDateKey(year: number, month: number, day: number): string {
  const date = new Date(Date.UTC(year, month - 1, day))
  const normalizedYear = date.getUTCFullYear()
  const normalizedMonth = String(date.getUTCMonth() + 1).padStart(2, '0')
  const normalizedDay = String(date.getUTCDate()).padStart(2, '0')

  return `${normalizedYear}-${normalizedMonth}-${normalizedDay}`
}

function dateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  const year = Number(value('year'))
  const month = Number(value('month'))
  const day = Number(value('day'))

  return {
    key: calendarDateKey(year, month, day),
    year,
    month,
    day,
    hour: Number(value('hour')),
    weekday: value('weekday'),
  }
}

function localDateKey(date: Date, timeZone: string): string {
  return dateParts(date, timeZone).key
}

function localDateKeyOffset(date: Date, timeZone: string, offsetDays: number): string {
  const { year, month, day } = dateParts(date, timeZone)
  return calendarDateKey(year, month, day + offsetDays)
}

function localHour(date: Date, timeZone: string): number {
  return dateParts(date, timeZone).hour
}

function localWeekdayNumber(date: Date, timeZone: string): number {
  const weekday = dateParts(date, timeZone).weekday
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday)
}

function upcomingWeekendKeys(now: Date, timeZone: string): Set<string> {
  const weekday = localWeekdayNumber(now, timeZone)
  const startOffset = weekday === 0 || weekday === 6 ? 0 : 5 - weekday
  const endOffset = weekday === 0 ? 0 : weekday === 6 ? 1 : 7 - weekday
  const keys = new Set<string>()

  for (let offset = startOffset; offset <= endOffset; offset += 1) {
    keys.add(localDateKeyOffset(now, timeZone, offset))
  }

  return keys
}

function eventDate(event: ClaremontEvent): Date {
  return new Date(event.starts_at)
}

function hasCategory(event: ClaremontEvent, category: StudentEventCategoryId): boolean {
  const text = eventInferenceText(event)

  if (CATEGORY_PATTERNS[category].some((pattern) => pattern.test(text))) {
    return true
  }

  if (category === 'off-campus') {
    return OFF_CAMPUS_SOURCES.has(event.source)
  }

  return false
}

export function getEventCampus(event: ClaremontEvent): College {
  if (isCollege(event.college)) return event.college
  return SOURCE_TO_COLLEGE[event.source] ?? 'Community'
}

export function matchesEventSearch(event: ClaremontEvent, query: string | null | undefined): boolean {
  const needle = normalized(query)
  if (!needle) return true
  return eventSearchText(event).includes(needle)
}

export function appliesStudentEventFilter(
  event: ClaremontEvent,
  filter: StudentEventFilterId,
  now: Date = new Date(),
  timeZone = CLAREMONT_TIME_ZONE,
): boolean {
  if (
    filter !== 'today' &&
    filter !== 'tonight' &&
    filter !== 'tomorrow' &&
    filter !== 'this-weekend'
  ) {
    return hasCategory(event, filter)
  }

  const startsAt = eventDate(event)
  if (!isValidEventDate(startsAt) || !isValidEventDate(now)) return false

  const eventKey = localDateKey(startsAt, timeZone)
  const nowKey = localDateKey(now, timeZone)

  if (filter === 'today') return eventKey === nowKey
  if (filter === 'tonight') return eventKey === nowKey && localHour(startsAt, timeZone) >= 17
  if (filter === 'tomorrow') return eventKey === localDateKeyOffset(now, timeZone, 1)
  if (filter === 'this-weekend') return upcomingWeekendKeys(now, timeZone).has(eventKey)

  return false
}

export function inferStudentEventMetadata(
  event: ClaremontEvent,
  now: Date = new Date(),
  timeZone = CLAREMONT_TIME_ZONE,
): StudentEventMetadata {
  const campus = getEventCampus(event)
  const categories = (Object.keys(CATEGORY_LABELS) as StudentEventCategoryId[]).filter((category) => hasCategory(event, category))
  const primaryCategoryId = PRIMARY_CATEGORY_ORDER.find((category) => categories.includes(category)) ?? null
  const isFree = categories.includes('free')
  const isOpenTo5C = categories.includes('open-to-5c')
  const needsRsvp = RSVP_RE.test(eventInferenceText(event)) || RSVP_RE.test(event.url ?? '')
  const isTonight = appliesStudentEventFilter(event, 'tonight', now, timeZone)
  const isThisWeekend = appliesStudentEventFilter(event, 'this-weekend', now, timeZone)

  const badges: StudentEventBadge[] = [{ label: campus, kind: 'campus' }]

  if (primaryCategoryId) {
    badges.push({ label: CATEGORY_LABELS[primaryCategoryId], kind: 'category' })
  }

  if (isFree) badges.push({ label: 'Free', kind: 'signal' })
  if (isOpenTo5C) badges.push({ label: 'Open to 5C', kind: 'signal' })
  if (needsRsvp) badges.push({ label: 'RSVP', kind: 'signal' })
  if (isTonight) badges.push({ label: 'Tonight', kind: 'time' })
  else if (isThisWeekend) badges.push({ label: 'This weekend', kind: 'time' })

  return {
    campus,
    categories,
    primaryCategory: primaryCategoryId ? CATEGORY_LABELS[primaryCategoryId] : null,
    badges,
    isFree,
    isOpenTo5C,
    needsRsvp,
    isTonight,
    isThisWeekend,
  }
}

export function filterStudentEvents(events: ClaremontEvent[], options: StudentEventFilters = {}): ClaremontEvent[] {
  const {
    search = '',
    filters = [],
    college = 'All',
    now = new Date(),
    timeZone = CLAREMONT_TIME_ZONE,
  } = options

  return events.filter((event) => {
    if (college !== 'All' && getEventCampus(event) !== college) return false
    if (!matchesEventSearch(event, search)) return false
    return filters.every((filter) => appliesStudentEventFilter(event, filter, now, timeZone))
  })
}
