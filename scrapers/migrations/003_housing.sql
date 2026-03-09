-- Migration 003: Housing (rentals near Claremont Colleges) table
-- Tracks rental listings in and around Claremont, CA

CREATE TABLE IF NOT EXISTS housing (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT        NOT NULL,
  description     TEXT,
  listing_type    TEXT,        -- 'apartment', 'house', 'room', 'studio', 'condo'
  bedrooms        INTEGER,
  bathrooms       NUMERIC(3,1),
  rent_monthly    INTEGER,     -- USD/month
  sqft            INTEGER,
  address         TEXT,
  neighborhood    TEXT,        -- 'Downtown Claremont', 'Near Pomona', 'Village', etc.
  distance_to_5c  TEXT,        -- e.g. '0.5 miles to Pomona'
  amenities       TEXT[],      -- ['parking', 'laundry', 'pets_ok', 'furnished', 'utilities_included']
  available_date  DATE,
  lease_term      TEXT,        -- '12 months', 'month-to-month', 'summer only', etc.
  contact_email   TEXT,
  contact_phone   TEXT,
  url             TEXT,
  image_url       TEXT,
  source          TEXT        NOT NULL,  -- 'craigslist', 'zillow', 'apartments_com', 'manual'
  source_id       TEXT,                  -- dedupe key from source
  is_active       BOOLEAN     DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_housing_rent     ON housing(rent_monthly);
CREATE INDEX IF NOT EXISTS idx_housing_type     ON housing(listing_type);
CREATE INDEX IF NOT EXISTS idx_housing_source   ON housing(source);
CREATE INDEX IF NOT EXISTS idx_housing_active   ON housing(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_housing_avail    ON housing(available_date);

DROP TRIGGER IF EXISTS set_housing_updated_at ON housing;
CREATE TRIGGER set_housing_updated_at
  BEFORE UPDATE ON housing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
