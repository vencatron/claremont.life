# Housing Map Spec — Interactive 3D Overhead Map of Claremont

## Overview
Replace the current `/housing` page with an immersive, interactive satellite/3D overhead map of Claremont, CA centered on the 7 Claremont Colleges (34.1015, -117.7113). The map should show 4 shaded neighborhood zones where students typically find housing. Each zone is clickable/hoverable, revealing local insights, rent ranges, and rental listings from Supabase. Google Street View imagery is critical — students moving to Claremont want to SEE where they're living.

## Tech Stack
- **Next.js** (already in project) — this is the app at `src/app/housing/page.tsx`
- **Google Maps JavaScript API** with:
  - **Map ID** for cloud-based styling (or use programmatic styling)
  - **45° satellite/aerial tilt** for the 3D overhead feel
  - **Street View Service** for embedded street-level photos
- **@vis.gl/react-google-maps** (Google's official React wrapper) — install it
- **Supabase** data already wired — `getHousingListings()` in `src/lib/data.ts` returns all listings
- **Google Maps API Key**: `AIzaSyBHKrgVTYsnP_ehNjQj7whLQj_VznOBnhk`
  - Add to `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
  - This key has Places, Maps JS, and Street View enabled

## The 4 Neighborhood Zones

### 1. College Ave Corridor (The Heart)
- **Bounds**: Roughly College Ave from Foothill Blvd north to 12th St
- **Approx polygon center**: 34.104, -117.710
- **Color**: Green overlay (#22c55e at 20% opacity)
- **Vibe**: Walking distance to all 5Cs. Most popular. Goes fast in spring.
- **Rent**: Studio $1,400-$1,800 | 1BR $1,700-$2,200 | 2BR shared $1,100-$1,400/person
- **Key insight**: "The gold standard — you'll pay more but never need a car. Most 5C students live here."

### 2. The Village & Claremont Heights (Downtown)
- **Bounds**: Area around 1st St / Yale Ave / Bonita Ave, north to Foothill
- **Approx polygon center**: 34.096, -117.720
- **Color**: Blue overlay (#3b82f6 at 20% opacity)
- **Vibe**: Near shops, restaurants, Metrolink. Slightly older buildings. Walkable.
- **Rent**: Studio $1,300-$1,700 | 1BR $1,600-$2,100
- **Key insight**: "Best of both worlds — village dining and nightlife at your door, campus a 10-min walk."

### 3. Indian Hill Blvd Corridor (South Side)
- **Bounds**: Indian Hill Blvd from Arrow Hwy south to San Jose Ave
- **Approx polygon center**: 34.088, -117.718
- **Color**: Orange overlay (#f97316 at 20% opacity)
- **Vibe**: Quieter, more space, 10-min bike ride to campus. Better value.
- **Rent**: Studio $1,200-$1,500 | 1BR $1,500-$1,900
- **Key insight**: "Bigger units, quieter streets, and your wallet will thank you. Bike path to campus is flat and easy."

### 4. North Claremont / Padua Hills
- **Bounds**: North of Foothill Blvd, up toward Mt. Baldy Rd
- **Approx polygon center**: 34.115, -117.710
- **Color**: Purple overlay (#8b5cf6 at 20% opacity)
- **Vibe**: Up the hill. You need a car or a very good bike. Cheapest rents.
- **Rent**: Studio $1,000-$1,400 | 1BR $1,300-$1,700
- **Key insight**: "Mountain views and the cheapest rent in Claremont. Trade: you're driving everywhere."

## UI/UX Requirements

### Map Behavior
- **Initial view**: Satellite/hybrid map, slight tilt (45° if available), zoom ~15 centered on 34.1015, -117.7113
- **Scrollable/pannable** in all directions (standard Google Maps interaction)
- **4 polygon overlays** for the zones, semi-transparent fills with colored borders
- **Desktop**: Zones highlight on hover (increase opacity to 40%), click to expand detail panel
- **Mobile**: Tap zone to expand detail panel (no hover)
- **Colleges marker**: Small label or marker showing "The Claremont Colleges" at center

### Zone Detail Panel
When a zone is clicked/tapped, show a **slide-up panel** (mobile) or **side panel** (desktop):
1. **Zone name & vibe description** (from the data above)
2. **Rent range cards** (Studio / 1BR / 2BR)
3. **Street View embed** — show 1-2 Google Street View panoramas from that neighborhood. Use the Street View Image API or embed. Pick representative coordinates.
4. **Rental listings** from Supabase that fall within that zone's polygon (filter by lat/lng)
5. **Local tips** (e.g., "Check if unit has AC — Inland Empire hits 100°F+", "Street parking near colleges is a nightmare")

### Street View Integration (CRITICAL)
- Use Google Street View Static API or the JS `StreetViewPanorama` embedded in cards
- For each zone, embed 2-3 street view perspectives showing what the neighborhood actually looks like
- These are the money shots — incoming students want to SEE the streets, the buildings, the vibe
- Representative Street View locations per zone:
  - College Ave: 34.105, -117.710 (looking south down College Ave)
  - Village: 34.096, -117.720 (1st St / Village shops)  
  - Indian Hill: 34.088, -117.718 (residential stretch)
  - Padua Hills: 34.118, -117.708 (mountain views)

### Listing Cards (within zone panel)
Each rental listing card shows:
- Name, address
- Rating (stars)
- Distance to campus
- Walkability badge (🚶🚲🚌🚗)
- Website link, phone, Google Maps link
- One Street View thumbnail if available at that lat/lng

### Mobile-First
- This is primarily a mobile experience
- Zone panel slides up from bottom, takes ~60% of screen
- Swipe down to dismiss
- Map stays interactive behind panel
- Bottom nav should still be accessible

### Design Language
- Match existing claremont.life aesthetic (clean, white cards, subtle shadows, Playfair Display for headings)
- Use the existing `PageHeader` component for the page title
- Colors from Tailwind defaults are fine
- Animations: subtle fade-in on zone hover, smooth panel slide

## Existing Code to Know About
- `src/lib/data.ts` — `getHousingListings()` fetches all from Supabase
- `src/types/index.ts` — `HousingListing` type with lat, lng, walkability, etc.
- `src/lib/supabase.ts` — Supabase client
- `src/components/PageHeader.tsx` — standard page header
- `src/components/BottomNav.tsx` — fixed bottom nav (housing = "Live" tab)
- Current page at `src/app/housing/page.tsx` — REPLACE entirely
- Tailwind CSS is configured
- Playfair Display font available as `var(--font-playfair)`

## Files to Create/Modify
1. `src/app/housing/page.tsx` — server component, fetches data, passes to client
2. `src/app/housing/housing-map.tsx` — main client component with Google Maps
3. `src/app/housing/zone-panel.tsx` — the detail panel component
4. `src/app/housing/zones.ts` — zone definitions (polygons, colors, descriptions, street view coords)
5. Install `@vis.gl/react-google-maps` package
6. Add `NEXT_PUBLIC_GOOGLE_MAPS_KEY` to `.env.local`

## "Before You Sign" Tips (include somewhere in UI)
1. Check if the unit has AC. The Inland Empire gets 100°F+ in summer. Non-negotiable.
2. Ask for month-to-month after the initial lease. Many landlords agree if you ask.
3. Street parking near colleges is a nightmare. If no dedicated spot, factor that in.
4. Laundry in-unit vs shared matters more than you think. Ask before signing.
5. If the unit faces Foothill Blvd, visit at night first. Traffic noise is real.
6. Summer sublets are everywhere — check 5C Facebook housing groups starting in March.

## Build & Deploy
- After building, run `npx next build` to verify no errors
- The Vercel deployment happens separately — just make sure it builds clean
- DO NOT run vercel deploy

## What Success Looks Like
A student browsing on their phone can:
1. See an aerial map of Claremont with 4 glowing neighborhood zones
2. Tap "College Ave Corridor" → see rent ranges, street view photos of the actual streets, and real rental listings
3. Tap a listing → see its website, rating, phone number
4. Pan around the map, discover other zones
5. Feel like they actually KNOW the neighborhood before visiting
