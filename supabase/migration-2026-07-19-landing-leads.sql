-- Landing-page lead capture — 2026-07-19
-- Visitors who aren't ready to book a call can leave their email on the
-- landing page; the server action inserts here with the service-role key and
-- notifies the founder. Run once in the SQL editor (safe to re-run).
-- Fresh databases get all of this from schema.sql directly.

-- =============================================================================
-- LANDING LEADS (public email capture)
-- =============================================================================
CREATE TABLE IF NOT EXISTS landing_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Normalize on write so duplicates collapse case-insensitively — the UNIQUE
-- constraint then guarantees one row per address (repo idiom, same as
-- approved_emails; citext deliberately not introduced).
CREATE OR REPLACE FUNCTION public.normalize_landing_lead_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email := lower(trim(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_normalize_landing_lead_email ON landing_leads;
CREATE TRIGGER trg_normalize_landing_lead_email
  BEFORE INSERT OR UPDATE ON landing_leads
  FOR EACH ROW EXECUTE FUNCTION normalize_landing_lead_email();

-- Deliberately NO policies: only the service-role key (the landing-page
-- server action) and the Supabase dashboard can read or write this table.
-- The anon and authenticated roles see nothing — no public read, ever.
ALTER TABLE landing_leads ENABLE ROW LEVEL SECURITY;
