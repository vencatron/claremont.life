import { NextRequest, NextResponse } from 'next/server';
import { isAllowedOrigin, isValidSessionBody } from '@/lib/streetview-guard';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

function reject(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  if (!API_KEY) return reject(500, 'Server misconfigured');
  if (!isAllowedOrigin(req)) return reject(403, 'Forbidden');

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
