# Duebird

Collections and follow-up automation for consultants, agencies, and CDFIs. Track unpaid invoices, stale proposals, and ghosted leads — then draft and send smart follow-up emails.

Live at [duebird.io](https://duebird.io). Access is **invite-only**: prospects book a call from the landing page; after they pay, the owner approves their email and they can sign up (see [Invite-only access](#invite-only-access)).

## 5-minute demo setup

1. Create a free project at [supabase.com](https://supabase.com) → SQL Editor → paste and run all of `supabase/schema.sql`
2. In `.env.local`, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API). Leave `NEXT_PUBLIC_DEMO_MODE=true`
3. Signup is gated by an allowlist: in the Supabase Table Editor, add your email to `approved_emails`
4. `npm run dev` → sign up → complete onboarding → click **Load demo data**

Demo mode uses template-based AI email drafts (no OpenAI key needed) and logs emails to console instead of sending (no Resend key needed).

## Tech stack

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **Supabase** — auth, Postgres database, Row Level Security
- **Tailwind CSS v4** + shadcn/ui components
- **OpenAI gpt-4o-mini** — AI email generation
- **Resend** — transactional email
- **Vercel** — hosting + cron jobs

## Features

- Dashboard: money at risk, overdue invoices, stale proposals, follow-ups due
- Full CRUD for Clients, Proposals, Invoices
- Recurring schedules (retainers / payment plans) that auto-generate invoices via the daily cron
- Follow-up engine with priority scoring (low → critical based on age + amount) and manual priority overrides
- AI-generated follow-up emails with tone control (friendly / professional / firm) — a human always reviews and hits send
- Email templates (per-type + custom)
- Multi-user workspaces: owners invite teammates by email and can remove members from Settings → Team
- Invite-only signup gated by an `approved_emails` allowlist
- Activity log
- Analytics: recovered revenue, win rate, avg payment speed
- CSV import for clients, invoices, proposals
- Daily cron job to auto-mark invoices overdue and create follow-up events
- Demo seed data
- Marketing landing page (dark theme, CSS-only animations, FAQ) with "Book a call" as the sole CTA

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd duebird
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL editor, run the full schema from `supabase/schema.sql`
3. Copy your project URL and anon key

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | From Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | From Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only. Powers the signup allowlist check and the daily cron — signup fails closed without it |
| `NEXT_PUBLIC_APP_URL` | Yes (prod) | Public base URL, used in signup confirmation redirects |
| `OPENAI_API_KEY` | No | Falls back to template-based drafts |
| `RESEND_API_KEY` | No | Falls back to console logging |
| `RESEND_FROM_EMAIL` | No | Sender address for outbound emails |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Optional Gmail OAuth sending (see `GMAIL_SETUP.md`) |
| `CRON_SECRET` | Yes (prod) | Auth token for the daily cron endpoint |
| `NEXT_PUBLIC_DEMO_MODE` | No | Set `true` to skip real API calls |

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, complete onboarding, and start adding clients.

To load demo data: visit `/api/seed` (only works in dev or demo mode).

## Deploy to Vercel

```bash
npx vercel --prod
```

Add all environment variables in the Vercel dashboard. The `vercel.json` cron job (`/api/cron/daily-check` at 08:00 UTC daily) requires a Pro plan or higher.

Note: pushing to GitHub does **not** trigger a deploy on this project — always deploy with `npx vercel --prod`.

## Invite-only access

Duebird is pay-first: the landing page's only call to action is **Book a call** (Calendly). There is no public self-serve signup.

**How a client gets access:**

1. Prospect books a call from [duebird.io](https://duebird.io)
2. After they pay the invoice, add their email to the `approved_emails` table (Supabase Table Editor → Insert row; a trigger lowercases/trims it)
3. Send them `duebird.io/signup` — signup succeeds only for approved emails, creates their account, and they build their workspace in onboarding

**How the gate works** (`lib/actions/auth.ts`):

- `signup` rejects any email that is not in `approved_emails` **and** has no pending teammate invitation, before the auth user is ever created. Teammates invited from Settings can therefore sign up without being individually approved.
- `completeOnboarding` additionally requires the allowlist for *creating a new workspace* — invited teammates join an existing workspace via the Join card instead.
- Both checks run pre-auth with the service-role client (`lib/supabase/admin.ts`) because RLS hides these tables from the anon key, and they fail closed if the lookup errors.

Existing databases need `supabase/migration-2026-07-12-approved-emails.sql` (fresh databases get the table from `schema.sql`). All migrations live in `supabase/migration-*.sql` and are run manually in the SQL editor, oldest first.

## Architecture

```
app/
  page.tsx          — landing page (thin composition of components/landing/*)
  (auth)/           — login, signup, onboarding
  (dashboard)/      — all authenticated pages
  (legal)/          — public /terms and /privacy pages
  api/              — AI email gen, email send, CSV import, seed, cron
lib/
  actions/          — Server Actions (CRUD + business logic; entity-priority.ts is the shared priority-update core)
  ai/               — OpenAI email generation
  api/              — Shared API-route helpers (http.ts: JSON error responses)
  email/            — Resend email sending
  follow-up-engine/ — Pure functions: priority, needs-follow-up, dashboard summary
  gmail/            — Gmail OAuth + per-user sending (optional, see GMAIL_SETUP.md)
  hooks/            — Client hooks (use-run-action.ts: mutation + toast pattern)
  supabase/         — Supabase client helpers (server + browser + admin/service-role + org guards)
components/
  landing/          — landing page sections (hero, FAQ, screenshots, scroll-reveal, …)
  ui/               — shadcn/ui primitives
  clients/          — Client form
  invoices/         — Invoice form
  proposals/        — Proposal form
  settings/         — Follow-up rules, team invitations + member removal, Gmail connection
  shared/           — Badges, priority select, form errors, empty states, sidebar, header
types/
  database.ts       — Full TypeScript types + Supabase Database generic
supabase/
  schema.sql        — Complete Postgres schema with RLS policies
  migration-*.sql   — Incremental migrations for existing databases (run in SQL editor)
  email-templates/  — Branded Supabase auth email templates + setup README
public/
  screenshots/      — Product screenshots embedded on the landing page
```

### Code conventions

Reuse these shared helpers instead of re-inlining the patterns:

- **Server actions** start with the org guards in `lib/supabase/guards.ts` (`requireUser` / `requireOrg`) rather than hand-rolling auth + org lookups.
- **API routes** return errors through `lib/api/http.ts` so status codes and JSON shapes stay consistent.
- **Client mutation buttons** (anything that calls a server action and toasts the result) go through `useRunAction` (`lib/hooks/use-run-action.ts`).
- **Form errors** render with `components/shared/form-error.tsx`.
- **Priority updates** for invoices/proposals share one core in `lib/actions/entity-priority.ts`.

### Multi-tenancy

Each user's profile points at one organization. Owners create a workspace in onboarding; teammates join an existing workspace via email invitations (Settings → Team). All tables have `organization_id`, and RLS policies use a `get_user_org_id()` SQL function plus a tenant-guard trigger so users can only see and join orgs they own or were invited to.

### Landing page motion

All animation is CSS (`@theme` keyframes in `app/globals.css`: gradient pan, fade-up, orb float, accordion) plus one small IntersectionObserver component (`components/landing/scroll-reveal.tsx`) for scroll-in reveals. Every animation utility sits behind `motion-safe:`, and `ScrollReveal` has `motion-reduce:` overrides, so users with reduced motion get a fully static, fully visible page. No animation library is installed — keep it that way unless there's a strong reason.

### Follow-up priority

| Age | Invoice | Proposal |
|---|---|---|
| < 7 days overdue / < 3 days no reply | medium | — |
| 1–7 days overdue / 3–7 days no reply | medium | medium |
| 8–21 days / 7–14 days | high | high |
| > 21 days / > 14 days | critical | critical |

### Email generation

When `OPENAI_API_KEY` is set, the AI reads context (client name, amount, invoice number, days overdue) and generates a subject + body in the selected tone. Without an API key (or in demo mode), it uses built-in template strings.

## Suggested next features

- Password reset flow (none exists today — users who forget their password are stuck)
- Self-service account deletion (the privacy policy currently promises email-based deletion within 30 days)
- Client portal (shareable payment links with invoice status)
- Stripe integration for payment tracking
- Zapier / webhook on invoice paid
- PDF invoice generation
- Email open tracking via pixel
- Auto-send toggle for zero-click payment reminders (`follow_up_rules.auto_send`)
- Rate limiting on the signup action (the invite-only rejection message can be probed)
- Small admin page for managing `approved_emails` (today: Supabase Table Editor)
- Real testimonial quotes + stats to replace the landing page placeholders
