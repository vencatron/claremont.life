# Claremont.Life

A community platform for Claremont, CA — connecting residents with local deals, events, dining, housing, transportation, and more.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI + shadcn/ui
- **Backend:** Supabase
- **Deployment:** Vercel

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
  app/          # Next.js App Router pages
    deals/      # Local deals & discounts
    eat/        # Dining & restaurants
    events/     # Community events
    housing/    # Housing listings
    know/       # Local knowledge & resources
    more/       # Additional resources
    move/       # Transportation
    new/        # What's new
    thrive/     # Wellness & community
  components/   # Shared UI components
  lib/          # Utilities & helpers
  types/        # TypeScript type definitions
```

## Deployment

Deployed on [Vercel](https://vercel.com). Push to `main` to trigger a production deployment.
