import { NextRequest, NextResponse } from 'next/server';
import {
  classifyStreetviewPath,
  getServerMapsKey,
  isAllowedOrigin,
  isValidPanoIdsBody,
} from '@/lib/streetview-guard';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

const API_KEY = getServerMapsKey();
const BASE = 'https://tile.googleapis.com/v1/streetview';

// Every proxied request spends paid Google quota, and the Origin/Referer check
// is spoofable by non-browser clients — so rate limit per IP as a second layer.
// Loading one pano costs ~9 GETs (1 metadata + 8 tiles); 900/5min allows ~100
// panos per window, far above real walking pace but well below bulk scraping.
function throttle(req: NextRequest, bucket: string, limit: number, windowMs: number) {
  const ip = getClientIp(req);
  if (!ip && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const result = rateLimit(bucket, ip ?? 'dev-local', limit, windowMs);
  if (!result.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) },
      },
    );
  }
  return null;
}

// Query params we forward to Google. Anything else (especially `key`) is dropped.
const ALLOWED_QUERY_PARAMS = new Set(['session', 'panoId']);

function filteredQueryString(req: NextRequest): string {
  const out = new URLSearchParams();
  for (const [k, v] of req.nextUrl.searchParams.entries()) {
    if (ALLOWED_QUERY_PARAMS.has(k)) out.set(k, v);
  }
  // Key is injected server-side only — never from the caller.
  out.set('key', API_KEY as string);
  return out.toString();
}

function reject(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (!API_KEY) return reject(500, 'Server misconfigured');
  if (!isAllowedOrigin(req)) return reject(403, 'Forbidden');

  const throttled = throttle(req, 'streetview-get', 900, 5 * 60 * 1000);
  if (throttled) return throttled;

  const { path } = await params;
  const classified = classifyStreetviewPath(path, 'GET');
  if (!classified) return reject(404, 'Not found');

  const segment = path.join('/');
  const url = `${BASE}/${segment}?${filteredQueryString(req)}`;
  const res = await fetch(url);
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream';

  // Only long-cache successful responses; errors must not poison the edge cache.
  const cacheControl = res.ok
    ? 'public, max-age=86400'
    : 'no-store';

  if (contentType.startsWith('image/')) {
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: res.status,
      headers: { 'Content-Type': contentType, 'Cache-Control': cacheControl },
    });
  }
  const data = await res.json();
  return NextResponse.json(data, {
    status: res.status,
    headers: { 'Cache-Control': cacheControl },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (!API_KEY) return reject(500, 'Server misconfigured');
  if (!isAllowedOrigin(req)) return reject(403, 'Forbidden');

  // panoIds lookups are one-per-click, not one-per-tile — keep this tighter.
  const throttled = throttle(req, 'streetview-post', 60, 10 * 60 * 1000);
  if (throttled) return throttled;

  const { path } = await params;
  const classified = classifyStreetviewPath(path, 'POST');
  if (!classified) return reject(404, 'Not found');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return reject(400, 'Invalid JSON');
  }

  if (classified.kind === 'panoIds' && !isValidPanoIdsBody(body)) {
    return reject(400, 'Invalid body');
  }

  const segment = path.join('/');
  const url = `${BASE}/${segment}?${filteredQueryString(req)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const contentType = res.headers.get('content-type') ?? 'application/json';
  if (contentType.includes('json')) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }
  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    status: res.status,
    headers: { 'Content-Type': contentType },
  });
}
