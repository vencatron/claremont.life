-- Migration 002: Eats (restaurants & food businesses) table
-- Tracks restaurants, cafes, and food spots in the Claremont area

CREATE TABLE IF NOT EXISTS eats (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT        NOT NULL,
  description     TEXT,
  cuisine_type    TEXT,        -- 'Italian', 'Mexican', 'Burgers', 'Coffee', 'Sushi', etc.
  price_range     TEXT,        -- '$', '$$', '$$$', '$$$$'
  address         TEXT,
  phone           TEXT,
  website         TEXT,
  menu_url        TEXT,
  hours           JSONB,       -- { "mon": "11am-9pm", "tue": "11am-9pm", ... }
  rating          NUMERIC(3,2), -- e.g. 4.25
  review_count    INTEGER,
  features        TEXT[],      -- ['delivery', 'takeout', 'dine-in', 'outdoor_seating', 'student_discount']
  image_url       TEXT,
  google_place_id TEXT,
  yelp_id         TEXT,
  source          TEXT        NOT NULL,  -- 'google_places', 'yelp', 'manual'
  source_id       TEXT,                  -- dedupe key from source
  is_active       BOOLEAN     DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_eats_cuisine ON eats(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_eats_source  ON eats(source);
CREATE INDEX IF NOT EXISTS idx_eats_active  ON eats(is_active) WHERE is_active = true;

DROP TRIGGER IF EXISTS set_eats_updated_at ON eats;
CREATE TRIGGER set_eats_updated_at
  BEFORE UPDATE ON eats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
