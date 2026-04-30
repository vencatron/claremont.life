'use client'

import { useSyncExternalStore } from 'react'
import {
  CAMPUS_PREFERENCE_CHANGE_EVENT,
  CAMPUS_PREFERENCE_STORAGE_KEY,
  STUDENT_CAMPUSES,
  clearCampusPreference,
  readCampusPreference,
  writeCampusPreference,
  type StudentCampus,
} from '@/lib/preferences'

interface CampusPreferenceProps {
  className?: string
}

type CampusPreferenceChangeDetail = {
  campus: StudentCampus | null
}

function browserLocalStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function getCampusPreferenceSnapshot(): StudentCampus | null {
  return readCampusPreference(browserLocalStorage())
}

function getServerCampusPreferenceSnapshot(): StudentCampus | null {
  return null
}

function subscribeCampusPreference(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  function handlePreferenceChange() {
    onStoreChange()
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === CAMPUS_PREFERENCE_STORAGE_KEY) {
      onStoreChange()
    }
  }

  window.addEventListener(CAMPUS_PREFERENCE_CHANGE_EVENT, handlePreferenceChange)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(CAMPUS_PREFERENCE_CHANGE_EVENT, handlePreferenceChange)
    window.removeEventListener('storage', handleStorage)
  }
}

function dispatchCampusPreferenceChange(campus: StudentCampus | null) {
  window.dispatchEvent(
    new CustomEvent<CampusPreferenceChangeDetail>(CAMPUS_PREFERENCE_CHANGE_EVENT, {
      detail: { campus },
    }),
  )
}

export function useCampusPreference(): StudentCampus | null {
  return useSyncExternalStore(
    subscribeCampusPreference,
    getCampusPreferenceSnapshot,
    getServerCampusPreferenceSnapshot,
  )
}

export function CampusPreference({ className = '' }: CampusPreferenceProps) {
  const campus = useCampusPreference()

  function chooseCampus(nextCampus: StudentCampus) {
    writeCampusPreference(nextCampus, browserLocalStorage())
    dispatchCampusPreferenceChange(nextCampus)
  }

  function resetCampus() {
    clearCampusPreference(browserLocalStorage())
    dispatchCampusPreferenceChange(null)
  }

  return (
    <section
      aria-label="Campus preference"
      className={`rounded-2xl border border-border bg-card/95 p-4 text-card-foreground shadow-sm backdrop-blur ${className}`}
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Personalize
          </p>
          <h2 className="mt-1 text-base font-semibold">Choose your campus</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {campus
              ? `Prioritizing ${campus} first — the whole 5C world stays available.`
              : 'Tell us your home campus so events and picks from your school show up first. No account required.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {STUDENT_CAMPUSES.map((studentCampus) => {
            const selected = campus === studentCampus
            return (
              <button
                key={studentCampus}
                type="button"
                onClick={() => chooseCampus(studentCampus)}
                aria-pressed={selected}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selected
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-background text-foreground hover:bg-accent'
                }`}
              >
                {studentCampus}
              </button>
            )
          })}
        </div>

        {campus && (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
            <span className="text-muted-foreground">Change campus anytime.</span>
            <button
              type="button"
              onClick={resetCampus}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Reset campus
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
