-- Security hardening migration — 2026-07-03
-- For databases created from schema.sql BEFORE this date (fresh databases get
-- all of this from schema.sql directly). Run once in the Supabase SQL editor.
--
-- Fixes:
--  1. CRITICAL: any user could point profiles.organization_id at another org
--     and gain full access to that org's data via get_user_org_id().
--  2. HIGH: global default email templates (organization_id IS NULL) were
--     deletable/updatable by any authenticated user.
--  3. Pins search_path on SECURITY DEFINER functions (Supabase linter hardening).

-- 3. Pin search_path on existing SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- 1. Tenant-isolation guard: profiles.organization_id may only point at an org
--    the profile's user owns. (Relax via an invitations check when multi-user
--    orgs are added.)
CREATE OR REPLACE FUNCTION public.enforce_profile_org_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.organization_id IS DISTINCT FROM OLD.organization_id)
     AND NOT EXISTS (
       SELECT 1 FROM organizations
       WHERE id = NEW.organization_id AND owner_id = NEW.id
     )
  THEN
    RAISE EXCEPTION 'profiles.organization_id must reference an organization owned by this user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE TRIGGER enforce_profile_org_ownership
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_org_ownership();

-- 2. Replace the combined email_templates policy with split read/write policies
DROP POLICY IF EXISTS "Access org templates and defaults" ON email_templates;
DROP POLICY IF EXISTS "Read org templates and defaults" ON email_templates;
DROP POLICY IF EXISTS "Insert org templates" ON email_templates;
DROP POLICY IF EXISTS "Update org templates" ON email_templates;
DROP POLICY IF EXISTS "Delete org templates" ON email_templates;

CREATE POLICY "Read org templates and defaults" ON email_templates
  FOR SELECT
  USING (organization_id = get_user_org_id() OR organization_id IS NULL);

CREATE POLICY "Insert org templates" ON email_templates
  FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Update org templates" ON email_templates
  FOR UPDATE
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Delete org templates" ON email_templates
  FOR DELETE
  USING (organization_id = get_user_org_id());

-- Sanity check: existing profiles must already satisfy the new guard
-- (in the one-user-one-org MVP model they all should). Any rows returned
-- here would fail future updates — fix them manually if any appear.
SELECT p.id, p.organization_id
FROM profiles p
JOIN organizations o ON o.id = p.organization_id
WHERE o.owner_id <> p.id;
