import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

// RFC 5321 caps total length at 254; we enforce that plus a conservative
// character set that excludes HTML-dangerous chars (<, >, ", ') so stored
// values can never smuggle an XSS payload into an admin UI.
const EMAIL_MAX_LEN = 254;
const EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;

function validateEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed.length > EMAIL_MAX_LEN) return null;
  if (!EMAIL_RE.test(trimmed)) return null;
  return trimmed;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!ip) {
    // No X-Forwarded-For — the request did not traverse Vercel's proxy. In
    // dev there's no proxy either, so allow an explicit dev bypass; in prod
    // treat it as a direct attack path and reject.
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, message: 'Invalid request.' },
        { status: 400 },
      );
    }
  }

  // 5 signup attempts per IP per 10 minutes. Covers typos without letting a
  // scripted attacker bulk-pollute the table.
  const limit = rateLimit('newsletter', ip ?? 'dev-local', 5, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, message: 'Too many signup attempts. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request.' },
      { status: 400 },
    );
  }

  const email = validateEmail((body as { email?: unknown } | null)?.email);
  if (!email) {
    return NextResponse.json(
      { success: false, message: 'Please enter a valid email.' },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Try again.' },
      { status: 500 },
    );
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, message: 'Already subscribed.' },
        { status: 409 },
      );
    }
    // Log server-side; never surface DB error codes/messages to the client.
    console.error('newsletter insert failed:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Try again.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "You're in. See you Tuesday.",
  });
}
