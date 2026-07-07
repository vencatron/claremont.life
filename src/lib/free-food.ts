import {
  CLAREMONT_TIME_ZONE,
  appliesStudentEventFilter,
  isValidEventDate,
  localDateKey,
  localDateKeyOffset,
} from './student-events'
import type { ClaremontEvent } from '../types'

export interface FreeFoodOptions {
  /** Injected clock — required so the selector stays pure and unit-testable. */
  now: Date
  timeZone?: string
  maxDays?: number
}

export interface FreeFoodDay {
  /** Pacific calendar day, 'YYYY-MM-DD'. */
  dayKey: string
  /** 'Today' | 'Tomorrow' | 'Wednesday, Jul 8'. */
  dayLabel: string
  events: ClaremontEvent[]
}

export function selectFreeFoodEvents(
  events: readonly ClaremontEvent[],
  options: FreeFoodOptions,
): ClaremontEvent[] {
  const { now, timeZone = CLAREMONT_TIME_ZONE, maxDays = 7 } = options
  if (!isValidEventDate(now)) return []

  const windowKeys = new Set<string>()
  for (let offset = 0; offset < maxDays; offset += 1) {
    windowKeys.add(localDateKeyOffset(now, timeZone, offset))
  }

  return events
    .filter((event) => {
      const startsAt = new Date(event.starts_at)
      if (!isValidEventDate(startsAt)) return false
      if (startsAt.getTime() < now.getTime()) return false
      if (!windowKeys.has(localDateKey(startsAt, timeZone))) return false
      return (
        appliesStudentEventFilter(event, 'free', now, timeZone) &&
        appliesStudentEventFilter(event, 'food', now, timeZone)
      )
    })
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
}

export function groupFreeFoodByDay(
  events: readonly ClaremontEvent[],
  options: FreeFoodOptions,
): FreeFoodDay[] {
  const { now, timeZone = CLAREMONT_TIME_ZONE } = options
  const selected = selectFreeFoodEvents(events, options)
  if (selected.length === 0) return []

  const todayKey = localDateKey(now, timeZone)
  const tomorrowKey = localDateKeyOffset(now, timeZone, 1)
  const dayFormat = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const days: FreeFoodDay[] = []
  for (const event of selected) {
    const startsAt = new Date(event.starts_at)
    const dayKey = localDateKey(startsAt, timeZone)
    const current = days[days.length - 1]
    if (current && current.dayKey === dayKey) {
      current.events.push(event)
      continue
    }
    const dayLabel =
      dayKey === todayKey ? 'Today' : dayKey === tomorrowKey ? 'Tomorrow' : dayFormat.format(startsAt)
    days.push({ dayKey, dayLabel, events: [event] })
  }

  return days
}

/**
 * 'Tuesday, Jul 7 – Monday, Jul 13' for the page subhead. Pure; now injected.
 * Both endpoints are derived from the SAME day-key math the selector uses
 * (localDateKey / localDateKeyOffset), then formatted at UTC noon of that key.
 * Never add raw millis to `now` here: `now + (maxDays-1)*24h` lands on the
 * wrong Pacific calendar day when the span crosses a DST transition.
 */
export function freeFoodWindowLabel(
  now: Date,
  timeZone: string = CLAREMONT_TIME_ZONE,
  maxDays = 7,
): string {
  if (!isValidEventDate(now)) return ''
  const keyFormat = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
  const keyToLabel = (key: string) => {
    const [year, month, day] = key.split('-').map(Number)
    return keyFormat.format(new Date(Date.UTC(year, month - 1, day, 12)))
  }
  const startKey = localDateKey(now, timeZone)
  const endKey = localDateKeyOffset(now, timeZone, maxDays - 1)
  return `${keyToLabel(startKey)} – ${keyToLabel(endKey)}`
}
