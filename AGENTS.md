<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Duebird project facts

- Production is https://duebird.io (Vercel project `cashflow-copilot` — do NOT
  rename it; the old `cashflow-copilot-six.vercel.app` URL 308-redirects pages,
  but `/api/*` deliberately does not redirect so cron/OAuth callbacks keep
  working).
- **Pushing to GitHub does not deploy.** Deploy with `npx vercel --prod` from
  the project dir (CLI auth lives at
  `~/Library/Application Support/com.vercel.cli`; set `VERCEL_CONFIG_PATH` to
  that dir when running from scripts).
- Next.js 16 here uses `proxy.ts`, not `middleware.ts`.
- Local `.env.local` points at the **live shared Supabase DB**. Confine test
  writes to the "Claude UI Test - safe to delete" workspace. To verify changes
  end-to-end, follow `.claude/skills/verify/SKILL.md`.
- DB migrations are manual: run `supabase/migration-*.sql` in the Supabase SQL
  editor, oldest first, **before** deploying code that depends on them.
- Signup is allowlist-gated (`approved_emails` table) — the public signup form
  rejects unknown emails by design.
- Reuse the shared helpers (see "Code conventions" in README.md): org guards in
  `lib/supabase/guards.ts`, API errors via `lib/api/http.ts`, client mutation
  toasts via `lib/hooks/use-run-action.ts`.
- Landing page animations are CSS-only behind `motion-safe:` — don't add an
  animation library.
- Gotchas: Zod v4 uses `.issues` (not `.errors`); instantiate Resend inside
  functions (module level crashes the build); `vercel env pull` returns empty
  values for sensitive vars — verify env via live behavior, not pull.
