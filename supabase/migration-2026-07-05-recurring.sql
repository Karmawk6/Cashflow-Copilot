-- Recurring payments (schedules that auto-generate invoices) + Gmail connections
-- Run this whole file in the Supabase SQL editor.
-- (Reminder: the editor runs ONLY the highlighted text if any is selected — click
--  into the editor and press Cmd+A before Run, or make sure nothing is selected.)

-- =============================================================================
-- RECURRING SCHEDULES
-- A schedule describes a repeating payment a client owes: an open-ended
-- retainer, or a fixed-term payment plan (e.g. CDFI loan repayment).
-- The daily cron turns due schedules into ordinary invoices, so all existing
-- overdue detection, follow-ups, and analytics keep working unchanged.
-- =============================================================================
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'retainer' CHECK (kind IN ('retainer', 'payment_plan')),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  frequency TEXT NOT NULL DEFAULT 'monthly'
    CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  next_due_date DATE NOT NULL,
  -- keeps monthly/quarterly/yearly dates from drifting when a month is short
  -- (Jan 31 -> Feb 28 -> Mar 31, not Mar 28); set from the first due date
  anchor_day SMALLINT NOT NULL DEFAULT 1 CHECK (anchor_day BETWEEN 1 AND 31),
  end_date DATE,
  total_installments INTEGER CHECK (total_installments IS NULL OR total_installments >= 1),
  installments_generated INTEGER NOT NULL DEFAULT 0,
  remind_days_before INTEGER NOT NULL DEFAULT 3 CHECK (remind_days_before BETWEEN 0 AND 30),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  payment_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- payment plans must know how many installments they run for
  CHECK (kind = 'retainer' OR total_installments IS NOT NULL)
);

CREATE TRIGGER update_recurring_schedules_updated_at
  BEFORE UPDATE ON recurring_schedules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members access recurring_schedules" ON recurring_schedules
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

CREATE INDEX IF NOT EXISTS idx_recurring_schedules_org ON recurring_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_client ON recurring_schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_due ON recurring_schedules(status, next_due_date);

-- =============================================================================
-- LINK GENERATED INVOICES BACK TO THEIR SCHEDULE
-- =============================================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS
  recurring_schedule_id UUID REFERENCES recurring_schedules(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_recurring ON invoices(recurring_schedule_id);

-- =============================================================================
-- NEW FOLLOW-UP / TEMPLATE TYPE: courtesy reminder BEFORE a payment is due
-- =============================================================================
ALTER TABLE follow_up_events DROP CONSTRAINT IF EXISTS follow_up_events_type_check;
ALTER TABLE follow_up_events ADD CONSTRAINT follow_up_events_type_check
  CHECK (type IN ('invoice_reminder', 'proposal_followup', 'ghosted_checkin', 'payment_upcoming'));

ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_type_check;
ALTER TABLE email_templates ADD CONSTRAINT email_templates_type_check
  CHECK (type IN ('proposal_followup', 'invoice_reminder', 'second_reminder', 'final_nudge', 'ghosted_checkin', 'payment_upcoming'));

ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_entity_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_entity_type_check
  CHECK (entity_type IN ('invoice', 'proposal', 'client', 'follow_up', 'recurring_schedule'));

-- =============================================================================
-- DEFAULT GLOBAL TEMPLATE FOR UPCOMING PAYMENTS (org_id NULL = shared, read-only)
-- =============================================================================
INSERT INTO email_templates (organization_id, name, type, tone, subject, body, is_default)
SELECT NULL, 'Upcoming payment reminder', 'payment_upcoming', 'friendly',
  'Upcoming payment: Invoice {{invoice_number}} due {{due_date}}',
  E'Hi {{contact_name}},\n\nJust a friendly heads-up that your next payment of {{amount}} (Invoice {{invoice_number}}) is due on {{due_date}}.\n\nIf your payment is already on the way, no action is needed — thank you! Otherwise, you can arrange it at your convenience.\n\n{{#payment_link}}You can pay securely here: {{payment_link}}{{/payment_link}}\n\nThanks as always,\n{{sender_name}}',
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates
  WHERE organization_id IS NULL AND type = 'payment_upcoming' AND is_default
);

-- =============================================================================
-- GMAIL CONNECTIONS (send follow-ups from the user's own Gmail via OAuth)
-- Tokens are only ever readable by the user they belong to — there is
-- deliberately NO teammate/org read policy on this table.
-- =============================================================================
CREATE TABLE IF NOT EXISTS gmail_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  gmail_address TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_gmail_connections_updated_at
  BEFORE UPDATE ON gmail_connections FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

ALTER TABLE gmail_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own gmail connection" ON gmail_connections
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
