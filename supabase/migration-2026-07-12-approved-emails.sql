-- Invite-only access migration — 2026-07-12
-- Duebird is pay-first: after a client pays their invoice, the owner adds
-- their email to approved_emails (Supabase table editor) and signup starts
-- working for that address. Run once in the SQL editor (safe to re-run).
-- Fresh databases get all of this from schema.sql directly.

-- =============================================================================
-- APPROVED EMAILS (signup allowlist)
-- =============================================================================
CREATE TABLE IF NOT EXISTS approved_emails (
  email TEXT PRIMARY KEY,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Normalize on write so table-editor entries always match code lookups
-- (the signup action compares against lower(trim(email))).
CREATE OR REPLACE FUNCTION public.normalize_approved_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email := lower(trim(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_normalize_approved_email ON approved_emails;
CREATE TRIGGER trg_normalize_approved_email
  BEFORE INSERT OR UPDATE ON approved_emails
  FOR EACH ROW EXECUTE FUNCTION normalize_approved_email();

-- Deliberately NO policies: only the service-role key (server-side signup
-- check) and the Supabase dashboard can read or write this table. The anon
-- and authenticated roles see nothing — no client-side enumeration.
ALTER TABLE approved_emails ENABLE ROW LEVEL SECURITY;
