/**
 * Request guards for /api/streetview* proxies.
 *
 * The proxies inject our paid Google Maps API key into upstream requests, so
 * every route here must:
 *   1) confirm the request originates from a trusted front-end origin
 *   2) restrict the upstream path/method/body to the shapes the app actually
 *      sends — no wildcards.
 *
 * Why: without these checks, `/api/streetview/<anything>` becomes an open
 * proxy that turns our API key into free Google Maps Platform credit for
 * anyone on the internet.
 */

const DEFAULT_ORIGINS = [
  'https://claremont.life',
  'https://www.claremont.life',
  'http://localhost:3000',
];

function getAllowedOrigins(): string[] {
  const envList = process.env.STREETVIEW_ALLOWED_ORIGINS;
  const fromEnv = envList
    ? envList.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  // Vercel sets VERCEL_URL to the current deployment's hostname (no scheme).
  // Honor it so preview deploys work without extra config.
  const vercel = process.env.VERCEL_URL
    ? [`https://${process.env.VERCEL_URL}`]
    : [];

  return [...DEFAULT_ORIGINS, ...fromEnv, ...vercel];
}

export function isAllowedOrigin(req: Request): boolean {
  const allowed = getAllowedOrigins();

  const origin = req.headers.get('origin');
  if (origin) return allowed.includes(origin);

  // Same-origin fetches from some browsers omit Origin on GET — fall back to
  // Referer, which they do send. Neither header is tamper-proof, so this is
  // a cheap filter, not a security boundary on its own.
  const referer = req.headers.get('referer');
  if (referer) {
    try {
      return allowed.includes(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  return false;
}

type PathKind =
  | { kind: 'panoIds' }
  | { kind: 'metadata' }
  | { kind: 'tiles'; zoom: string; x: string; y: string };

/**
 * Validate the `[...path]` segments against the narrow set of Google Maps
 * Tiles API endpoints the app uses. Rejects anything else.
 */
export function classifyStreetviewPath(
  segments: string[],
  method: 'GET' | 'POST',
): PathKind | null {
  if (segments.length === 0) return null;
  const [head, ...rest] = segments;

  if (head === 'panoIds' && rest.length === 0 && method === 'POST') {
    return { kind: 'panoIds' };
  }
  if (head === 'metadata' && rest.length === 0 && method === 'GET') {
    return { kind: 'metadata' };
  }
  if (head === 'tiles' && rest.length === 3 && method === 'GET') {
    const [zoom, x, y] = rest;
    const isNonNegInt = (s: string) => /^\d+$/.test(s) && s.length <= 3;
    if (!isNonNegInt(zoom) || !isNonNegInt(x) || !isNonNegInt(y)) return null;
    return { kind: 'tiles', zoom, x, y };
  }
  return null;
}

/** Body shape for POST /api/streetview/panoIds. */
export function isValidPanoIdsBody(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  const allowedKeys = new Set(['locations', 'radius']);
  for (const k of Object.keys(b)) if (!allowedKeys.has(k)) return false;

  if (!Array.isArray(b.locations) || b.locations.length === 0) return false;
  if (b.locations.length > 25) return false; // generous per-call cap
  for (const loc of b.locations) {
    if (typeof loc !== 'object' || loc === null) return false;
    const l = loc as Record<string, unknown>;
    if (typeof l.lat !== 'number' || typeof l.lng !== 'number') return false;
    if (l.lat < -90 || l.lat > 90 || l.lng < -180 || l.lng > 180) return false;
    for (const k of Object.keys(l)) {
      if (k !== 'lat' && k !== 'lng') return false;
    }
  }
  if (b.radius !== undefined) {
    if (typeof b.radius !== 'number' || b.radius <= 0 || b.radius > 1000) {
      return false;
    }
  }
  return true;
}

/** Body shape for POST /api/streetview-session. */
export function isValidSessionBody(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  const allowedKeys = new Set(['mapType', 'language', 'region']);
  for (const k of Object.keys(b)) if (!allowedKeys.has(k)) return false;

  if (b.mapType !== 'streetview') return false;
  if (b.language !== undefined && (typeof b.language !== 'string' || b.language.length > 10)) {
    return false;
  }
  if (b.region !== undefined && (typeof b.region !== 'string' || b.region.length > 5)) {
    return false;
  }
  return true;
}
