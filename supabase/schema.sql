-- CashFlow Copilot Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ORGANIZATIONS (workspaces)
-- =============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_type TEXT DEFAULT 'consulting' CHECK (business_type IN ('consulting', 'agency', 'freelance')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PROFILES
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CLIENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'ghosted', 'prospect')),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  last_contact_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PROPOSALS
-- =============================================================================
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  proposal_number TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  sent_date DATE,
  expiration_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'follow_up_due', 'won', 'lost')),
  priority TEXT DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  follow_up_cadence_days INTEGER DEFAULT 3,
  last_follow_up_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INVOICES
-- =============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  title TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'partially_paid', 'cancelled')),
  priority TEXT DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  payment_link TEXT,
  notes TEXT,
  last_reminder_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- EMAIL TEMPLATES
-- =============================================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('proposal_followup', 'invoice_reminder', 'second_reminder', 'final_nudge', 'ghosted_checkin')),
  tone TEXT DEFAULT 'professional' CHECK (tone IN ('friendly', 'professional', 'firm')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- FOLLOW-UP EVENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS follow_up_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('invoice_reminder', 'proposal_followup', 'ghosted_checkin')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'skipped')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  email_subject TEXT,
  email_body TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- FOLLOW-UP RULES (per org configuration)
-- =============================================================================
CREATE TABLE IF NOT EXISTS follow_up_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('proposal', 'invoice', 'ghosted_lead')),
  days_until_followup INTEGER NOT NULL DEFAULT 3,
  days_until_escalate INTEGER DEFAULT 7,
  days_until_critical INTEGER DEFAULT 14,
  auto_send BOOLEAN DEFAULT FALSE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, type)
);

-- =============================================================================
-- ACTIVITIES (audit log)
-- =============================================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('invoice', 'proposal', 'client', 'follow_up')),
  entity_id UUID,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_follow_up_events_updated_at
  BEFORE UPDATE ON follow_up_events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_follow_up_rules_updated_at
  BEFORE UPDATE ON follow_up_rules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- organizations: owner can manage their own org
CREATE POLICY "Users manage their own organization" ON organizations
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- profiles: users manage their own profile
CREATE POLICY "Users manage their own profile" ON profiles
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Helper function: get org id for current user
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- clients: org-scoped
CREATE POLICY "Org members access clients" ON clients
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- proposals: org-scoped
CREATE POLICY "Org members access proposals" ON proposals
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- invoices: org-scoped
CREATE POLICY "Org members access invoices" ON invoices
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- email templates: org templates or global defaults (org_id IS NULL)
CREATE POLICY "Access org templates and defaults" ON email_templates
  USING (organization_id = get_user_org_id() OR organization_id IS NULL)
  WITH CHECK (organization_id = get_user_org_id());

-- follow_up_events: org-scoped
CREATE POLICY "Org members access follow_up_events" ON follow_up_events
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- follow_up_rules: org-scoped
CREATE POLICY "Org members access follow_up_rules" ON follow_up_rules
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- activities: org-scoped
CREATE POLICY "Org members access activities" ON activities
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_proposals_org ON proposals(organization_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_events_org ON follow_up_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_events_status ON follow_up_events(status);
CREATE INDEX IF NOT EXISTS idx_activities_org ON activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
