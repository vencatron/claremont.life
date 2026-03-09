-- Migration 004: Deals (student discounts & local offers) table
-- Tracks deals and discounts available to Claremont college students

CREATE TABLE IF NOT EXISTS deals (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name    TEXT        NOT NULL,
  deal_title       TEXT        NOT NULL,
  description      TEXT,
  category         TEXT,        -- 'food', 'retail', 'entertainment', 'services', 'health', 'transport'
  discount_type    TEXT,        -- 'percent', 'fixed', 'bogo', 'free_item', 'special_price'
  discount_value   TEXT,        -- '10%', '$5 off', '2-for-1', etc.
  requirements     TEXT,        -- 'Show student ID', 'Valid .edu email', etc.
  address          TEXT,
  website          TEXT,
  colleges         TEXT[],      -- which colleges this applies to (empty = all)
  valid_from       DATE,
  valid_until      DATE,
  is_recurring     BOOLEAN     DEFAULT false, -- true if this is an ongoing deal (not expiring)
  image_url        TEXT,
  source           TEXT        NOT NULL,      -- 'manual', 'unidays', 'student_beans', 'scraped'
  source_id        TEXT,                      -- dedupe key from source
  is_active        BOOLEAN     DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_deals_category  ON deals(category);
CREATE INDEX IF NOT EXISTS idx_deals_source    ON deals(source);
CREATE INDEX IF NOT EXISTS idx_deals_active    ON deals(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_deals_valid     ON deals(valid_until) WHERE valid_until IS NOT NULL;

DROP TRIGGER IF EXISTS set_deals_updated_at ON deals;
CREATE TRIGGER set_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
