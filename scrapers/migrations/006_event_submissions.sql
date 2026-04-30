-- Migration 006: Event submission review queue
--
-- Public event submissions are accepted only by the Next.js server route using
-- the Supabase service_role key. Browser anon/authenticated clients must not be
-- able to read or write this pending review queue directly.

CREATE TABLE IF NOT EXISTS public.event_submissions (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT        NOT NULL,
  starts_at       TIMESTAMPTZ NOT NULL,
  location        TEXT        NOT NULL,
  campus_or_org   TEXT        NOT NULL,
  audience        TEXT        NOT NULL,
  event_url       TEXT,
  food_free_cost  TEXT,
  notes           TEXT,
  submitter_email TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending',
  is_verified     BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_submissions
  ADD COLUMN IF NOT EXISTS title           TEXT,
  ADD COLUMN IF NOT EXISTS starts_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS location        TEXT,
  ADD COLUMN IF NOT EXISTS campus_or_org   TEXT,
  ADD COLUMN IF NOT EXISTS audience        TEXT,
  ADD COLUMN IF NOT EXISTS event_url       TEXT,
  ADD COLUMN IF NOT EXISTS food_free_cost  TEXT,
  ADD COLUMN IF NOT EXISTS notes           TEXT,
  ADD COLUMN IF NOT EXISTS submitter_email TEXT,
  ADD COLUMN IF NOT EXISTS status          TEXT,
  ADD COLUMN IF NOT EXISTS is_verified     BOOLEAN,
  ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ;

ALTER TABLE public.event_submissions
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN starts_at SET NOT NULL,
  ALTER COLUMN location SET NOT NULL,
  ALTER COLUMN campus_or_org SET NOT NULL,
  ALTER COLUMN audience SET NOT NULL,
  ALTER COLUMN submitter_email SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN is_verified SET DEFAULT false,
  ALTER COLUMN is_verified SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'event_submissions_status_pending'
      AND conrelid = 'public.event_submissions'::regclass
  ) THEN
    ALTER TABLE public.event_submissions
      ADD CONSTRAINT event_submissions_status_pending CHECK (status = 'pending');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'event_submissions_unverified'
      AND conrelid = 'public.event_submissions'::regclass
  ) THEN
    ALTER TABLE public.event_submissions
      ADD CONSTRAINT event_submissions_unverified CHECK (is_verified = false);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_submissions_created_at
  ON public.event_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_submissions_starts_at
  ON public.event_submissions(starts_at);

DROP TRIGGER IF EXISTS set_event_submissions_updated_at ON public.event_submissions;
CREATE TRIGGER set_event_submissions_updated_at
  BEFORE UPDATE ON public.event_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_submissions FORCE ROW LEVEL SECURITY;

-- Clean slate: no RLS policies are created, so anon/authenticated users have
-- no direct SELECT/INSERT/UPDATE/DELETE access. The server route uses the
-- service_role key, which bypasses RLS.
DO $$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_submissions'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.event_submissions',
      existing_policy.policyname
    );
  END LOOP;
END $$;

REVOKE ALL ON TABLE public.event_submissions FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.event_submissions FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.event_submissions FROM authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_submissions TO service_role;
  END IF;
END $$;

DO $$
DECLARE
  policy_count integer;
  rls_enabled boolean;
  force_rls_enabled boolean;
BEGIN
  SELECT relrowsecurity, relforcerowsecurity
    INTO rls_enabled, force_rls_enabled
    FROM pg_class
   WHERE oid = 'public.event_submissions'::regclass;

  IF rls_enabled IS DISTINCT FROM true OR force_rls_enabled IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'RLS/FORCE RLS not enabled on public.event_submissions';
  END IF;

  SELECT count(*) INTO policy_count
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'event_submissions';

  IF policy_count <> 0 THEN
    RAISE EXCEPTION 'event_submissions must not expose RLS policies to anon/authenticated users';
  END IF;
END $$;

COMMENT ON TABLE public.event_submissions IS
  'Private pending event submission review queue; accessed by server route with service_role only.';
