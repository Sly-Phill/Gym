import { test, expect } from '@playwright/test'
import { PASSWORD, signUpViaApi, uniqueEmail } from './helpers.js'

test.describe('Landing page', () => {
  test('shows PulseFit branding in the tab title, navbar, hero and footer', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/PulseFit/)
    await expect(page.getByRole('link', { name: 'PulseFit home' })).toContainText('PulseFit')
    const headline = page.getByRole('heading', { level: 1 })
    await expect(headline).toContainText('Train smarter.')
    await expect(headline).toContainText('Get stronger.')
    await expect(page.locator('section').first()).toContainText('PulseFit')
    await expect(page.locator('footer')).toContainText('PulseFit')
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')
  })

  test('stats counters animate up to the real numbers from /api/stats', async ({ page }) => {
    // Make sure at least one number is > 0 so there is something to animate.
    await signUpViaApi(page, 'counter')
    await page.context().clearCookies()
    const stats = await (await page.request.get('/api/stats')).json()

    // Record every value the "classes this week" counter shows, from the very first paint.
    await page.addInitScript(() => {
      window.__counterValues = []
      new MutationObserver(() => {
        const el = document.querySelectorAll('dl dd')[2]
        const text = el?.querySelector('.tabular-nums')?.textContent
        if (text != null) window.__counterValues.push(Number(text.replace(/[^\d]/g, '')))
      }).observe(document, { subtree: true, childList: true, characterData: true })
    })
    await page.goto('/')
    const counters = page.locator('dl dd')
    await expect(counters).toHaveCount(3)
    // Counters start when they scroll into view (on phones they're below the fold).
    await counters.first().scrollIntoViewIfNeeded()
    await expect(counters.nth(2)).toHaveText(stats.classesThisWeek.toLocaleString('en-US'))
    const seen = await page.evaluate(() => window.__counterValues)
    expect(seen[0]).toBe(0) // it started from zero…
    expect(seen.some((v) => v > 0 && v < stats.classesThisWeek)).toBe(true) // …counted through in-between values…
    await expect(counters.nth(0)).toHaveText(stats.members.toLocaleString('en-US'))
    await expect(counters.nth(1)).toHaveText(stats.workoutsCompleted.toLocaleString('en-US'))
    await expect(counters.nth(2)).toHaveText(stats.classesThisWeek.toLocaleString('en-US')) // …and landed on the real value
  })

  test('"Start Your Workout" goes to sign up when logged out', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Start Your Workout/ }).click()
    await expect(page).toHaveURL(/\/signup$/)
    await expect(page.getByRole('heading', { name: 'Join PulseFit' })).toBeVisible()
  })

  test('"Start Your Workout" goes to the dashboard when logged in', async ({ page }) => {
    await signUpViaApi(page, 'cta')
    await page.goto('/')
    await page.getByRole('link', { name: /Start Your Workout/ }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})

test.describe('Keyboard', () => {
  test('can tab to the main call-to-action and sign up without a mouse', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'iphone', 'Keyboard navigation is a desktop check')
    await page.goto('/')
    let found = false
    for (let i = 0; i < 25 && !found; i++) {
      await page.keyboard.press('Tab')
      found = await page.evaluate(() => document.activeElement?.textContent?.includes('Start Your Workout'))
    }
    expect(found).toBe(true)
    // The focused element must show a visible focus indicator
    const outline = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement)
      return s.outlineStyle !== 'none' || s.boxShadow !== 'none'
    })
    expect(outline).toBe(true)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/signup$/)

    // Fill the form using only the keyboard
    await page.getByLabel('Full name').focus()
    await page.keyboard.type('Keyboard User')
    await page.keyboard.press('Tab')
    await page.keyboard.type(uniqueEmail('keyboard'))
    await page.keyboard.press('Tab')
    await page.keyboard.type(PASSWORD)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
