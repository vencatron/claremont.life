/**
 * fetch-street-view.ts
 * Downloads Google Street View Static API images for named buildings in Claremont Village.
 * Run with: node --experimental-strip-types src/app/explore/data/fetch-street-view.ts
 *       or: npx tsx src/app/explore/data/fetch-street-view.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? 'AIzaSyBHKrgVTYsnP_ehNjQj7whLQj_VznOBnhk';
const OUTPUT_DIR = path.resolve(__dirname, '../../../../public/explore/textures/buildings');
const CENTER_LAT = 34.0965;
const CENTER_LNG = -117.7185;

// ─── Types ───────────────────────────────────────────────────
interface Building {
  id: number;
  name: string;
  type: string;
  footprint: number[][];
  height: number;
}

interface Business {
  name: string;
  type: string;
  x: number;
  z: number;
  height?: number;
}

interface VillageData {
  center: { lat: number; lng: number };
  buildings: Building[];
  streets: Array<{ points: number[][]; width: number; type: string }>;
}

interface EnrichmentData {
  businesses: Business[];
  heightOverrides: Array<{ name: string; height: number }>;
  typeHeightDefaults: Record<string, number>;
}

// ─── Helpers ─────────────────────────────────────────────────

/** Convert local x/z (meters from center) to lat/lng */
function xzToLatLng(x: number, z: number): { lat: number; lng: number } {
  const lat = CENTER_LAT + z / 111320;
  const lng = CENTER_LNG + x / (111320 * Math.cos(CENTER_LAT * Math.PI / 180));
  return { lat, lng };
}

/** Slugify a building name for use as a filename */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Calculate heading (degrees, 0=north, 90=east) from building centroid pointing
 * toward scene center so the camera shows the street-facing facade.
 */
function calcHeading(cx: number, cz: number): number {
  // Direction from building to center (0,0) — camera should face this way
  const dx = 0 - cx;
  const dz = 0 - cz;
  // Compass bearing: atan2(east, north)
  const bearing = Math.atan2(dx, dz) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

/** Download a URL to a file path, resolving the promise when done */
function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        console.warn(`  ⚠ HTTP ${res.statusCode} for ${url}`);
        resolve(false);
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      file.close();
      try { fs.unlinkSync(destPath); } catch {}
      console.warn(`  ⚠ Error: ${err.message}`);
      resolve(false);
    });
  });
}

/** Pause for ms milliseconds (rate limiting) */
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  // Load data
  const villageData: VillageData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'village-data.json'), 'utf-8')
  );
  const enrichmentData: EnrichmentData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'business-enrichment.json'), 'utf-8')
  );

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Collect named buildings: OSM buildings with names + enriched businesses
  const namedBuildings: Array<{ name: string; cx: number; cz: number }> = [];
  const seen = new Set<string>();

  // OSM buildings with names
  for (const b of villageData.buildings) {
    if (!b.name || seen.has(b.name)) continue;
    const fp = b.footprint;
    const cx = fp.reduce((s, p) => s + p[0], 0) / fp.length;
    const cz = fp.reduce((s, p) => s + p[1], 0) / fp.length;
    namedBuildings.push({ name: b.name, cx, cz });
    seen.add(b.name);
  }

  // Enriched businesses
  for (const biz of enrichmentData.businesses) {
    if (!biz.name || seen.has(biz.name)) continue;
    namedBuildings.push({ name: biz.name, cx: biz.x, cz: biz.z });
    seen.add(biz.name);
  }

  console.log(`\n📸 Fetching Street View for ${namedBuildings.length} named buildings...\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const { name, cx, cz } of namedBuildings) {
    const slug = nameToSlug(name);
    const destPath = path.join(OUTPUT_DIR, `${slug}.jpg`);

    // Skip if already downloaded
    if (fs.existsSync(destPath)) {
      console.log(`  ⏩ ${name} (${slug}.jpg) — already exists`);
      skipCount++;
      continue;
    }

    const { lat, lng } = xzToLatLng(cx, cz);
    const heading = calcHeading(cx, cz);

    const url = [
      'https://maps.googleapis.com/maps/api/streetview',
      `?size=512x256`,
      `&location=${lat.toFixed(7)},${lng.toFixed(7)}`,
      `&heading=${heading.toFixed(1)}`,
      `&pitch=0`,
      `&fov=90`,
      `&key=${API_KEY}`,
    ].join('');

    process.stdout.write(`  📷 ${name} → heading ${heading.toFixed(0)}° ... `);

    const ok = await downloadFile(url, destPath);
    if (ok) {
      // Check if it's the "no imagery" grey image (< 5 KB)
      const stat = fs.statSync(destPath);
      if (stat.size < 4096) {
        fs.unlinkSync(destPath);
        console.log('no imagery (skipped)');
        failCount++;
      } else {
        console.log(`✅ (${Math.round(stat.size / 1024)}KB)`);
        successCount++;
      }
    } else {
      failCount++;
    }

    // Rate-limit: ~3 requests/sec to stay within API quotas
    await sleep(350);
  }

  console.log(`\n✨ Done: ${successCount} downloaded, ${skipCount} skipped, ${failCount} failed\n`);
  console.log(`Images saved to: ${OUTPUT_DIR}\n`);
}

main().catch(console.error);
