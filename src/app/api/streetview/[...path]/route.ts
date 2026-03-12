import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;
const BASE = 'https://tile.googleapis.com/v1/streetview';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const segment = path.join('/');
  const qs = req.nextUrl.searchParams;
  qs.set('key', API_KEY);
  const url = `${BASE}/${segment}?${qs.toString()}`;
  const res = await fetch(url);
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream';

  if (contentType.startsWith('image/')) {
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: res.status,
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' },
    });
  }
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const segment = path.join('/');
  const qs = req.nextUrl.searchParams;
  qs.set('key', API_KEY);
  const url = `${BASE}/${segment}?${qs.toString()}`;
  const body = await req.json();
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
  return new NextResponse(buf, { status: res.status, headers: { 'Content-Type': contentType } });
}
