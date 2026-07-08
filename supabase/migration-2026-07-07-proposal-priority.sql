-- Manual priority override for proposals — companion to
-- migration-2026-07-06-priority-override.sql, which added the same to invoices.
-- Run this whole file in the Supabase SQL editor.
-- (Reminder: the editor runs ONLY the highlighted text if any is selected — click
--  into the editor and press Cmd+A before Run, or make sure nothing is selected.)

-- =============================================================================
-- priority_manual: once a user picks a proposal's priority by hand, the daily
-- cron and the on-login live sync leave `priority` alone. The age-based
-- sent → follow_up_due status flip still happens regardless — that reflects
-- how long the client has been silent, not the subjective priority label.
-- =============================================================================
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS priority_manual BOOLEAN NOT NULL DEFAULT FALSE;
