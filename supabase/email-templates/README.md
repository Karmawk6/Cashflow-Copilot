# Branding Supabase auth emails (sender + template)

Two dashboard changes make signup emails come from **Duebird <noreply@duebird.io>**
with branded content instead of "Supabase Auth <noreply@mail.app.supabase.io>".
Both live at https://supabase.com/dashboard → project `stsdtserysibovopwhkv`.

## 1. Custom SMTP (fixes the sender)

Project Settings → Authentication → **SMTP Settings** → enable **Custom SMTP**:

| Field | Value |
|---|---|
| Sender email | `noreply@duebird.io` |
| Sender name | `Duebird` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | the Resend API key (same value as `RESEND_API_KEY` in `.env.local`) |

The duebird.io domain is already verified in Resend, so no DNS work is needed.
Bonus: custom SMTP lifts Supabase's ~3-emails/hour built-in limit — after
enabling, raise the email rate limit under Authentication → Rate Limits
(e.g. 60/hour).

## 2. Branded template (fixes the content)

Authentication → **Email Templates** → **Confirm signup**:

- Subject: `Confirm your email — Duebird`
- Body: paste the contents of `confirm-signup.html` (Code view, replace everything)

The link uses `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`,
which is the app's confirm route — Site URL must be `https://duebird.io`
(Authentication → URL Configuration).

Other templates (Invite user, Magic Link, Reset Password) are unused by the app
today; rebrand them later if those flows ship.
