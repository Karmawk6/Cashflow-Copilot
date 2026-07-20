import { defineConfig } from '@playwright/test'

// System Chrome via channel — no downloaded browsers, matching the repo's
// verify workflow. Port 3001 avoids the dev server that usually holds :3000.
//
// RESEND_API_KEY is forced empty for the test server so sendEmail() takes its
// existing demo short-circuit: e2e runs never send real email (process env
// beats .env.local). Set E2E_BASE_URL to target an already-running server
// (e.g. https://duebird.io for the read-only landing spec) — that skips the
// local webServer entirely.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3001',
    channel: 'chrome',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run build && RESEND_API_KEY= PORT=3001 npm start',
        url: 'http://localhost:3001/login',
        reuseExistingServer: true,
        timeout: 240_000,
      },
})
