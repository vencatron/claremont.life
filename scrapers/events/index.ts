/**
 * Events Scraper Orchestrator
 *
 * Runs all event source scrapers in parallel, collecting results.
 * Each source failure is isolated — one failing source won't abort the run.
 *
 * Sources:
 *   - pomona     : Pomona College (Trumba calendar)
 *   - cmc        : Claremont McKenna College (Localist API)
 *   - harvey-mudd: Harvey Mudd College (WordPress RSS)
 *   - scripps    : Scripps College (The Events Calendar API)
 *   - pitzer     : Pitzer College (Drupal XML feed)
 *   - cgu        : Claremont Graduate University (The Events Calendar API)
 *   - city       : City of Claremont (HTML scraping)
 *   - eventbrite : Eventbrite (requires EVENTBRITE_API_KEY)
 */

import { scrapePomona } from './sources/pomona'
import { scrapeCMC } from './sources/cmc'
import { scrapeHarveyMudd } from './sources/harvey-mudd'
import { scrapeScripps } from './sources/scripps'
import { scrapePitzer } from './sources/pitzer'
import { scrapeCGU } from './sources/cgu'
import { scrapeCityClaremont } from './sources/city-claremont'
import { scrapeEventbrite } from './sources/eventbrite'
import { scrapeEngage } from './sources/engage'
import type { ScrapedEvent, ScraperResult } from './sources/types'

export type { ScrapedEvent, ScraperResult }

export interface RunSummary {
  total: number
  bySource: Record<string, { count: number; error?: string }>
  events: ScrapedEvent[]
  errors: string[]
}

/**
 * Run all scrapers in parallel and return a combined result summary.
 */
export async function run(): Promise<RunSummary> {
  console.log('🔍 Starting event scrapers...')

  const scrapers: Array<() => Promise<ScraperResult>> = [
    scrapeEngage,
    scrapePomona,
    scrapeCMC,
    scrapeHarveyMudd,
    scrapeScripps,
    scrapePitzer,
    scrapeCGU,
    scrapeCityClaremont,
    scrapeEventbrite,
  ]

  // Run all scrapers concurrently; catch individual failures
  const results = await Promise.allSettled(scrapers.map((fn) => fn()))

  const allEvents: ScrapedEvent[] = []
  const errors: string[] = []
  const bySource: Record<string, { count: number; error?: string }> = {}

  for (const result of results) {
    if (result.status === 'rejected') {
      const msg = result.reason instanceof Error ? result.reason.message : String(result.reason)
      errors.push(`Uncaught scraper error: ${msg}`)
      console.error(`❌ Uncaught error: ${msg}`)
      continue
    }

    const { source, events, error } = result.value

    if (error) {
      console.warn(`⚠️  [${source}] ${error}`)
      errors.push(`[${source}] ${error}`)
      bySource[source] = { count: 0, error }
    } else {
      console.log(`✅ [${source}] ${events.length} events`)
      allEvents.push(...events)
      bySource[source] = { count: events.length }
    }
  }

  return {
    total: allEvents.length,
    bySource,
    events: allEvents,
    errors,
  }
}
