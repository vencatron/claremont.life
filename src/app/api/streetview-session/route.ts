import { NextRequest, NextResponse } from 'next/server';
import { getServerMapsKey, isAllowedOrigin, isValidSessionBody } from '@/lib/streetview-guard';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

const API_KEY = getServerMapsKey();

function reject(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  if (!API_KEY) return reject(500, 'Server misconfigured');
  if (!isAllowedOrigin(req)) return reject(403, 'Forbidden');

  // The client caches one session per page load, so 30/10min per IP is ample
  // for real use while blocking scripted session farming on our paid key.
  const ip = getClientIp(req);
  if (!ip && process.env.NODE_ENV !== 'development') {
    return reject(400, 'Invalid request');
  }
  const limit = rateLimit('streetview-session', ip ?? 'dev-local', 30, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return reject(400, 'Invalid JSON');
  }

  if (!isValidSessionBody(body)) return reject(400, 'Invalid body');

  const res = await fetch(
    `https://tile.googleapis.com/v1/createSession?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
