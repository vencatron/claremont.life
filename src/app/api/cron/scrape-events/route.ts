import { NextResponse } from 'next/server'
import { run } from '../../../../../scrapers/events/index'
import type { ScrapedEvent } from '../../../../../scrapers/events/sources/types'
import { createAdminClient } from '@/lib/supabase-admin'

// Vercel Cron: triggered per schedule in vercel.json. When CRON_SECRET is
// configured in the project environment, Vercel includes it as a bearer token
// on the Authorization header — reject anything else.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BATCH_SIZE = 100

interface UpsertStats {
  inserted: number
  updated: number
  skipped: number
  errors: number
}

async function upsertEvents(
  supabase: ReturnType<typeof createAdminClient>,
  events: ScrapedEvent[],
): Promise<UpsertStats> {
  const stats: UpsertStats = { inserted: 0, updated: 0, skipped: 0, errors: 0 }

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE)
    const valid = batch.filter((ev) => ev.source_id)
    stats.skipped += batch.length - valid.length
    if (!valid.length) continue

    const rows = valid.map((ev) => ({
      title: ev.title,
      description: ev.description ?? null,
      college: ev.college ?? null,
      event_type: ev.event_type ?? null,
      location: ev.location ?? null,
      address: ev.address ?? null,
      starts_at: ev.starts_at,
      ends_at: ev.ends_at ?? null,
      url: ev.url ?? null,
      image_url: ev.image_url ?? null,
      source: ev.source,
      source_id: ev.source_id,
      is_active: true,
    }))

    const { data, error } = await supabase
      .from('events')
      .upsert(rows, { onConflict: 'source,source_id', ignoreDuplicates: false })
      .select('id, created_at, updated_at')

    if (error) {
      stats.errors += batch.length
      continue
    }

    for (const row of data ?? []) {
      const created = new Date(row.created_at).getTime()
      const updated = new Date(row.updated_at).getTime()
      if (Math.abs(updated - created) < 2000) stats.inserted++
      else stats.updated++
    }
  }

  return stats
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const header = req.headers.get('authorization')
    if (header !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const started = Date.now()
  let supabase
  try {
    supabase = createAdminClient()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const summary = await run()
  const upsert = summary.events.length
    ? await upsertEvents(supabase, summary.events)
    : { inserted: 0, updated: 0, skipped: 0, errors: 0 }

  return NextResponse.json({
    ok: true,
    duration_ms: Date.now() - started,
    total: summary.total,
    bySource: summary.bySource,
    upsert,
    errors: summary.errors,
  })
}
