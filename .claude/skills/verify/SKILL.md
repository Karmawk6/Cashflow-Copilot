---
name: verify
description: Build, launch, and drive Duebird locally with Playwright to verify a change end-to-end against the live shared Supabase DB.
---

# Verifying Duebird changes

## Launch

- The user's `next dev` usually holds :3000 and Next 16 refuses a second dev
  server for the same project dir. Use a local prod build instead:
  `npm run build` then `PORT=3001 npm start` (background), poll
  `http://localhost:3001/login` for 200.
- Local `.env.local` points at the LIVE shared Supabase DB — confine all test
  writes to the "Claude UI Test - safe to delete" workspace.

## Drive (Playwright)

- Playwright 1.61 lives in the npx cache `~/.npm/_npx/e41f203b7505f1fb/node_modules`
  (no downloaded browsers — launch with `channel: 'chrome'`). ESM imports need a
  `node_modules` symlink to that dir in your script's folder (NODE_PATH doesn't
  work for ESM).
- Test owner account: `karmawk6+uitest-ki7zh9@gmail.com` / `UITest-ki7zh9-pass1`
  (owns "Claude UI Test - safe to delete").
- Login form: `input[name="email"]`, `input[name="password"]`, then
  `button[type="submit"]`, wait for `**/dashboard`.
- On dashboard pages the FIRST `button[type="submit"]` in DOM order is the
  sidebar Sign out — always scope submits by label text.
- Supabase rate-limits password logins per IP — reuse a saved storageState
  when running repeatedly.

## DB seeding / assertions

- `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`; parse that file directly in a
  node script and use `@supabase/supabase-js` from the project's node_modules
  (symlink again). Extra auth users: `admin.auth.admin.createUser({ email_confirm: true })`
  — signup UI is allowlist-gated, don't use it.
- Org membership = `profiles.organization_id`; a tenant-guard trigger only
  allows pointing it at an org the user owns or has an ACCEPTED invitation to —
  seed teammates by inserting an accepted `invitations` row first.
- Always delete seeded users/invitations afterward (`admin.auth.admin.deleteUser`).
