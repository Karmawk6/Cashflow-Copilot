-- Manual priority override for invoices.
-- Run this whole file in the Supabase SQL editor.
-- (Reminder: the editor runs ONLY the highlighted text if any is selected — click
--  into the editor and press Cmd+A before Run, or make sure nothing is selected.)

-- =============================================================================
-- priority_manual: once a user sets an invoice's priority by hand, both the
-- daily cron and the on-login live sync must leave `priority` alone (status
-- still auto-updates to 'overdue' regardless — that reflects objective
-- payment state, not a subjective priority label).
-- =============================================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS priority_manual BOOLEAN NOT NULL DEFAULT FALSE;
