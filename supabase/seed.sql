-- Duebird Demo Seed Data
-- Run this AFTER creating a user account and completing onboarding.
-- Replace 'YOUR_USER_ID' and 'YOUR_ORG_ID' with actual values from Supabase.

-- This script is for reference. The app creates demo data via the /api/seed endpoint.

-- Default email templates (global — no org_id)
INSERT INTO email_templates (organization_id, name, type, tone, subject, body, is_default) VALUES
(NULL, 'Proposal Follow-Up (Friendly)', 'proposal_followup', 'friendly',
  'Quick check-in on your proposal',
  'Hi {{contact_name}},

I wanted to follow up on the proposal I sent over for {{proposal_title}}. I know things get busy — just wanted to make sure it landed in your inbox and see if you had any questions.

Happy to jump on a quick call to walk through anything. Just reply here or grab a time on my calendar.

Looking forward to working together!

Best,
{{sender_name}}', true),

(NULL, 'Invoice Reminder (Professional)', 'invoice_reminder', 'professional',
  'Invoice {{invoice_number}} — Payment Due {{due_date}}',
  'Hi {{contact_name}},

I hope this message finds you well. I''m writing to follow up on Invoice {{invoice_number}} for {{amount}}, which was due on {{due_date}}.

If you''ve already processed this payment, please disregard this message. If not, I''d appreciate it if you could arrange payment at your earliest convenience.

{{#payment_link}}You can pay securely here: {{payment_link}}{{/payment_link}}

Please don''t hesitate to reach out if you have any questions.

Best regards,
{{sender_name}}', true),

(NULL, 'Second Reminder (Firm)', 'second_reminder', 'firm',
  'Second Notice: Invoice {{invoice_number}} — {{days_overdue}} Days Past Due',
  'Hi {{contact_name}},

This is a follow-up to my previous message regarding Invoice {{invoice_number}} for {{amount}}, which is now {{days_overdue}} days past the due date of {{due_date}}.

I''d appreciate your prompt attention to this matter. Please process payment or reach out to discuss if there''s an issue.

{{#payment_link}}Payment link: {{payment_link}}{{/payment_link}}

Thank you,
{{sender_name}}', true),

(NULL, 'Final Nudge (Firm)', 'final_nudge', 'firm',
  'Final Notice: Invoice {{invoice_number}} Requires Immediate Attention',
  'Hi {{contact_name}},

I''m reaching out one more time regarding Invoice {{invoice_number}} for {{amount}}, which is now significantly overdue.

I value our working relationship and want to resolve this promptly. Please arrange payment or contact me immediately to discuss your situation.

{{#payment_link}}Payment link: {{payment_link}}{{/payment_link}}

I look forward to hearing from you.

{{sender_name}}', true),

(NULL, 'Ghosted Lead Check-In (Friendly)', 'ghosted_checkin', 'friendly',
  'Still thinking about working together?',
  'Hi {{contact_name}},

I wanted to reach out since we haven''t connected in a while. I know things can get hectic, and following up on vendor decisions often slips to the bottom of the list.

If you''re still interested in moving forward, I''d love to reconnect. If the timing isn''t right or you''ve gone in a different direction, no worries at all — just let me know and I''ll update my records.

Either way, it was great connecting with you.

{{sender_name}}', true);
