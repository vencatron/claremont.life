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
│       ├── claremont-colleges.ts # The Claremont Colleges campus calendar ✅
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
SUPABASS_TOKEN=your-service-role-key
```

`SUPABASE_SERVICE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are also supported for
backward compatibility.

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
✅ [claremont_colleges_calendar] 24 events
✅ [city_claremont] 0 events
⚠️  [eventbrite] EVENTBRITE_API_KEY not set...

📊 Scraper Results:
────────────────────────────────────────
  ✅ claremont_colleges_calendar: 24 events
  ✅ city_claremont: 0 events
  ⚠️  eventbrite: EVENTBRITE_API_KEY not set...
  Total: 24 events from 3 sources

💾 Upserting events into Supabase...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Done! Scraped 24 events from 3 sources — 20 new, 4 updated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Event Sources

| Source | Platform | URL | Status |
|--------|----------|-----|--------|
| The Claremont Colleges | The Events Calendar (WP) | https://claremont.edu/wp-json/tribe/events/v1/events | ✅ Working |
| City of Claremont | HTML scraping | https://www.claremontca.gov/Events-directory | ⚠️ Needs verification |
| Eventbrite | REST API v3 | https://www.eventbriteapi.com/v3/ | 🔑 Requires API key |

## Notes on Specific Sources

### The Claremont Colleges

The campus calendar at https://claremont.edu/events/ is the canonical campus
event source for claremont.life. It is backed by The Events Calendar REST API at
`https://claremont.edu/wp-json/tribe/events/v1/events`.

The scraper stores TCC events with `claremont_colleges_*` source names so the
app can still filter by college. Once those rows exist, the app read path hides
older per-campus rows from sources such as `pomona`, `cmc`, and `scripps` to
avoid duplicate campus events.

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
          SUPABASS_TOKEN: ${{ secrets.SUPABASS_TOKEN }}
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
| `SUPABASS_TOKEN` | ✅ | Service role key/token (bypasses RLS) |
| `SUPABASE_SERVICE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Optional | Backward-compatible aliases for the Supabase write token |
| `EVENTBRITE_API_KEY` | Optional | Eventbrite private token |
| `DRY_RUN` | Optional | Set to `1` to skip DB writes |
