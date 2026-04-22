-- Migration 005: Enable Row Level Security on all public tables
--
-- CRITICAL SECURITY FIX
-- ---------------------
-- Supabase flagged that public tables had RLS disabled. Because the frontend
-- ships NEXT_PUBLIC_SUPABASE_ANON_KEY in the browser, any visitor with the
-- project URL could read, insert, update, or delete rows directly via
-- PostgREST without RLS policies in place.
--
-- Policy model
-- ------------
--   * Content tables (events, eats, housing, deals, businesses, eat_places,
--     reddit_posts) are publicly readable — the site renders them to anyone.
--   * newsletter_subscribers allows anon INSERT only (signup form); reads
--     and modifications are denied to anon/authenticated roles. Admins use
--     the service_role key.
--   * No anon/authenticated write policies are created for content tables;
--     the scrapers connect with SUPABASE_SERVICE_KEY which bypasses RLS, so
--     ingestion is unaffected.
--
-- This migration is idempotent and uses DO blocks so it's safe to run even
-- when a table or policy does not exist.

-- ---------------------------------------------------------------------------
-- Helper: enable RLS + public SELECT policy for a content table
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  content_tables text[] := ARRAY[
    'events',
    'eats',
    'housing',
    'deals',
    'businesses',
    'eat_places',
    'reddit_posts'
  ];
BEGIN
  FOREACH t IN ARRAY content_tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);

      -- Drop any prior public read policy (idempotent replay) and recreate
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                     t || '_public_select', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
        t || '_public_select', t
      );
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- newsletter_subscribers: no anon access at all.
--
-- The /api/newsletter server route uses the service_role key (bypasses RLS)
-- to insert validated, rate-limited signups. Removing the anon INSERT policy
-- closes the direct-to-Supabase backdoor, so the server route is the only
-- supported path.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'newsletter_subscribers'
  ) THEN
    ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.newsletter_subscribers FORCE ROW LEVEL SECURITY;

    -- Clean slate: drop any legacy policies (including prior revisions of
    -- this migration that granted anon INSERT).
    DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
    DROP POLICY IF EXISTS newsletter_subscribers_public_select
      ON public.newsletter_subscribers;
    DROP POLICY IF EXISTS newsletter_subscribers_anon_insert
      ON public.newsletter_subscribers;
    -- No policies created → anon/authenticated get zero access; service_role
    -- bypasses RLS and retains full access for the server route and admins.
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Verification block: fail the migration if any known public table is still
-- missing RLS. This prevents a silent regression in future environments.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  unprotected text;
BEGIN
  SELECT string_agg(c.relname, ', ')
    INTO unprotected
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND c.relname IN (
       'events','eats','housing','deals',
       'businesses','eat_places','reddit_posts',
       'newsletter_subscribers'
     )
     AND (c.relrowsecurity = false OR c.relforcerowsecurity = false);

  IF unprotected IS NOT NULL THEN
    RAISE EXCEPTION 'RLS/FORCE RLS not enabled on: %', unprotected;
  END IF;
END $$;
