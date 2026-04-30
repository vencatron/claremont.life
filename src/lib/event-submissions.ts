export type EventSubmissionStatus = 'pending'

export interface EventSubmissionRecord {
  title: string
  startsAt: string
  location: string
  campusOrOrg: string
  audience: string
  submitterEmail: string
  eventUrl: string | null
  foodFreeCost: string | null
  notes: string | null
  status: EventSubmissionStatus
  isVerified: false
}

export interface EventSubmissionInsertRow {
  title: string
  starts_at: string
  location: string
  campus_or_org: string
  audience: string
  event_url: string | null
  food_free_cost: string | null
  notes: string | null
  submitter_email: string
  status: EventSubmissionStatus
  is_verified: false
}

export interface EventSubmissionValidationError {
  ok: false
  errors: Record<string, string>
}

export interface EventSubmissionValidationSuccess {
  ok: true
  value: EventSubmissionRecord
}

export type EventSubmissionValidationResult =
  | EventSubmissionValidationSuccess
  | EventSubmissionValidationError

const EMAIL_MAX_LEN = 254
const EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/
const CLAREMONT_TIME_ZONE = 'America/Los_Angeles'
const DATETIME_LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

const TEXT_LIMITS = {
  title: 140,
  location: 160,
  campusOrOrg: 120,
  audience: 120,
  foodFreeCost: 160,
  notes: 800,
}

function stringValue(raw: unknown): string | null {
  return typeof raw === 'string' ? raw : null
}

function cleanText(raw: unknown, maxLength: number): string | null {
  const value = stringValue(raw)
  if (value === null) return null

  const cleaned = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
    .trim()

  return cleaned.length > 0 ? cleaned : null
}

function cleanEmail(raw: unknown): string | null {
  const value = stringValue(raw)
  if (value === null) return null

  const cleaned = value.trim().toLowerCase()
  if (cleaned.length === 0 || cleaned.length > EMAIL_MAX_LEN) return null
  if (!EMAIL_RE.test(cleaned)) return null
  return cleaned
}

function cleanUrl(raw: unknown): string | null | undefined {
  const value = cleanText(raw, 500)
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

function timeZoneOffsetMinutes(date: Date, timeZone: string): number {
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

  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '0'
  const zonedAsUtc = Date.UTC(
    Number(value('year')),
    Number(value('month')) - 1,
    Number(value('day')),
    Number(value('hour')),
    Number(value('minute')),
    Number(value('second')),
  )

  return (zonedAsUtc - date.getTime()) / 60_000
}

function claremontDateTimeLocalToIso(value: string): string | null {
  const match = value.match(DATETIME_LOCAL_RE)
  if (!match) return null

  const [, year, month, day, hour, minute, second = '0'] = match
  const parts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  }

  if (
    parts.month < 1 || parts.month > 12
    || parts.day < 1 || parts.day > 31
    || parts.hour < 0 || parts.hour > 23
    || parts.minute < 0 || parts.minute > 59
    || parts.second < 0 || parts.second > 59
  ) {
    return null
  }

  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  const normalized = new Date(localAsUtc)
  if (
    normalized.getUTCFullYear() !== parts.year
    || normalized.getUTCMonth() !== parts.month - 1
    || normalized.getUTCDate() !== parts.day
    || normalized.getUTCHours() !== parts.hour
    || normalized.getUTCMinutes() !== parts.minute
    || normalized.getUTCSeconds() !== parts.second
  ) {
    return null
  }

  const firstOffset = timeZoneOffsetMinutes(new Date(localAsUtc), CLAREMONT_TIME_ZONE)
  let utcTime = localAsUtc - firstOffset * 60_000
  const secondOffset = timeZoneOffsetMinutes(new Date(utcTime), CLAREMONT_TIME_ZONE)
  if (secondOffset !== firstOffset) {
    utcTime = localAsUtc - secondOffset * 60_000
  }

  const parsed = new Date(utcTime)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function cleanStartsAt(raw: unknown): string | null {
  const value = cleanText(raw, 80)
  if (!value) return null

  if (DATETIME_LOCAL_RE.test(value)) {
    return claremontDateTimeLocalToIso(value)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function field(input: Record<string, unknown>, primary: string, alias?: string): unknown {
  const primaryValue = input[primary]
  if (primaryValue !== undefined && primaryValue !== null && primaryValue !== '') return primaryValue
  return alias ? input[alias] : primaryValue
}

export function toEventSubmissionInsertRow(submission: EventSubmissionRecord): EventSubmissionInsertRow {
  return {
    title: submission.title,
    starts_at: submission.startsAt,
    location: submission.location,
    campus_or_org: submission.campusOrOrg,
    audience: submission.audience,
    event_url: submission.eventUrl,
    food_free_cost: submission.foodFreeCost,
    notes: submission.notes,
    submitter_email: submission.submitterEmail,
    status: 'pending',
    is_verified: false,
  }
}

export function normalizeEventSubmission(raw: unknown): EventSubmissionValidationResult {
  const input = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? raw as Record<string, unknown>
    : {}

  const errors: Record<string, string> = {}
  const title = cleanText(input.title, TEXT_LIMITS.title)
  const startsAt = cleanStartsAt(field(input, 'startsAt', 'dateTime'))
  const location = cleanText(input.location, TEXT_LIMITS.location)
  const campusOrOrg = cleanText(input.campusOrOrg, TEXT_LIMITS.campusOrOrg)
  const audience = cleanText(field(input, 'audience', 'openTo'), TEXT_LIMITS.audience)
  const submitterEmail = cleanEmail(input.submitterEmail)
  const eventUrl = cleanUrl(field(input, 'eventUrl', 'rsvpLink'))
  const foodFreeCost = cleanText(input.foodFreeCost, TEXT_LIMITS.foodFreeCost)
  const notes = cleanText(input.notes, TEXT_LIMITS.notes)

  if (!title) errors.title = 'Event title is required.'
  if (!startsAt) errors.startsAt = 'A valid event date/time is required.'
  if (!location) errors.location = 'Location is required.'
  if (!campusOrOrg) errors.campusOrOrg = 'Campus or org is required.'
  if (!audience) errors.audience = 'Please say who can attend.'
  if (!submitterEmail) errors.submitterEmail = 'A valid submitter email is required.'
  if (eventUrl === undefined) errors.eventUrl = 'Please enter a valid http(s) RSVP/link URL.'

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      title: title!,
      startsAt: startsAt!,
      location: location!,
      campusOrOrg: campusOrOrg!,
      audience: audience!,
      submitterEmail: submitterEmail!,
      eventUrl: eventUrl ?? null,
      foodFreeCost,
      notes,
      status: 'pending',
      isVerified: false,
    },
  }
}
