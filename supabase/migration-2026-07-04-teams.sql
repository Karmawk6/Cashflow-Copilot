-- Multi-user workspaces migration — 2026-07-04
-- Adds email invitations so an org owner can bring teammates into their
-- workspace. Run once in the Supabase SQL editor (safe to re-run).
-- Fresh databases get all of this from schema.sql directly.

-- =============================================================================
-- INVITATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(lower(email));

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manages org invitations" ON invitations;
CREATE POLICY "Owner manages org invitations" ON invitations
  USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Invitee reads own invitations" ON invitations;
CREATE POLICY "Invitee reads own invitations" ON invitations
  FOR SELECT
  USING (lower(email) = lower(auth.jwt()->>'email'));

-- =============================================================================
-- MEMBERS CAN READ SHARED ORG DATA
-- =============================================================================
-- organizations RLS was owner-only; members need to read their own org row.
DROP POLICY IF EXISTS "Members read their organization" ON organizations;
CREATE POLICY "Members read their organization" ON organizations
  FOR SELECT
  USING (id = get_user_org_id());

-- profiles RLS was self-only; members need to see teammates in Settings.
DROP POLICY IF EXISTS "Members read org teammates" ON profiles;
CREATE POLICY "Members read org teammates" ON profiles
  FOR SELECT
  USING (organization_id IS NOT NULL AND organization_id = get_user_org_id());

-- =============================================================================
-- TENANT GUARD: also allow joining via accepted invitation
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enforce_profile_org_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.organization_id IS DISTINCT FROM OLD.organization_id)
     AND NOT EXISTS (
       SELECT 1 FROM organizations
       WHERE id = NEW.organization_id AND owner_id = NEW.id
     )
     AND NOT EXISTS (
       SELECT 1 FROM invitations i
       JOIN auth.users u ON u.id = NEW.id
       WHERE i.organization_id = NEW.organization_id
         AND lower(i.email) = lower(u.email)
         AND i.status = 'accepted'
     )
  THEN
    RAISE EXCEPTION 'profiles.organization_id must reference an organization owned by this user or one they were invited to';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- =============================================================================
-- INVITATION FLOW FUNCTIONS
-- =============================================================================
-- Lists pending invitations for the signed-in user's email, with org names
-- (invitee can't read organizations directly before joining).
CREATE OR REPLACE FUNCTION public.my_pending_invitations()
RETURNS TABLE (id UUID, organization_name TEXT, role TEXT) AS $$
  SELECT i.id, o.name, i.role
  FROM invitations i
  JOIN organizations o ON o.id = i.organization_id
  WHERE lower(i.email) = lower(auth.jwt()->>'email')
    AND i.status = 'pending';
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- Atomically accepts an invitation addressed to the caller's email:
-- marks it accepted, then points the caller's profile at the org
-- (the accepted row satisfies the tenant guard above).
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_id UUID)
RETURNS VOID AS $$
DECLARE
  inv RECORD;
BEGIN
  SELECT * INTO inv FROM invitations
  WHERE id = invitation_id
    AND status = 'pending'
    AND lower(email) = lower(auth.jwt()->>'email');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found, already used, or not addressed to this account';
  END IF;

  UPDATE invitations SET status = 'accepted', accepted_at = NOW() WHERE id = inv.id;

  UPDATE profiles
  SET organization_id = inv.organization_id, onboarded = TRUE
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
