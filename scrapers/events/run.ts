#!/usr/bin/env tsx
/**
 * Events Scraper Runner
 *
 * CLI entry point. Runs all event scrapers and upserts results into Supabase.
 *
 * Usage:
 *   npm run scrape:events
 *   # or directly:
 *   tsx events/run.ts
 *
 * Required env vars:
 *   SUPABASE_URL          - Your Supabase project URL
 *   SUPABASE_SERVICE_KEY  - Service role key (bypasses RLS)
 *
 * Optional:
 *   EVENTBRITE_API_KEY    - For Eventbrite events
 *   DRY_RUN=1             - Print events without inserting into DB
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { run } from './index.js'
import type { ScrapedEvent } from './sources/types.js'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
const BATCH_SIZE = 100  // Upsert in chunks to avoid payload limits

// ---------------------------------------------------------------------------
// Supabase upsert
// ---------------------------------------------------------------------------

interface UpsertStats {
  inserted: number
  updated: number
  skipped: number
  errors: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertEvents(
  supabase: SupabaseClient<any>,
  events: ScrapedEvent[]
): Promise<UpsertStats> {
  const stats: UpsertStats = { inserted: 0, updated: 0, skipped: 0, errors: 0 }

  // Process in batches
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE)

    // Filter out events without source_id (can't dedupe)
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
      .upsert(rows, {
        onConflict: 'source,source_id',
        ignoreDuplicates: false,
      })
      .select('id, created_at, updated_at')

    if (error) {
      console.error(`  ❌ Batch upsert error: ${error.message}`)
      stats.errors += batch.length
      continue
    }

    // Supabase doesn't distinguish insert vs update in basic upsert.
    // Heuristic: if created_at === updated_at within a second, it's new.
    const now = Date.now()
    for (const row of data ?? []) {
      const created = new Date(row.created_at).getTime()
      const updated = new Date(row.updated_at).getTime()
      if (Math.abs(updated - created) < 2000) {
        stats.inserted++
      } else {
        stats.updated++
      }
    }
  }

  return stats
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('━'.repeat(60))
  console.log('  claremont.life Events Scraper')
  console.log('━'.repeat(60))

  if (DRY_RUN) {
    console.log('🔵 DRY RUN mode — no data will be written to Supabase\n')
  }

  // Run all scrapers
  const summary = await run()

  console.log('\n📊 Scraper Results:')
  console.log('─'.repeat(40))
  for (const [source, info] of Object.entries(summary.bySource)) {
    if (info.error) {
      console.log(`  ⚠️  ${source}: ${info.error.slice(0, 80)}`)
    } else {
      console.log(`  ✅ ${source}: ${info.count} events`)
    }
  }
  console.log('─'.repeat(40))
  console.log(`  Total: ${summary.total} events from ${Object.keys(summary.bySource).length} sources`)

  if (summary.events.length === 0) {
    console.log('\n⚠️  No events scraped. Check source errors above.')
    process.exit(1)
  }

  if (DRY_RUN) {
    console.log('\n📋 Sample events (first 5):')
    for (const ev of summary.events.slice(0, 5)) {
      console.log(`  [${ev.source}] ${ev.title} — ${new Date(ev.starts_at).toLocaleDateString()}`)
    }
    console.log('\n✅ Dry run complete. No data written.')
    return
  }

  // Connect to Supabase
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('\n❌ Missing env vars: SUPABASE_URL and/or SUPABASE_SERVICE_KEY')
    console.error('   Set them in your .env file. See scrapers/README.md for setup.')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  })

  console.log('\n💾 Upserting events into Supabase...')
  const upsertStats = await upsertEvents(supabase, summary.events)

  console.log('\n━'.repeat(60))
  console.log(
    `✅ Done! Scraped ${summary.total} events from ${Object.keys(summary.bySource).length} sources — ` +
    `${upsertStats.inserted} new, ${upsertStats.updated} updated` +
    (upsertStats.errors > 0 ? `, ${upsertStats.errors} errors` : '')
  )
  console.log('━'.repeat(60))

  if (summary.errors.length > 0) {
    console.log(`\n⚠️  ${summary.errors.length} source(s) had errors. Review above for details.`)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
