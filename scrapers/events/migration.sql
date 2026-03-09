-- Migration 001: Events table
-- Tracks public events from Claremont Colleges and the City of Claremont

CREATE TABLE IF NOT EXISTS events (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  college     TEXT,        -- 'Pomona', 'CMC', 'Harvey Mudd', 'Scripps', 'Pitzer', 'CGU', 'KGI', or NULL for city events
  event_type  TEXT,        -- 'lecture', 'concert', 'sports', 'social', 'workshop', etc.
  location    TEXT,
  address     TEXT,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ,
  url         TEXT,
  image_url   TEXT,
  source      TEXT        NOT NULL,  -- 'pomona_calendar', 'cmc_calendar', 'eventbrite', 'city_claremont', etc.
  source_id   TEXT,                  -- dedupe key from source
  is_active   BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_source    ON events(source);
CREATE INDEX IF NOT EXISTS idx_events_college   ON events(college);
CREATE INDEX IF NOT EXISTS idx_events_active    ON events(is_active) WHERE is_active = true;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_events_updated_at ON events;
CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
