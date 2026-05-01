'use client'

import { FormEvent, ReactNode, useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const initialForm = {
  title: '',
  dateTime: '',
  location: '',
  campusOrOrg: '',
  openTo: '',
  rsvpLink: '',
  foodFreeCost: '',
  notes: '',
  submitterEmail: '',
}

type FormState = typeof initialForm

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string; errors?: Record<string, string> }

export function EventSubmitForm() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitState({ status: 'submitting' })

    try {
      const response = await fetch('/api/events/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json().catch(() => ({})) as {
        message?: string
        errors?: Record<string, string>
      }

      if (!response.ok) {
        setSubmitState({
          status: 'error',
          message: data.message ?? 'Could not submit this event. Try again in a minute.',
          errors: data.errors,
        })
        return
      }

      setForm(initialForm)
      setSubmitState({
        status: 'success',
        message: data.message ?? 'Thanks — your event was submitted for review.',
      })
    } catch {
      setSubmitState({
        status: 'error',
        message: 'Could not reach the submission endpoint. Try again in a minute.',
      })
    }
  }

  const errors = submitState.status === 'error' ? submitState.errors ?? {} : {}

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
      <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
        Submissions are reviewed before they appear on claremont.life. Please share enough detail to verify the event.
      </div>

      {submitState.status === 'success' && (
        <div className="rounded-xl bg-green-50 p-3 text-sm text-green-800" role="status">
          {submitState.message} <Link href="/events" className="font-medium underline">Back to events.</Link>
        </div>
      )}
      {submitState.status === 'error' && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
          {submitState.message}
        </div>
      )}

      <Field label="Event title" error={errors.title} required>
        <Input
          value={form.title}
          onChange={(event) => updateField('title', event.target.value)}
          placeholder="Free pizza night, 5C open mic, club info session..."
          maxLength={140}
          required
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Date and time" error={errors.startsAt} required>
          <Input
            type="datetime-local"
            value={form.dateTime}
            onChange={(event) => updateField('dateTime', event.target.value)}
            required
          />
        </Field>
        <Field label="Location" error={errors.location} required>
          <Input
            value={form.location}
            onChange={(event) => updateField('location', event.target.value)}
            placeholder="Building, room, lawn, or off-campus spot"
            maxLength={160}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Campus or org" error={errors.campusOrOrg} required>
          <Input
            value={form.campusOrOrg}
            onChange={(event) => updateField('campusOrOrg', event.target.value)}
            placeholder="Pomona ASPC, Scripps club, 5C mutual aid..."
            maxLength={120}
            required
          />
        </Field>
        <Field label="Open to who?" error={errors.audience} required>
          <Input
            value={form.openTo}
            onChange={(event) => updateField('openTo', event.target.value)}
            placeholder="All 5C students, CMC only, first-years..."
            maxLength={120}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="RSVP/link" error={errors.eventUrl}>
          <Input
            type="url"
            value={form.rsvpLink}
            onChange={(event) => updateField('rsvpLink', event.target.value)}
            placeholder="https://..."
            maxLength={500}
          />
        </Field>
        <Field label="Cost / extras">
          <Input
            value={form.foodFreeCost}
            onChange={(event) => updateField('foodFreeCost', event.target.value)}
            placeholder="$5 tickets, snacks provided..."
            maxLength={160}
          />
        </Field>
      </div>

      <Field label="Submitter email" error={errors.submitterEmail} required>
        <Input
          type="email"
          value={form.submitterEmail}
          onChange={(event) => updateField('submitterEmail', event.target.value)}
          placeholder="you@college.edu"
          maxLength={254}
          required
        />
      </Field>

      <Field label="Notes for review">
        <textarea
          value={form.notes}
          onChange={(event) => updateField('notes', event.target.value)}
          placeholder="Anything the review queue should know before approving this listing?"
          maxLength={800}
          rows={4}
          className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
        />
      </Field>

      <Button type="submit" className="h-11 w-full rounded-full md:w-auto" disabled={submitState.status === 'submitting'}>
        {submitState.status === 'submitting' ? 'Submitting…' : 'Submit event for review'}
      </Button>
    </form>
  )
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-gray-800">
      <span>
        {label}{required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
      {error ? <span className="block text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
