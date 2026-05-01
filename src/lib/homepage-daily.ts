import type { ClaremontEvent } from '@/types'

const CLAREMONT_TIME_ZONE = 'America/Los_Angeles'

const CLAREMONT_DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: CLAREMONT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

export type HomeQuickActionId =
  | 'today'
  | 'tonight'
  | 'weekend'
  | 'open-late'
  | 'student-deals'
  | 'new-here'

export interface HomeQuickAction {
  id: HomeQuickActionId
  label: string
  href: string
  description: string
  utility: 'events' | 'food' | 'deals' | 'guide'
}

export const HOME_QUICK_ACTIONS: readonly HomeQuickAction[] = [
  {
    id: 'today',
    label: 'Today',
    href: '/events',
    description: 'What is happening before midnight',
    utility: 'events',
  },
  {
    id: 'tonight',
    label: 'Tonight',
    href: '/events',
    description: 'Evening plans around the 5Cs',
    utility: 'events',
  },
  {
    id: 'weekend',
    label: 'This Weekend',
    href: '/events',
    description: 'Friday through Sunday picks',
    utility: 'events',
  },
  {
    id: 'open-late',
    label: 'Open Late',
    href: '/eat',
    description: 'Late-night food options',
    utility: 'food',
  },
  {
    id: 'student-deals',
    label: 'Student Deals',
    href: '/deals',
    description: 'Discounts that matter on a student budget',
    utility: 'deals',
  },
  {
    id: 'new-here',
    label: 'New Here',
    href: '/new',
    description: 'Start with the essential Claremont guide',
    utility: 'guide',
  },
] as const

export interface HomepageEventSplitOptions {
  now?: Date | string
  tonightLimit?: number
  thisWeekLimit?: number
  prioritizeEvent?: (event: ClaremontEvent) => boolean
}

export interface HomepageEventSplit {
  tonight: ClaremontEvent[]
  thisWeek: ClaremontEvent[]
}

export function splitHomepageEvents(
  events: readonly ClaremontEvent[],
  options: HomepageEventSplitOptions = {},
): HomepageEventSplit {
  const now = coerceDate(options.now ?? new Date())
  const tonightLimit = options.tonightLimit ?? 3
  const thisWeekLimit = options.thisWeekLimit ?? 3
  const prioritizeEvent = options.prioritizeEvent
  const tonightEndsAt = endOfClaremontDay(now)
  const thisWeekEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const upcoming = events
    .flatMap((event) => {
      const startsAt = coerceOptionalDate(event.starts_at)
      return startsAt ? [{ event, startsAt, isPrioritized: Boolean(prioritizeEvent?.(event)) }] : []
    })
    .filter(({ startsAt }) => startsAt >= now)
    .sort((a, b) => {
      if (a.isPrioritized !== b.isPrioritized) {
        return a.isPrioritized ? -1 : 1
      }

      return a.startsAt.getTime() - b.startsAt.getTime()
    })

  return {
    tonight: upcoming
      .filter(({ startsAt }) => startsAt <= tonightEndsAt)
      .slice(0, tonightLimit)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .map(({ event }) => event),
    thisWeek: upcoming
      .filter(({ startsAt }) => startsAt > tonightEndsAt && startsAt <= thisWeekEndsAt)
      .slice(0, thisWeekLimit)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .map(({ event }) => event),
  }
}

function coerceDate(value: Date | string): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${String(value)}`)
  }

  return date
}

function coerceOptionalDate(value: Date | string): Date | null {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function endOfClaremontDay(date: Date): Date {
  const parts = getClaremontDateTimeParts(date)
  const nextMidnight = claremontDateTimeToUtc({
    year: parts.year,
    month: parts.month,
    day: parts.day + 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  })

  return new Date(nextMidnight.getTime() - 1)
}

interface DateTimeParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
}

function claremontDateTimeToUtc(parts: DateTimeParts): Date {
  const wallClockTime = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  )
  let utcTime = wallClockTime

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = getClaremontOffsetMs(new Date(utcTime))
    const adjusted = wallClockTime - offset

    if (adjusted === utcTime) {
      break
    }

    utcTime = adjusted
  }

  return new Date(utcTime)
}

function getClaremontOffsetMs(date: Date): number {
  const parts = getClaremontDateTimeParts(date)
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    date.getUTCMilliseconds(),
  )

  return localAsUtc - date.getTime()
}

function getClaremontDateTimeParts(date: Date): DateTimeParts {
  const partValues = Object.fromEntries(
    CLAREMONT_DATE_TIME_FORMAT.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return {
    year: Number(partValues.year),
    month: Number(partValues.month),
    day: Number(partValues.day),
    hour: Number(partValues.hour),
    minute: Number(partValues.minute),
    second: Number(partValues.second),
    millisecond: date.getUTCMilliseconds(),
  }
}
