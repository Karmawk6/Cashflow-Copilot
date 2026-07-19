# Branding Supabase auth emails (sender + template)

Two dashboard changes make signup emails come from **Duebird <noreply@duebird.io>**
with branded content instead of "Supabase Auth <noreply@mail.app.supabase.io>".
Both live at https://supabase.com/dashboard → project `stsdtserysibovopwhkv`.

> **Status (2026-07-18):** Step 1 (custom SMTP) is **done** — production signup
> emails already send from `Duebird <noreply@duebird.io>` via a dedicated Resend
> key (`duebird-supabase-smtp`). Step 2 (the branded templates — Confirm signup
> AND Reset Password) is **still pending**: the first Confirm-signup paste
> didn't save during a Supabase dashboard incident, so both templates still use
> the Supabase defaults. Do step 2 below for both and confirm the subject lines
> changed by sending a test email.

## 1. Custom SMTP (fixes the sender) — DONE

Project Settings → Authentication → **SMTP Settings** → enable **Custom SMTP**:

| Field | Value |
|---|---|
| Sender email | `noreply@duebird.io` |
| Sender name | `Duebird` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | a Resend API key (production uses a dedicated key named `duebird-supabase-smtp`) |

The duebird.io domain is already verified in Resend, so no DNS work is needed.
Bonus: custom SMTP lifts Supabase's ~3-emails/hour built-in limit — after
enabling, raise the email rate limit under Authentication → Rate Limits
(e.g. 60/hour).

## 2. Branded templates (fixes the content) — PENDING

Authentication → **Email Templates**, one template at a time (Code view,
replace everything). After saving each one, **reload the dashboard page and
confirm the body/subject persisted** — a previous paste was silently lost
during a dashboard incident.

**Confirm signup:**

- Subject: `Confirm your email — Duebird`
- Body: paste the contents of `confirm-signup.html`

**Reset Password:**

- Subject: `Reset your password — Duebird`
- Body: paste the contents of `reset-password.html`

Both links target the app's `/auth/confirm` route via
`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=...` — Site URL
must be `https://duebird.io` (Authentication → URL Configuration). The reset
flow works even before the paste (Supabase's default template goes through the
`?code=` redirect path), but the email is unbranded until then.

Other templates (Invite user, Magic Link) are unused by the app today; rebrand
them later if those flows ship.
