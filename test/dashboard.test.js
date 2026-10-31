import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { addDays, cleanupTestUsers, completeWorkoutOn, exerciseIds, setupApp, signUp } from './helpers.js'

// Fake "today": Wednesday 2031-03-12, so its week runs Monday 03-10 to Sunday 03-16.
const TODAY = '2031-03-12'
let app
let exerciseId

beforeAll(async () => {
  app = await setupApp()
  ;[exerciseId] = await exerciseIds(app, 1)
})
afterAll(async () => {
  await cleanupTestUsers()
})

async function dashboardAfter(label, workoutDates, goals = {}) {
  const { agent } = await signUp(app, label, goals)
  for (const date of workoutDates) await completeWorkoutOn(agent, date, exerciseId)
  const res = await agent.get(`/api/dashboard?date=${TODAY}`)
  expect(res.status).toBe(200)
  return res.body
}

describe('streak', () => {
  it('is 0 with no workouts', async () => {
    const d = await dashboardAfter('streak0', [])
    expect(d.streak).toEqual({ current: 0, best: 0 })
  })

  it('is 3 after three days in a row ending today', async () => {
    const d = await dashboardAfter('streak3', [addDays(TODAY, -2), addDays(TODAY, -1), TODAY])
    expect(d.streak).toEqual({ current: 3, best: 3 })
  })

  it('resets after a missed day', async () => {
    // Done 4 and 3 days ago, missed 2 days ago, done yesterday.
    const d = await dashboardAfter('streakgap', [addDays(TODAY, -4), addDays(TODAY, -3), addDays(TODAY, -1)])
    expect(d.streak).toEqual({ current: 1, best: 2 })
  })

  it('drops to 0 when yesterday was missed and today is not done yet', async () => {
    const d = await dashboardAfter('streakbroken', [addDays(TODAY, -3), addDays(TODAY, -2)])
    expect(d.streak).toEqual({ current: 0, best: 2 })
  })

  it('counts today plus yesterday as 2', async () => {
    const d = await dashboardAfter('streak2', [addDays(TODAY, -1), TODAY])
    expect(d.streak).toEqual({ current: 2, best: 2 })
  })

  it("stays alive from yesterday while today's workout isn't done yet", async () => {
    const d = await dashboardAfter('streakalive', [addDays(TODAY, -2), addDays(TODAY, -1)])
    expect(d.streak.current).toBe(2)
  })

  it('ignores planned (unfinished) workouts', async () => {
    const { agent } = await signUp(app, 'planned')
    await agent.post('/api/workouts').send({ action: 'add', exerciseId, date: TODAY })
    const d = (await agent.get(`/api/dashboard?date=${TODAY}`)).body
    expect(d.streak.current).toBe(0)
    expect(d.today.status).toBe('planned')
    expect(d.week.workouts).toBe(0)
  })
})

describe('weekly chart', () => {
  it('always has exactly 7 days, oldest first, ending today', async () => {
    const d = await dashboardAfter('chart', [addDays(TODAY, -6), TODAY])
    expect(d.weeklyActivity).toHaveLength(7)
    expect(d.weeklyActivity.map((x) => x.date)).toEqual(Array.from({ length: 7 }, (_, i) => addDays(TODAY, i - 6)))
    expect(d.weeklyActivity.map((x) => x.day)).toEqual(['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'])
    expect(d.weeklyActivity[0].minutes).toBeGreaterThanOrEqual(1)
    expect(d.weeklyActivity[6].minutes).toBeGreaterThanOrEqual(1)
    expect(d.weeklyActivity.slice(1, 6).every((x) => x.minutes === 0)).toBe(true)
    expect(d.totalMinutes).toBe(d.weeklyActivity.reduce((s, x) => s + x.minutes, 0))
  })

  it('excludes workouts older than 7 days but counts them for last week', async () => {
    const d = await dashboardAfter('chartold', [addDays(TODAY, -9)])
    expect(d.totalMinutes).toBe(0)
    expect(d.prevMinutes).toBeGreaterThanOrEqual(1)
  })
})

describe('progress ring numbers', () => {
  it('counts only this calendar week (Monday start)', async () => {
    // Sunday before (last week), Monday and today (this week)
    const d = await dashboardAfter('week', [addDays(TODAY, -3), addDays(TODAY, -2), TODAY], {
      weeklyGoalWorkouts: 4,
      weeklyGoalMinutes: 120,
    })
    expect(d.week.workouts).toBe(2)
    expect(d.week.minutes).toBe(d.weeklyActivity.filter((x) => x.date >= addDays(TODAY, -2)).reduce((s, x) => s + x.minutes, 0))
    expect(d.week.sessionTarget).toBe(30) // 120 min / 4 workouts
    expect(d.week.goalsHit).toBe(0) // each test workout lasts about 1 minute
    expect(d.user).toMatchObject({ weeklyGoalWorkouts: 4, weeklyGoalMinutes: 120 })
  })

  it('counts a session as a goal hit when it meets the per-session target', async () => {
    // 10 min / 10 workouts = 1-minute target, so even a quick test workout counts.
    const d = await dashboardAfter('goalhit', [TODAY], { weeklyGoalWorkouts: 10, weeklyGoalMinutes: 10 })
    expect(d.week.sessionTarget).toBe(1)
    expect(d.week.goalsHit).toBe(1)
  })

  it('reports numbers for an empty week (never null)', async () => {
    const d = await dashboardAfter('emptyweek', [])
    expect(d.week).toEqual({ workouts: 0, minutes: 0, goalsHit: 0, sessionTarget: 20 })
  })
})
