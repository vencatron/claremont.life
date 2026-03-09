# claremont.life Scrapers

Standalone Node.js/TypeScript data pipelines for claremont.life. These run independently from the Next.js app and populate the Supabase database.

## Structure

```
scrapers/
├── package.json
├── tsconfig.json
├── README.md
├── events/
│   ├── migration.sql      # events table DDL
│   ├── index.ts           # scraper orchestrator
│   ├── run.ts             # CLI entry point
│   └── sources/
│       ├── types.ts
│       ├── pomona.ts      # Pomona College (Trumba)
│       ├── cmc.ts         # CMC (Localist API) ✅
│       ├── harvey-mudd.ts # Harvey Mudd (WordPress RSS) ✅
│       ├── scripps.ts     # Scripps (The Events Calendar API) ✅
│       ├── pitzer.ts      # Pitzer (Drupal XML feed) ✅
│       ├── cgu.ts         # CGU (The Events Calendar API) ✅
│       ├── city-claremont.ts # City of Claremont (HTML scraping)
│       └── eventbrite.ts  # Eventbrite (requires API key)
└── migrations/
    ├── 001_events.sql
    ├── 002_eats.sql
    ├── 003_housing.sql
    └── 004_deals.sql
```

## Setup

### 1. Install dependencies

```bash
cd scrapers
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Required:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

Optional:
```env
EVENTBRITE_API_KEY=your-eventbrite-private-token
DRY_RUN=1  # Set to 1 to print results without writing to DB
```

Get your Supabase credentials from: https://supabase.com/dashboard/project/_/settings/api

Get an Eventbrite API key (free): https://www.eventbrite.com/platform

### 3. Run the Supabase migration

Apply the schema to your Supabase project. You can run these in the Supabase SQL editor
(https://supabase.com/dashboard/project/_/sql) or via the Supabase CLI:

```bash
# Via Supabase CLI
supabase db push

# Or paste the SQL directly into the Supabase dashboard SQL editor
cat migrations/001_events.sql
```

Run all migrations in order: `001_events.sql` → `002_eats.sql` → `003_housing.sql` → `004_deals.sql`

### 4. Scrape events

```bash
npm run scrape:events
```

Sample output:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  claremont.life Events Scraper
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Starting event scrapers...
✅ [cmc_calendar] 24 events
✅ [hmc_calendar] 12 events
✅ [scripps_calendar] 18 events
✅ [pitzer_calendar] 21 events
✅ [cgu_calendar] 9 events
⚠️  [pomona_calendar] Trumba API returned no parseable events...
⚠️  [eventbrite] EVENTBRITE_API_KEY not set...

📊 Scraper Results:
────────────────────────────────────────
  ✅ cmc_calendar: 24 events
  ✅ hmc_calendar: 12 events
  ✅ scripps_calendar: 18 events
  ...
  Total: 84 events from 8 sources

💾 Upserting events into Supabase...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Done! Scraped 84 events from 8 sources — 67 new, 17 updated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Event Sources

| Source | Platform | URL | Status |
|--------|----------|-----|--------|
| CMC | Localist API | https://campusevents.cmc.edu/api/2/events | ✅ Working |
| Scripps | The Events Calendar (WP) | https://www.scrippscollege.edu/events/wp-json/tribe/events/v1/events | ✅ Working |
| Pitzer | Drupal XML feed | https://www.pitzer.edu/events/xml-feed | ✅ Working |
| Harvey Mudd | WordPress RSS | https://www.hmc.edu/calendar/feed/ | ✅ Working |
| CGU | The Events Calendar (WP) | https://www.cgu.edu/wp-json/tribe/events/v1/events | ✅ Working |
| Pomona | Trumba (JS calendar) | https://www.pomona.edu/events | ⚠️ Needs work* |
| City of Claremont | HTML scraping | https://www.claremontca.gov/Events-directory | ⚠️ Needs verification |
| Eventbrite | REST API v3 | https://www.eventbriteapi.com/v3/ | 🔑 Requires API key |

*Pomona uses Trumba which renders events via JavaScript. See notes below.

## Notes on Specific Sources

### Pomona (Trumba)

Pomona's event calendar is powered by Trumba and loads entirely client-side via JavaScript.
The `pomona.ts` scraper attempts to use the Trumba spud API, but this may not return events.

**Alternatives:**
1. **ICS feed**: Try `https://www.trumba.com/calendar/pomona-college-events.ics`
   — parse with an ics parser like `node-ical`
2. **Headless browser**: Use Playwright to render the page and extract events
3. **Trumba account**: If you have a Trumba account, you may be able to use their
   authenticated API

**Quick test:**
```bash
curl -sL "https://www.trumba.com/calendar/pomona-college-events.ics" | head -50
```

### City of Claremont

The city uses a CivicPlus/Granicus CMS. The HTML structure may change over time.
If scraping fails, check the following pages manually:
- https://www.claremontca.gov/Events-directory
- https://www.claremontca.gov/Activities-Recreation/Special-Events

### Eventbrite

Requires a free developer account. Steps:
1. Sign up at https://www.eventbrite.com/platform
2. Create an app, get your **Private Token**
3. Set `EVENTBRITE_API_KEY=your-token` in `.env`

## Adding a New Source

1. Create a new file in `events/sources/your-source.ts`
2. Export a `scrapeYourSource(): Promise<ScraperResult>` function
3. Follow the pattern in existing scrapers (see `cmc.ts` as a clean example)
4. Register it in `events/index.ts` in the `scrapers` array

```typescript
// events/sources/your-source.ts
import type { ScrapedEvent, ScraperResult } from './types.js'

const SOURCE = 'your_source_name'

export async function scrapeYourSource(): Promise<ScraperResult> {
  const events: ScrapedEvent[] = []

  try {
    // Fetch and parse events...
    events.push({
      title: 'Event Title',
      college: null,           // or 'Pomona', 'CMC', etc.
      event_type: 'lecture',   // optional
      location: 'Venue Name',  // optional
      starts_at: new Date().toISOString(),  // required, ISO 8601
      source: SOURCE,          // required
      source_id: 'unique-id',  // required for deduplication
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { source: SOURCE, events: [], error: message }
  }

  return { source: SOURCE, events }
}
```

## Scheduling

### Option 1: GitHub Actions (recommended for Vercel deployments)

Create `.github/workflows/scrape-events.yml`:

```yaml
name: Scrape Events
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd scrapers && npm install
      - run: cd scrapers && npm run scrape:events
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          EVENTBRITE_API_KEY: ${{ secrets.EVENTBRITE_API_KEY }}
```

### Option 2: Vercel Cron Jobs

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-events",
      "schedule": "0 6 * * *"
    }
  ]
}
```

Then create `src/app/api/cron/scrape-events/route.ts` that calls the scraper logic.

### Option 3: Local cron

```bash
# Add to crontab (run daily at 6 AM)
0 6 * * * cd /path/to/claremont.life/scrapers && npm run scrape:events >> /var/log/scraper.log 2>&1
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Service role key (bypasses RLS) |
| `EVENTBRITE_API_KEY` | Optional | Eventbrite private token |
| `DRY_RUN` | Optional | Set to `1` to skip DB writes |
