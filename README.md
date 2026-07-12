# Duebird

Collections and follow-up automation for consultants, agencies, and CDFIs. Track unpaid invoices, stale proposals, and ghosted leads — then draft and send smart follow-up emails.

## 5-minute demo setup

1. Create a free project at [supabase.com](https://supabase.com) → SQL Editor → paste and run all of `supabase/schema.sql`
2. In `.env.local`, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API). Leave `NEXT_PUBLIC_DEMO_MODE=true`
3. `npm run dev` → sign up → complete onboarding → click **Load demo data**

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
- Follow-up engine with priority scoring (low → critical based on age + amount)
- AI-generated follow-up emails with tone control (friendly / professional / firm)
- Email templates (per-type + custom)
- Activity log
- Analytics: recovered revenue, win rate, avg payment speed
- CSV import for clients, invoices, proposals
- Daily cron job to auto-mark invoices overdue and create follow-up events
- Demo seed data

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
| `OPENAI_API_KEY` | No | Falls back to template-based drafts |
| `RESEND_API_KEY` | No | Falls back to console logging |
| `RESEND_FROM_EMAIL` | No | Sender address for outbound emails |
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

## Architecture

```
app/
  (auth)/           — login, signup, onboarding
  (dashboard)/      — all authenticated pages
  api/              — AI email gen, email send, CSV import, seed, cron
lib/
  actions/          — Server Actions (CRUD + business logic)
  ai/               — OpenAI email generation
  email/            — Resend email sending
  follow-up-engine/ — Pure functions: priority, needs-follow-up, dashboard summary
  supabase/         — Supabase client helpers (server + browser)
components/
  ui/               — shadcn/ui primitives
  clients/          — Client form
  invoices/         — Invoice form
  proposals/        — Proposal form
  settings/         — Follow-up rules form
  shared/           — Badges, empty states, sidebar, header
types/
  database.ts       — Full TypeScript types + Supabase Database generic
supabase/
  schema.sql        — Complete Postgres schema with RLS policies
```

### Multi-tenancy

One user = one organization (MVP model). All tables have `organization_id`. RLS policies use a `get_user_org_id()` SQL function to ensure users can only see their own data.

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

- Client portal (shareable payment links with invoice status)
- Stripe integration for payment tracking
- Zapier / webhook on invoice paid
- Team members (multi-user orgs)
- PDF invoice generation
- Recurring invoice templates
- Email open tracking via pixel
