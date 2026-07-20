import { test, expect } from '@playwright/test'

// Read-only assertions on the marketing page — safe to run against any
// environment, including production (E2E_BASE_URL=https://duebird.io).
test.describe('landing page copy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('testimonials show real-looking attributions, no placeholders', async ({
    page,
  }) => {
    await expect(page.locator('body')).not.toContainText('Placeholder')
    await expect(page.getByText('Sarah M.')).toBeVisible()
    await expect(page.getByText('Daniel R.')).toBeVisible()
    await expect(page.getByText('Maya K.')).toBeVisible()
  })

  test('stats band makes no unverifiable claims', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('3×')
    await expect(
      page.locator('body')
    ).not.toContainText('more follow-ups actually sent')
    await expect(page.getByText('1 list')).toBeVisible()
    await expect(
      page.getByText('the daily routine Duebird is designed around')
    ).toBeVisible()
    await expect(page.getByText('$0')).toBeVisible()
    await expect(page.getByText('100%')).toBeVisible()
  })

  test('community-lenders section and FAQ item are present', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: 'Duebird for CDFIs and loan funds' })
    ).toBeVisible()
    await expect(page.getByText('Payment plans built in')).toBeVisible()
    await expect(page.getByText('Pre-due courtesy reminders')).toBeVisible()
    await expect(page.getByText('Human approval as compliance')).toBeVisible()

    const faqTrigger = page.getByRole('button', {
      name: 'Does Duebird work for CDFIs and loan funds?',
    })
    await faqTrigger.scrollIntoViewIfNeeded()
    await faqTrigger.click()
    await expect(
      page.getByText('courtesy reminder before each installment')
    ).toBeVisible()
  })

  test('hero subheadline includes community lenders', async ({ page }) => {
    await expect(
      page.getByText(
        'Duebird gives consultants, agencies, and community lenders'
      )
    ).toBeVisible()
  })
})
