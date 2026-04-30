import type { College } from './constants'
import { getEventCampus } from './student-events'
import type { ClaremontEvent } from '../types'

export const STUDENT_CAMPUSES = [
  'Pomona',
  'CMC',
  'Harvey Mudd',
  'Scripps',
  'Pitzer',
  'CGU',
  'KGI',
] as const satisfies readonly College[]

export type StudentCampus = (typeof STUDENT_CAMPUSES)[number]

export const CAMPUS_PREFERENCE_STORAGE_KEY = 'claremont.life:campus-preference'
export const CAMPUS_PREFERENCE_CHANGE_EVENT = 'claremont:campus-preference-change'

function defaultStorage(): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function isStudentCampus(value: unknown): value is StudentCampus {
  return typeof value === 'string' && (STUDENT_CAMPUSES as readonly string[]).includes(value)
}

export function readCampusPreference(storage?: Pick<Storage, 'getItem'>): StudentCampus | null {
  const target = storage ?? defaultStorage()
  if (!target) return null

  try {
    const value = target.getItem(CAMPUS_PREFERENCE_STORAGE_KEY)
    return isStudentCampus(value) ? value : null
  } catch {
    return null
  }
}

export function writeCampusPreference(campus: StudentCampus, storage?: Pick<Storage, 'setItem'>): void {
  const target = storage ?? defaultStorage()
  if (!target) return

  try {
    target.setItem(CAMPUS_PREFERENCE_STORAGE_KEY, campus)
  } catch {
    // localStorage can be blocked or full; preference storage should never break the page.
  }
}

export function clearCampusPreference(storage?: Pick<Storage, 'removeItem'>): void {
  const target = storage ?? defaultStorage()
  if (!target) return

  try {
    target.removeItem(CAMPUS_PREFERENCE_STORAGE_KEY)
  } catch {
    // localStorage can be blocked; clearing should remain a no-op in that case.
  }
}

export function sortEventsByCampusPreference(
  events: readonly ClaremontEvent[],
  campus: StudentCampus | null,
): ClaremontEvent[] {
  if (!campus) return [...events]

  const preferred: ClaremontEvent[] = []
  const rest: ClaremontEvent[] = []

  for (const event of events) {
    if (getEventCampus(event) === campus) preferred.push(event)
    else rest.push(event)
  }

  return [...preferred, ...rest]
}
