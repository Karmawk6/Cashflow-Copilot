import { test, expect, type Page } from '@playwright/test'
import {
  createE2eAdminClient,
  deleteE2eLeads,
  E2E_LEAD_DOMAIN,
} from './helpers/db'

// Writes to the live shared DB — all addresses use the @duebird-e2e.invalid
// domain and are deleted afterward. The webServer runs with RESEND_API_KEY
// empty, so no real founder-notification emails go out during tests.
const SUCCESS_TEXT = "Got it — we'll be in touch."

async function submitLead(page: Page, email: string) {
  await page.goto('/')
  const input = page.locator('#lead-email')
  await input.scrollIntoViewIfNeeded()
  await input.fill(email)
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByText(SUCCESS_TEXT)).toBeVisible()
}

async function leadCount(email: string): Promise<number> {
  const admin = createE2eAdminClient()
  const { count, error } = await admin
    .from('landing_leads')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
  if (error) throw new Error(error.message)
  return count ?? 0
}

test.describe('landing lead capture', () => {
  test.afterAll(async () => {
    await deleteE2eLeads()
  })

  test('submitting an email stores a lead and shows inline success', async ({
    page,
  }) => {
    const email = `e2e-lead-${Date.now()}@${E2E_LEAD_DOMAIN}`
    await submitLead(page, email)
    expect(await leadCount(email)).toBe(1)
  })

  test('duplicate submission shows the same success state, keeps one row', async ({
    page,
  }) => {
    const email = `e2e-dup-${Date.now()}@${E2E_LEAD_DOMAIN}`
    await submitLead(page, email)
    await submitLead(page, email)
    expect(await leadCount(email)).toBe(1)
  })

  test('honeypot submissions show success but store nothing', async ({
    page,
  }) => {
    const email = `e2e-bot-${Date.now()}@${E2E_LEAD_DOMAIN}`
    await page.goto('/')
    const input = page.locator('#lead-email')
    await input.scrollIntoViewIfNeeded()
    await input.fill(email)
    // The honeypot field is visually hidden, so bypass actionability checks.
    await page
      .locator('input[name="website"]')
      .evaluate((el) => ((el as HTMLInputElement).value = 'http://spam.example'))
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.getByText(SUCCESS_TEXT)).toBeVisible()
    expect(await leadCount(email)).toBe(0)
  })
})
