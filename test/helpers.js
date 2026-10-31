import request from 'supertest'
import { createApp } from '../server/app.js'
import { getSql } from '../api/_lib/db.js'
import { useMemoryDatabase } from './memory-db.js'

// Real Neon when DATABASE_URL is set (with throwaway users that are deleted afterwards),
// otherwise an in-memory Postgres so tests never need, or touch, real data.
export const usingNeon = Boolean(process.env.DATABASE_URL) && process.env.PULSEFIT_DB !== 'memory'

const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const EMAIL_PREFIX = `pf-test-${RUN_ID}-`
let counter = 0

export const testEmail = (label = 'user') => `${EMAIL_PREFIX}${label}-${++counter}@pulsefit.test`
export const PASSWORD = 'Test1234!'

export async function setupApp() {
  if (!usingNeon) await useMemoryDatabase()
  const { app } = await createApp()
  return app
}

/** Deletes every user this test run created; their workouts and sets cascade away with them. */
export async function cleanupTestUsers() {
  await getSql()`DELETE FROM users WHERE email LIKE ${`${EMAIL_PREFIX}%`}`
}

export async function signUp(app, label, overrides = {}) {
  const agent = request.agent(app)
  const details = {
    fullName: 'Test Athlete',
    email: testEmail(label),
    password: PASSWORD,
    weeklyGoalWorkouts: 3,
    weeklyGoalMinutes: 60,
    ...overrides,
  }
  const res = await agent.post('/api/auth/signup').send(details)
  if (res.status !== 201) throw new Error(`Sign up failed: ${res.status} ${JSON.stringify(res.body)}`)
  return { agent, user: res.body.user, details }
}

export async function exerciseIds(app, count = 2) {
  const res = await request(app).get('/api/exercises')
  return res.body.exercises.slice(0, count).map((e) => e.id)
}

/** Adds an exercise on `date` and finishes the workout, giving a completed workout dated `date`. */
export async function completeWorkoutOn(agent, date, exerciseId) {
  const add = await agent.post('/api/workouts').send({ action: 'add', exerciseId, date })
  const workoutId = add.body.workout.id
  const finish = await agent.post('/api/workouts').send({ action: 'finish', workoutId, date })
  if (finish.status !== 200) throw new Error(`Finish failed: ${finish.status} ${JSON.stringify(finish.body)}`)
  return finish.body.workout
}

export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
