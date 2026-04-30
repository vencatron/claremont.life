import { mkdir, appendFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { NextRequest, NextResponse } from 'next/server'

import { normalizeEventSubmission, toEventSubmissionInsertRow, type EventSubmissionRecord } from '@/lib/event-submissions'
import { getClientIp, rateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const LOCAL_QUEUE_PATH = join(process.cwd(), '.local', 'event-submissions.jsonl')
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABAS_SERVICE_KEY

function hasAdminCredentials() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && SERVICE_KEY)
}

async function appendLocalSubmission(submission: EventSubmissionRecord) {
  await mkdir(dirname(LOCAL_QUEUE_PATH), { recursive: true })
  await appendFile(
    LOCAL_QUEUE_PATH,
    `${JSON.stringify({ ...toEventSubmissionInsertRow(submission), queued_at: new Date().toISOString() })}\n`,
    'utf8',
  )
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (!ip && process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, message: 'Invalid request.' },
      { status: 400 },
    )
  }

  const limit = rateLimit('event-submit', ip ?? 'dev-local', 3, 60 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, message: 'Too many event submissions. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
        },
      },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request.' },
      { status: 400 },
    )
  }

  const validated = normalizeEventSubmission(body)
  if (!validated.ok) {
    return NextResponse.json(
      {
        success: false,
        message: 'Please fix the highlighted fields and try again.',
        errors: validated.errors,
      },
      { status: 400 },
    )
  }

  if (!hasAdminCredentials()) {
    if (process.env.NODE_ENV === 'development') {
      try {
        await appendLocalSubmission(validated.value)
      } catch (error) {
        console.error('local event submission queue failed:', error)
        return NextResponse.json(
          { success: false, message: 'Could not queue the submission right now.' },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Thanks — your event was queued for review.',
        queued: true,
      })
    }

    return NextResponse.json(
      { success: false, message: 'Event submissions are temporarily unavailable.' },
      { status: 503 },
    )
  }

  let supabase
  try {
    supabase = createAdminClient()
  } catch (error) {
    console.error('event submission admin client unavailable:', error)
    return NextResponse.json(
      { success: false, message: 'Event submissions are temporarily unavailable.' },
      { status: 503 },
    )
  }

  const { error } = await supabase
    .from('event_submissions')
    .insert(toEventSubmissionInsertRow(validated.value))

  if (error) {
    console.error('event submission insert failed:', error)
    return NextResponse.json(
      { success: false, message: 'Could not submit the event right now.' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Thanks — your event was submitted for review.',
    queued: false,
  })
}
