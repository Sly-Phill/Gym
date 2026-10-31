import { test, expect } from '@playwright/test'
import { navTo, settle, signUpViaUi, uniqueEmail } from './helpers.js'

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']
const PICKS = [
  { name: 'Tempo Push-Ups', group: 'Chest', sets: 3, rest: 60 },
  { name: 'Hammer Curls', group: 'Arms', sets: 3, rest: 45 },
]

test('full member journey: sign up → library → live workout → dashboard → logout', async ({ page }, testInfo) => {
  test.setTimeout(150_000)

  await test.step('sign up and land on the dashboard', async () => {
    await signUpViaUi(page, { name: 'Jamie Journey', email: uniqueEmail('journey') })
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Jamie')
    await expect(page.getByText('No workout yet today')).toBeVisible()
  })

  await test.step('library filters show the right cards for every muscle group', async () => {
    await navTo(page, testInfo, 'Workout Library')
    await expect(page).toHaveURL(/\/library$/)
    const cards = page.locator('article')
    await expect(cards).toHaveCount(30)
    for (const group of GROUPS) {
      await page.getByRole('button', { name: group, exact: true }).click()
      await expect(cards).toHaveCount(5)
      const groups = await cards.evaluateAll((els) => els.map((el) => el.dataset.muscleGroup))
      expect(groups).toEqual(Array(5).fill(group))
      for (let i = 0; i < 5; i++) await expect(cards.nth(i)).toContainText(group)
    }
    await page.getByRole('button', { name: 'All', exact: true }).click()
    await expect(cards).toHaveCount(30)
  })

  await test.step("add 2 exercises to today's workout", async () => {
    for (const pick of PICKS) {
      const card = page.locator('article').filter({ hasText: pick.name })
      await card.getByRole('button', { name: "Add to today's workout" }).click()
      await expect(card.getByRole('button', { name: "In today's workout" })).toBeVisible()
      await expect(page.getByRole('status').filter({ hasText: `${pick.name} added` })).toBeVisible()
    }
  })

  await test.step("dashboard shows today's workout, then Start", async () => {
    await navTo(page, testInfo, 'Dashboard')
    await expect(page.getByRole('heading', { name: 'Arms & Chest Day' })).toBeVisible()
    for (const pick of PICKS) await expect(page.getByText(pick.name, { exact: true })).toBeVisible()
    await expect(page.getByText('0/6 sets')).toBeVisible()
    await page.getByRole('link', { name: 'Start workout', exact: true }).click()
    await expect(page).toHaveURL(/\/workout$/)
  })

  await test.step('live workout: rest timer counts down, tick every set, confetti on finish', async () => {
    const timer = page.getByTestId('rest-timer')
    await expect(timer).toHaveText('GO')

    await page.getByRole('button', { name: `Set 1 of ${PICKS[0].name}` }).click()
    await expect(timer).toHaveText(/^1:00|0:5\d$/)
    const first = await timer.textContent()
    await page.waitForTimeout(2200)
    const later = await timer.textContent()
    const secs = (t) => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1])
    expect(secs(later)).toBeLessThan(secs(first))
    expect(secs(later)).toBeGreaterThan(50)

    for (const pick of PICKS) {
      for (let n = 1; n <= pick.sets; n++) {
        if (pick === PICKS[0] && n === 1) continue
        const set = page.getByRole('button', { name: `Set ${n} of ${pick.name}` })
        await set.click()
        await expect(set).toHaveAttribute('aria-pressed', 'true')
      }
    }

    await expect(page.getByRole('heading', { name: 'Workout complete!' })).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(1) // canvas-confetti draws on its own <canvas>
    await expect(page.getByText('6 of 6 sets')).toBeVisible()
  })

  await test.step('dashboard updates: streak, chart and rings show the new workout', async () => {
    await page.getByRole('link', { name: 'See dashboard' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await checkDashboardAfterWorkout(page)
  })

  await test.step('refresh: data is still there', async () => {
    await page.reload()
    await checkDashboardAfterWorkout(page)
    await page.goto('/workout')
    await expect(page.getByText('Done for today!')).toBeVisible()
    await expect(page.getByText('6 of 6 sets')).toBeVisible()
    await page.goto('/library')
    await expect(page.getByRole('button', { name: "In today's workout" })).toHaveCount(2)
  })

  await test.step('logout, then protected pages redirect to login', async () => {
    await page.getByRole('button', { name: /log out/i }).filter({ visible: true }).first().click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible()
    for (const path of ['/dashboard', '/library', '/workout']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login$/)
    }
    // Logging back in returns to the page you asked for
    await page.goto('/library')
    await expect(page).toHaveURL(/\/login$/)
  })
})

async function checkDashboardAfterWorkout(page) {
  await expect(page.getByText('Completed today')).toBeVisible()
  // Counters animate when scrolled into view, so bring each one on screen before reading it.
  const streak = page.locator('p', { hasText: /in a row/ }).locator('xpath=preceding-sibling::p[1]')
  await streak.scrollIntoViewIfNeeded()
  await expect(streak).toHaveText('1')
  await expect(page.getByText('day in a row')).toBeVisible()
  // Weekly chart: today's bar has minutes, so the total is at least 1
  const total = page.locator('p', { hasText: 'active min' }).first()
  await total.scrollIntoViewIfNeeded()
  await expect(total).not.toHaveText(/^0 active min/)
  await expect(page.locator('.recharts-bar-rectangle path').last()).toBeVisible()
  // Rings: 1 of the 4 weekly workouts (default goal from sign-up)
  const workoutsRing = page.getByText('1/4', { exact: true })
  await workoutsRing.scrollIntoViewIfNeeded()
  await expect(workoutsRing).toBeVisible()
  await expect(page.getByText('25%', { exact: true }).filter({ visible: true }).first()).toBeVisible()
}
