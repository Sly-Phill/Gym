import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { settle, signUpViaApi, watchConsole } from './helpers.js'

const PUBLIC_PAGES = ['/', '/login', '/signup', '/progress', '/classes', '/profile']
const MEMBER_PAGES = ['/dashboard', '/library', '/workout', '/progress', '/classes', '/profile', '/no-such-page']

async function addWorkout(page) {
  const { exercises } = await (await page.request.get('/api/exercises?muscleGroup=Core')).json()
  const d = new Date()
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  for (const e of exercises.slice(0, 2)) {
    await page.request.post('/api/workouts', { data: { action: 'add', exerciseId: e.id, date } })
  }
}

async function checkPage(page, path, problems) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await settle(page)

  expect(problems, `console errors/warnings on ${path}`).toEqual([])

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, `horizontal scroll on ${path} at ${page.viewportSize().width}px`).toBeLessThanOrEqual(0)

  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const summary = violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help} → ${v.nodes
        .slice(0, 3)
        .map((n) => `${n.target.join(' ')} [${n.failureSummary?.split('\n').slice(1).join(' ').trim()}]`)
        .join(' | ')}`,
  )
  expect(summary, `accessibility problems on ${path}`).toEqual([])
}

test.describe('Quality checks at 375px', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  for (const theme of ['dark', 'light']) {
    test(`public pages (${theme} theme): no console errors, no horizontal scroll, accessible`, async ({ page }) => {
      test.setTimeout(120_000)
      await page.addInitScript((t) => localStorage.setItem('pulsefit-theme', t), theme)
      const problems = watchConsole(page)
      for (const path of PUBLIC_PAGES) await checkPage(page, path, problems)
    })

    test(`member pages (${theme} theme): no console errors, no horizontal scroll, accessible`, async ({ page }) => {
      test.setTimeout(150_000)
      await page.addInitScript((t) => localStorage.setItem('pulsefit-theme', t), theme)
      await signUpViaApi(page, `quality-${theme}`)
      const problems = watchConsole(page)
      // Empty states first, then with a workout added
      for (const path of MEMBER_PAGES) await checkPage(page, path, problems)
      await addWorkout(page)
      for (const path of ['/dashboard', '/library', '/workout']) await checkPage(page, path, problems)
    })
  }
})

test('every button and link has a readable name, every image has alt text', async ({ page }) => {
  await signUpViaApi(page, 'names')
  await addWorkout(page)
  for (const path of ['/', '/dashboard', '/library', '/workout', '/progress', '/classes', '/profile']) {
    await page.goto(path)
    await settle(page)
    const unnamed = await page.evaluate(() =>
      [...document.querySelectorAll('button, a[href], img, [role="button"]')]
        .filter((el) => el.offsetParent !== null || getComputedStyle(el).position === 'fixed')
        .filter((el) => {
          if (el.tagName === 'IMG') return !el.hasAttribute('alt')
          const name = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim()
          return !name
        })
        .map((el) => el.outerHTML.slice(0, 120)),
    )
    expect(unnamed, `unnamed controls on ${path}`).toEqual([])
  }
})

test('logged-out visitors are redirected away from member pages', async ({ page }) => {
  for (const path of ['/dashboard', '/library', '/workout']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login$/)
  }
})
