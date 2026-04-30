import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the service_role key. Bypasses RLS, so
 * this module MUST NOT be imported from any client component or shared with
 * the browser bundle.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABAS_SERVICE_KEY ??
    process.env.SUPABASS_TOKEN;
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin client requires SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL, plus SUPABASE_SERVICE_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABAS_SERVICE_KEY, or SUPABASS_TOKEN',
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
