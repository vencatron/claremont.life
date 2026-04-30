# claremont.life Student Go-To Roadmap

> **For Hermes:** Use `subagent-driven-development` for implementation sessions. Break each chunk into small PR-sized tasks, run tests/build after each chunk, and preserve Ron's existing untracked 3D/explore work unless explicitly asked to touch it.

**Goal:** Turn claremont.life from a polished local guide into the daily operating system for Claremont college students: what to do, where to eat, what is open, what is cheap, what is worth it, and how to live well across the 5C/7C ecosystem.

**Architecture:** Keep the existing Next.js 16 / React 19 app and Supabase data layer. Add student-centered metadata, filters, modules, and editorial guide surfaces incrementally so each session ships a usable improvement without requiring a full redesign.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind v4, Supabase, existing scraper/data files, shadcn/radix UI components, lucide-react.

---

## Current Starting Point

Repo: `/Users/ronnie/Development/claremont.life`

Important existing files:

- Homepage: `src/app/page.tsx`
- Layout/nav: `src/app/layout.tsx`, `src/components/DesktopNav.tsx`, `src/components/BottomNav.tsx`
- Events: `src/app/events/page.tsx`, `src/components/EventsFeed.tsx`, `src/components/EventCard.tsx`, `src/components/CollegeFilter.tsx`, `src/lib/data.ts`, `src/lib/constants.ts`
- Eat: `src/app/eat/page.tsx`, `src/app/eat/eat-guide.tsx`
- Deals: `src/app/deals/page.tsx`, `src/app/deals/deals-guide.tsx`
- New student guide: `src/app/new/page.tsx`, `src/app/new/new-guide.tsx`
- Community/Pulse: `src/app/know/page.tsx`, `src/app/know/community-feed.tsx`
- Housing: `src/app/housing/page.tsx`, `src/app/housing/housing-map.tsx`, `src/app/housing/zones.ts`
- Global styles: `src/app/globals.css`

Known repo state on plan creation:

- Branch: `main`
- Last commit: `d99f22f fix: use claremont.edu events source`
- Existing untracked work includes 3D/explore assets/scripts and `src/app/explore/*` files. Do not overwrite, delete, or casually stage those.

---

## Product North Star

The site should answer the real student question fast:

> “What should I do, eat, know, or avoid in Claremont today?”

Design posture:

- Local, opinionated, and useful.
- Student-first, not institution-first.
- Mobile-first.
- Fast daily utility before visual spectacle.
- Clear enough for a first-year, useful enough for a senior, practical enough for grad students.

---

## Work Chunk 1 — Homepage Daily Utility Layer

**Session goal:** Make the homepage immediately useful for students who open it on their phone.

**Bet:** Students will return if the first screen answers “what is useful today?” faster than Instagram, Reddit, official calendars, or Google Maps.

**User/job:** A 5C student wants to know what is happening tonight, what food/deals are relevant, and where to start if they are new.

**Riskiest assumption:** The homepage can stay visually attractive while becoming more utility-dense.

### Scope

Modify:

- `src/app/page.tsx`
- likely create `src/components/StudentQuickActions.tsx`
- likely create `src/components/HomeTodaySection.tsx`
- possibly adjust `src/components/ScrollScrubHero.tsx` usage, but do not remove visual identity without Ron approval.

Build:

- A prominent mobile-first quick action/search-like section near the top.
- Chips/cards for:
  - Today
  - Tonight
  - This Weekend
  - Free Food
  - Open Late
  - Student Deals
  - New Here
- A “Tonight / This Week” module above or alongside the current category grid.
- Clear preview of why the site matters: events, food, deals, new-student guide.

### Acceptance criteria

- Mobile homepage shows immediate utility without needing a 500vh visual scroll before content.
- Existing hero identity remains recognizable.
- Events still load from `getUpcomingEvents`.
- Build passes: `npm run build`.
- No unrelated explore/3D files touched.

---

## Work Chunk 2 — Events: Student-Centered Discovery

**Session goal:** Turn Events from a clean institutional listing into a student decision tool.

**Bet:** Students do not want “events”; they want “what is worth leaving my dorm for?”

**User/job:** Find something to do tonight/this weekend, preferably open to all 5C students, free, nearby, or socially relevant.

**Riskiest assumption:** Existing event data has enough fields to support useful filters; where it does not, we can add inferred tags safely.

### Scope

Modify:

- `src/components/EventsFeed.tsx`
- `src/components/EventCard.tsx`
- `src/lib/constants.ts`
- maybe `src/types/index.ts`
- maybe `src/lib/data.ts`

Build:

- Search input on Events page.
- Primary filters above campus chips:
  - Today
  - Tonight
  - Tomorrow
  - This Weekend
  - Free
  - Food
  - Music
  - Social
  - Talks
  - Career
  - Off campus
  - Open to 5C
- Keep campus filters, but make them secondary.
- Add event card badges:
  - campus/source
  - inferred category
  - free/open/RSVP if known or inferred
  - “Tonight” or “This weekend” when applicable
- Show location more prominently when available.
- Add empty states that tell students how to submit or check back.

### Acceptance criteria

- Student can search events by title/description/location/source.
- Student can filter by time window and interest category.
- Existing campus filters still work.
- No crashes on missing description/location fields.
- Build passes: `npm run build`.

---

## Work Chunk 3 — Event Submission / Source Expansion

**Session goal:** Add a lightweight way for students/orgs to submit events and improve source coverage.

**Bet:** Official feeds alone will miss the events students actually care about.

**User/job:** A club leader wants to get an event listed; a student wants to tell claremont.life about free food/social events.

**Riskiest assumption:** A low-friction submission path can improve coverage without creating moderation chaos.

### Scope

Create or modify:

- `src/app/submit/page.tsx` or `src/app/events/submit/page.tsx`
- `src/app/api/events/submit/route.ts`
- Supabase table or simple email/queue path, depending current schema and credentials.
- Nav/CTA links from Events empty states and footer/home.

Build:

- Event submission form fields:
  - title
  - date/time
  - location
  - campus/org
  - open to who
  - RSVP/link
  - food/free/cost
  - submitter email
- Store as pending/unverified, not instantly public unless Ron approves.
- Add spam/rate-limit protection using existing `src/lib/rate-limit.ts` if suitable.

### Acceptance criteria

- Submission can be made locally without exposing secrets.
- Submissions are not auto-published unless intentionally designed.
- Submit CTA appears on Events page.
- Build passes and API route handles invalid input.

---

## Work Chunk 4 — Eat: Student Tags and Open-Now Utility

**Session goal:** Make Eat answer student food decisions, not generic restaurant discovery.

**Bet:** Student-specific tags create more value than raw Google-style categories.

**User/job:** Find cheap, open, walkable food or a specific vibe: study, date, group, parents, boba, late night.

**Riskiest assumption:** Existing `eat_places` data plus manual enrichment can support useful student labels.

### Scope

Modify:

- `src/app/eat/eat-guide.tsx`
- `src/app/eat/page.tsx`
- `src/types/index.ts`
- maybe add data enrichment file under `src/app/eat/` or `src/lib/`

Build filters/tags:

- Open late
- Open now, if hours are reliable enough
- Under $10 / cheap
- Study spot
- Date spot
- Parents visiting
- Group-friendly
- Boba/coffee
- Walkable
- Student discount
- Actually worth it

### Acceptance criteria

- Eat page has student-centered filter chips.
- Cards surface student-useful details above generic phone/website links.
- Missing enrichment data degrades gracefully.
- Build passes.

---

## Work Chunk 5 — Deals: Verified Student Discount Wedge

**Session goal:** Make Deals a viral and monetizable student/business wedge.

**Bet:** Students will share verified discounts; businesses will care about student traffic.

**User/job:** Find discounts that actually work with student ID or claremont.life.

**Riskiest assumption:** Deal freshness/trust can be communicated well enough before full redemption infrastructure exists.

### Scope

Modify:

- `src/app/deals/deals-guide.tsx`
- `src/app/deals/page.tsx`
- `src/types/index.ts`
- maybe Supabase schema or local enrichment metadata later.

Build:

- Badges:
  - Student ID
  - Verified this month
  - Exclusive
  - All 5C
  - Under $15
  - Good for finals
  - Birthday
- Filter chips by student need, not just business category.
- CTA: “Know a deal?” / “Business owner?”

### Acceptance criteria

- Deals page feels more student-native and more trustworthy.
- Verification dates remain visible.
- Build passes.

---

## Work Chunk 6 — New Here: Orientation Flagship

**Session goal:** Turn `/new` into the shareable incoming-student guide.

**Bet:** Orientation content is the easiest high-trust wedge for students and parents.

**User/job:** A first-year, transfer, or grad student wants to avoid being clueless in Claremont.

**Riskiest assumption:** Opinionated local content will outperform generic SEO guide content.

### Scope

Modify:

- `src/app/new/page.tsx`
- `src/app/new/new-guide.tsx`
- potentially create subroutes under `src/app/guides/`:
  - `/guides/20-things`
  - `/guides/getting-to-la`
  - `/guides/cheap-eats`
  - `/guides/study-spots`

Content modules:

- First 24 hours
- First week
- First month
- First semester
- 20 things every incoming 5C student should know
- What each campus is like / social geography
- How to get to LA without a car
- Best cheap food
- Best study spots
- How not to get isolated on one campus

Existing source note:

- `/Users/ronnie/Development/ideas/claremont-new-student-content.md` already has strong outline material.

### Acceptance criteria

- `/new` feels like a destination, not a small checklist.
- Content is screenshot/share-friendly.
- It links into Eat, Deals, Events, Housing, Map.
- Build passes.

---

## Work Chunk 7 — Housing: “Don’t Get Screwed” Layer

**Session goal:** Reframe Housing from listings/map into a practical student survival tool.

**Bet:** Housing is high-stakes enough to create repeat usage and trust.

**User/job:** Student or grad student wants to know where to live, what is walkable, what is overpriced, and what red flags to avoid.

**Riskiest assumption:** We can add useful guidance without creating legal/liability or moderation problems.

### Scope

Modify:

- `src/app/housing/page.tsx`
- `src/app/housing/housing-map.tsx`
- `src/app/housing/zone-panel.tsx`
- `src/app/housing/zones.ts`

Build:

- “Where students actually live” explainer.
- Walkability zones and commute reality.
- Red flags checklist.
- Typical rents / price expectations if data exists.
- Housing timeline: when to start looking.
- Optional future: landlord notes / sublet board, moderated.

### Acceptance criteria

- Housing page sets expectations clearly before map interaction.
- Student sees practical guidance even if listings are sparse.
- Build passes.

---

## Work Chunk 8 — Community → Campus Pulse

**Session goal:** Reframe Community/Know from Reddit feed into a broader student/city pulse.

**Bet:** Students want a quick sense of what people are talking about, not a raw Reddit clone.

**User/job:** See what is trending, urgent, weird, useful, or relevant across the 5Cs and Claremont.

**Riskiest assumption:** Aggregated feeds can be useful without feeling noisy or sketchy.

### Scope

Modify:

- `src/app/know/page.tsx`
- `src/app/know/community-feed.tsx`
- nav labels in `DesktopNav.tsx`, `BottomNav.tsx`, maybe `constants.ts`

Rename/reframe:

- “Community” → “Pulse” or “Campus Pulse”
- Include Reddit, future Student Life headlines, local notices, weather/air alerts, transit disruptions, etc.

Build:

- Better filters:
  - Campus
  - City
  - Housing
  - Food
  - Safety
  - Transit
  - Events
- Add “source” trust/labeling.
- Avoid making Reddit the whole identity.

### Acceptance criteria

- Page copy explains what Pulse is.
- Existing Reddit feed still works.
- Nav label is clearer.
- Build passes.

---

## Work Chunk 9 — Personalization and Campus Context

**Session goal:** Let students choose their campus/preferences and have the site bias content accordingly.

**Bet:** A Pomona student, Mudd student, Scripps student, CMC student, Pitzer student, CGU student, and KGI student all need different defaults.

**User/job:** “Show me what matters to me first, but keep the whole 5C world available.”

**Riskiest assumption:** Lightweight local preference storage is enough before accounts.

### Scope

Create/modify:

- `src/components/CampusPreference.tsx`
- `src/lib/preferences.ts`
- integrate in Homepage, Events, Eat/Housing if useful.

Build:

- “Choose your campus” prompt.
- Store in localStorage; no account required.
- Use preference to sort/filter content, not hide everything else.
- Add reset/change campus affordance.

### Acceptance criteria

- Campus preference persists locally.
- Homepage/events can prioritize preferred campus.
- No auth required.
- Build passes.

---

## Work Chunk 10 — Student Voice / Correspondent Layer

**Session goal:** Make the site feel inhabited by students, not just scraped data.

**Bet:** One sentence from a real student can beat ten polished institutional cards.

**User/job:** Get opinionated picks, tips, and campus-specific local knowledge.

**Riskiest assumption:** Lightweight editorial content can be maintained consistently.

### Scope

Add content surfaces:

- “Student pick of the week”
- “Pomona pick / CMC pick / Mudd survival tip / Scripps study spot / Pitzer weird thing worth doing / CGU-KGI grad corner”
- Bylines or anonymous correspondent labels.

Implementation options:

- Start with local static content file.
- Later move to Supabase/CMS/admin workflow.

### Acceptance criteria

- Homepage has one small human/editorial module.
- Content is easy to update.
- No complex CMS needed in first pass.
- Build passes.

---

## Work Chunk 11 — Shareable Guides and Growth Loops

**Session goal:** Make content easy to share in group chats, orientation tables, Instagram, and newsletters.

**Bet:** Students discover utilities through friends, not SEO alone.

**User/job:** Share a useful Claremont guide with a roommate/friend/group chat.

### Scope

Build guide pages/cards:

- 20 things every incoming 5C student should know
- Best cheap eats near the 5Cs
- What is open late tonight
- Free food this week
- Move-in week survival map
- Getting to LA from Claremont
- Where to take your parents
- Best study spots by vibe

Add:

- share button
- screenshot-friendly cards
- QR-friendly landing pages
- newsletter CTA on each guide

### Acceptance criteria

- At least one guide page is polished and shareable.
- Page includes links into utility sections.
- Build passes.

---

## Work Chunk 12 — Polish, Analytics, Trust, and Launch Readiness

**Session goal:** Tighten the site into something credible enough to promote.

**Scope**

- Clarify nav labels.
- Add freshness/last-updated indicators.
- Add source labels and correction/report links.
- Add privacy note around newsletter.
- Add analytics events if already configured or approved.
- Check accessibility and mobile spacing.
- Run Lighthouse/performance pass.
- Verify no stale events on homepage.

### Acceptance criteria

- `npm run build` passes.
- Main pages work on mobile and desktop:
  - `/`
  - `/events`
  - `/eat`
  - `/deals`
  - `/new`
  - `/housing`
  - `/know` or renamed `/pulse`
- Event/data failures degrade gracefully.
- Newsletter CTA has clear value and no-spam/privacy reassurance.

---

## Recommended Session Order

1. Homepage Daily Utility Layer
2. Events Student Discovery
3. Event Submission / Source Expansion
4. Eat Student Tags
5. Deals Verified Student Discount Wedge
6. New Here Flagship Guide
7. Housing “Don’t Get Screwed”
8. Community → Campus Pulse
9. Campus Personalization
10. Student Voice
11. Shareable Guides
12. Polish / Analytics / Launch Readiness

---

## Standard Verification Per Session

Before finishing any implementation session:

```bash
npm run build
```

If relevant tests exist or are added:

```bash
npm test
# or specific test command if package.json changes
```

Also run a local browser smoke check on touched routes.

If a session modifies data fetch behavior, verify empty/error states.

---

## Notes for Future Hamilton Sessions

- Do not stage or alter existing untracked 3D/explore files unless the task explicitly targets Explore.
- Keep the site student-first; avoid generic city-guide language.
- Prefer small shippable improvements over a giant redesign.
- Preserve Ron's local-taste advantage: opinionated, useful, humane, not SEO mush.
- Monetization should follow student trust, not precede it.
