// Screen-by-screen check of all 7 screens at phone, tablet and desktop widths.
// Viewports are set per test, so this file only runs in the desktop-chrome project.
import { test, expect } from '@playwright/test'
import { PASSWORD, settle, uniqueEmail, watchConsole } from './helpers.js'

const SCREENS = [
  { path: '/', heading: 'Train smarter.' },
  { path: '/dashboard', heading: /Riley/ },
  { path: '/library', heading: 'Find your next move' },
  { path: '/workout', heading: /Arms|Chest|Core|Day|Workout/ },
  { path: '/progress', heading: 'Stronger every month' },
  { path: '/classes', heading: 'Find your class' },
  { path: '/profile', heading: 'Achievements' },
]
const VIEWPORTS = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'Sets its own viewports')
})

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** A member whose small goals make all three rings fill, with one finished and one planned workout setup. */
async function memberWithFinishedWorkout(page) {
  const email = uniqueEmail('screens')
  await page.request.post('/api/auth/signup', {
    data: { fullName: 'Riley Screens', email, password: PASSWORD, weeklyGoalWorkouts: 10, weeklyGoalMinutes: 10 },
  })
  const { exercises } = await (await page.request.get('/api/exercises?muscleGroup=Arms')).json()
  const add = await page.request.post('/api/workouts', { data: { action: 'add', exerciseId: exercises[0].id, date: today() } })
  const { workout } = await add.json()
  await page.request.post('/api/workouts', { data: { action: 'finish', workoutId: workout.id, date: today() } })
  return email
}

async function freshMemberWithPlannedWorkout(page) {
  await page.request.post('/api/auth/signup', {
    data: { fullName: 'Riley Screens', email: uniqueEmail('planned'), password: PASSWORD },
  })
  const { exercises } = await (await page.request.get('/api/exercises?muscleGroup=Core')).json()
  for (const e of exercises.slice(0, 2)) await page.request.post('/api/workouts', { data: { action: 'add', exerciseId: e.id, date: today() } })
}

const visibleThemeToggle = (page) => page.getByRole('button', { name: /Switch to (light|dark) mode/ }).filter({ visible: true }).first()

test.describe('Screens', () => {
  test('Dashboard: workout card, Start opens Live Workout, chart animates, streak, 3 rings fill', async ({ page }) => {
    await memberWithFinishedWorkout(page)
    await page.goto('/dashboard')
    await expect(page.getByText('Completed today')).toBeVisible()
    await expect(page.getByText('Quote of the day')).toBeVisible()

    // Streak
    await expect(page.getByText('day in a row')).toBeVisible()

    // Chart: bars grow (recharts animates the bar path from height 0)
    // Scroll the chart (not a bar: recharts redraws bars while animating) into view, then sample today's bar.
    await page.locator('.recharts-wrapper').scrollIntoViewIfNeeded()
    const bar = page.locator('.recharts-bar-rectangle path').last()
    await expect(bar).toBeVisible()
    const heights = []
    for (let i = 0; i < 8; i++) {
      heights.push((await bar.boundingBox())?.height ?? 0)
      await page.waitForTimeout(150)
    }
    expect(Math.max(...heights)).toBeGreaterThan(Math.min(...heights)) // it grew…
    expect(heights.at(-1)).toBeGreaterThan(0) // …to a visible bar

    // Rings: all three progress circles fill (dash offset goes down from a full circle)
    const rings = page.locator('svg.-rotate-90 circle[stroke-linecap="round"]')
    await rings.first().scrollIntoViewIfNeeded()
    await expect(rings).toHaveCount(3)
    await settle(page, 2600)
    for (let i = 0; i < 3; i++) {
      const { offset, full } = await rings.nth(i).evaluate((c) => ({
        offset: parseFloat(getComputedStyle(c).strokeDashoffset || c.getAttribute('stroke-dashoffset')),
        full: parseFloat(c.getAttribute('stroke-dasharray')),
      }))
      expect(offset, `ring ${i + 1} filled`).toBeLessThan(full)
    }
  })

  test('Dashboard "Start" opens Live Workout; rest timer counts down in a circle', async ({ page }) => {
    await freshMemberWithPlannedWorkout(page)
    await page.goto('/dashboard')
    await page.getByRole('link', { name: 'Start workout' }).click()
    await expect(page).toHaveURL(/\/workout$/)
    await page.getByRole('button', { name: /^Set 1 of / }).first().click()
    const ring = page.locator('circle[stroke="url(#timerGrad)"]')
    const read = async () => ({
      text: await page.getByTestId('rest-timer').textContent(),
      offset: parseFloat(await ring.getAttribute('stroke-dashoffset')),
    })
    const a = await read()
    await page.waitForTimeout(1600)
    const b = await read()
    expect(a.text).not.toBe('GO')
    expect(b.text).not.toBe(a.text) // the number counts down…
    expect(b.offset).toBeGreaterThan(a.offset) // …and the circle empties
  })

  test('Progress: line chart and PR cards with trophy badges', async ({ page }) => {
    await page.goto('/progress')
    await expect(page.getByRole('heading', { name: 'Stronger every month' })).toBeVisible()
    await expect(page.locator('.recharts-area-curve')).toHaveCount(3) // one line per lift
    await page.getByText('Personal records').scrollIntoViewIfNeeded()
    const badges = page.locator('svg.lucide-trophy, svg.lucide-medal, svg.lucide-award')
    expect(await badges.count()).toBeGreaterThanOrEqual(6)
    for (const tier of ['Gold', 'Silver', 'Bronze']) await expect(page.getByText(tier, { exact: true }).first()).toBeVisible()
    // Lift toggles work
    await page.getByRole('button', { name: 'Squat' }).click()
    await expect(page.locator('.recharts-area-curve')).toHaveCount(2)
  })

  test('Class Booking: booking lowers spots, shows a toast; full classes cannot be booked', async ({ page }) => {
    await page.goto('/classes')
    await page.getByRole('button', { name: /^Mon/ }).click()
    const card = page.locator('article').filter({ hasText: 'Metcon Blast' })
    await expect(card).toContainText('4 spots left')
    await card.getByRole('button', { name: 'Book spot' }).click()
    await expect(card).toContainText('3 spots left')
    await expect(page.getByRole('status').filter({ hasText: "You're in: Metcon Blast" })).toBeVisible()
    await expect(card.getByRole('button', { name: /Booked/ })).toBeVisible()

    const full = page.locator('article').filter({ hasText: 'Fight Fit' })
    await expect(full).toContainText('Full')
    await full.getByRole('button', { name: 'Join waitlist' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Class is full' })).toBeVisible()
    await expect(full).toContainText('Full')
    await expect(full.getByRole('button', { name: /Booked/ })).toHaveCount(0)
  })

  test('Profile: avatar, membership level and badges', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.getByText('LV 27')).toBeVisible()
    await expect(page.getByText(/Elite Member/)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible()
    await expect(page.locator('main button').filter({ hasText: /Iron Streak|Century Club|Early Bird|PR Machine|Class Act|Marathoner/ })).toHaveCount(6)
  })

  test('Empty states appear when a filter has no results', async ({ page }) => {
    await page.request.post('/api/auth/signup', { data: { fullName: 'Empty State', email: uniqueEmail('empty'), password: PASSWORD } })
    await page.goto('/library')
    await page.getByLabel('Search exercises').fill('zzz-nothing')
    await expect(page.getByText('No exercises found')).toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.locator('article')).toHaveCount(30)

    await page.goto('/classes')
    await page.getByRole('button', { name: /^Tue/ }).click()
    await page.getByRole('button', { name: 'Yoga' }).click()
    await expect(page.getByText('No Yoga classes on Tue')).toBeVisible()
    await page.getByRole('button', { name: 'Show all classes' }).click()
    await page.getByRole('button', { name: /^Sun/ }).click()
    await expect(page.getByText('Rest day, no classes')).toBeVisible()

    await page.goto('/workout')
    await expect(page.getByText('No workout yet today')).toBeVisible()
    await page.goto('/dashboard')
    await expect(page.getByText('No workout yet today')).toBeVisible()
  })
})

test.describe('Branding', () => {
  test('logo gradient is lime → cyan and resolves at every width; favicon is the pulse icon', async ({ page }) => {
    const favicon = await page.request.get('/favicon.svg')
    expect(favicon.status()).toBe(200)
    const svg = await favicon.text()
    expect(svg).toContain('#c6ff00')
    expect(svg).toContain('#00e5ff')
    expect(svg).toMatch(/<path d="M8 34h12l5-12 8 24 6-18 4 6h13"/)

    await page.request.post('/api/auth/signup', { data: { fullName: 'Brand Check', email: uniqueEmail('brand'), password: PASSWORD } })
    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp)
      for (const path of ['/', '/dashboard']) {
        await page.goto(path)
        await expect(page).toHaveTitle(/PulseFit/)
        const logo = page.getByRole('link', { name: 'PulseFit home' }).filter({ visible: true }).first()
        await expect(logo).toContainText('PulseFit')
        // The mark's stroke must point at a gradient that exists, with lime and cyan stops
        const stops = await logo.locator('path').evaluate((p) => {
          const id = p.getAttribute('stroke').match(/url\(#(.+)\)/)[1]
          const grad = document.getElementById(id)
          return grad ? [...grad.querySelectorAll('stop')].map((s) => s.getAttribute('stop-color')) : null
        })
        expect(stops, `logo gradient at ${vp.name} ${path}`).toEqual(['#c6ff00', '#00e5ff'])
      }
      await expect(page.locator('footer').filter({ visible: true })).toContainText('PulseFit')
    }
  })
})

test.describe('Layouts at 375 / 768 / 1440', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name} (${vp.width}px): right navigation, no sideways scroll, tappable buttons, theme toggle on every screen`, async ({ page }) => {
      test.setTimeout(180_000)
      await page.setViewportSize(vp)
      await freshMemberWithPlannedWorkout(page)
      const problems = watchConsole(page)

      for (const screen of SCREENS) {
        await page.goto(screen.path)
        await settle(page, 1200)
        const label = `${screen.path} at ${vp.width}px`

        // Navigation: bottom bar on phone/tablet, sidebar on desktop
        const sidebar = page.locator('aside')
        const bottomBar = page.locator('nav.fixed.bottom-0')
        if (screen.path !== '/') {
          if (vp.width >= 1024) {
            await expect(sidebar, label).toBeVisible()
            await expect(bottomBar, label).toBeHidden()
          } else {
            await expect(bottomBar, label).toBeVisible()
            await expect(sidebar, label).toBeHidden()
          }
        }

        // No sideways scrolling
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow, `sideways scroll on ${label}`).toBeLessThanOrEqual(0)

        // Easy to tap: every visible button/link at least 24×24 (WCAG 2.2 AA); nav items at least 44px tall
        const tiny = await page.evaluate(() =>
          [...document.querySelectorAll('button, a[href]')]
            .filter((el) => {
              const r = el.getBoundingClientRect()
              const style = getComputedStyle(el)
              if (!r.width || !r.height || style.visibility === 'hidden') return false
              const inlineTextLink = el.tagName === 'A' && style.display === 'inline' && el.closest('p')
              return !inlineTextLink && (r.width < 24 || r.height < 24)
            })
            .map((el) => `${el.tagName} "${(el.getAttribute('aria-label') || el.textContent).trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`),
        )
        expect(tiny, `tap targets smaller than 24px on ${label}`).toEqual([])
        if (vp.width < 1024 && screen.path !== '/') {
          const navHeights = await bottomBar.locator('a').evaluateAll((as) => as.map((a) => a.getBoundingClientRect().height))
          for (const h of navHeights) expect(h, `bottom-nav item height on ${label}`).toBeGreaterThanOrEqual(44)
        }

        // Light/dark toggle works here and text stays readable (contrast is checked by axe in quality.spec.js)
        const html = page.locator('html')
        const wasDark = (await html.getAttribute('class'))?.includes('dark')
        await visibleThemeToggle(page).click()
        await expect(html).toHaveClass(wasDark ? /^(?!.*\bdark\b).*$/ : /\bdark\b/)
        await expect(page.getByRole('heading', { name: screen.heading }).first()).toBeVisible()
        await visibleThemeToggle(page).click()
        await expect(html).toHaveClass(wasDark ? /\bdark\b/ : /^(?!.*\bdark\b).*$/)
      }

      expect(problems, `console errors/warnings at ${vp.width}px`).toEqual([])
    })
  }
})

test.describe('Links and buttons', () => {
  test('every link and nav item goes to the right screen', async ({ page }) => {
    test.setTimeout(150_000)
    await freshMemberWithPlannedWorkout(page)
    const known = new Set(['/', '/login', '/signup', '/dashboard', '/library', '/workout', '/progress', '/classes', '/profile'])

    for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
      await page.setViewportSize(vp)
      for (const screen of SCREENS) {
        await page.goto(screen.path)
        await settle(page, 800)
        const hrefs = await page.evaluate(() =>
          [...new Set([...document.querySelectorAll('a[href]')].filter((a) => a.getBoundingClientRect().width > 0).map((a) => a.getAttribute('href')))],
        )
        for (const href of hrefs) expect(known.has(href), `link to "${href}" on ${screen.path} at ${vp.width}px`).toBe(true)
      }
      // Every screen must be reachable from the app navigation at this width
      await page.goto('/dashboard')
      for (const target of ['/dashboard', '/library', '/workout', '/progress', '/classes', '/profile']) {
        const link = page.locator(`a[href="${target}"]`).filter({ visible: true }).first()
        await expect(link, `a visible link to ${target} at ${vp.width}px`).toHaveCount(1)
        await link.click()
        await expect(page).toHaveURL(new RegExp(`${target}$`))
        await expect(page.getByRole('heading', { name: SCREENS.find((s) => s.path === target).heading }).first()).toBeVisible()
      }
    }
  })

  test('no dead buttons: every visible button does something', async ({ page }) => {
    await freshMemberWithPlannedWorkout(page)
    for (const screen of SCREENS) {
      await page.goto(screen.path)
      await settle(page, 1000)
      const dead = await page.evaluate(() =>
        [...document.querySelectorAll('button')]
          .filter((b) => b.getBoundingClientRect().width > 0)
          .filter((b) => {
            const key = Object.keys(b).find((k) => k.startsWith('__reactProps$'))
            const props = key ? b[key] : {}
            return !(props.onClick || props.onPointerDown || b.type === 'submit' || b.disabled)
          })
          .map((b) => (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 40)),
      )
      expect(dead, `buttons without an action on ${screen.path}`).toEqual([])
    }
  })
})
