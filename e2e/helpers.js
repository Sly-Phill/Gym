import { expect } from '@playwright/test'

export const E2E_EMAIL_DOMAIN = 'e2e.pulsefit.test'
export const PASSWORD = 'Test1234!'

export const uniqueEmail = (label) =>
  `${label}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@${E2E_EMAIL_DOMAIN}`

/** Collects console errors/warnings and uncaught exceptions for a page. */
export function watchConsole(page) {
  const problems = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') problems.push(`[${msg.type()}] ${msg.text()}`)
  })
  page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message}`))
  return problems
}

export async function signUpViaUi(page, { name = 'E2E Athlete', email, password = PASSWORD } = {}) {
  await page.goto('/signup')
  await page.getByLabel('Full name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.locator('input[autocomplete="new-password"]').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

export async function signUpViaApi(page, label) {
  const email = uniqueEmail(label)
  const res = await page.request.post('/api/auth/signup', {
    data: { fullName: 'E2E Athlete', email, password: PASSWORD, weeklyGoalWorkouts: 3, weeklyGoalMinutes: 60 },
  })
  expect(res.status()).toBe(201)
  return email
}

export const isMobile = (testInfo) => testInfo.project.name === 'iphone'

/** Uses the sidebar on desktop and the bottom bar on mobile. */
export async function navTo(page, testInfo, label) {
  const mobileLabels = { Dashboard: 'Home', 'Workout Library': 'Library', 'Live Workout': 'Train' }
  const name = isMobile(testInfo) ? mobileLabels[label] ?? label : label
  await page.getByRole('link', { name, exact: true }).filter({ visible: true }).first().click()
}

/** Waits for entrance animations to settle so checks see the final UI. */
export const settle = (page, ms = 1500) => page.waitForTimeout(ms)
