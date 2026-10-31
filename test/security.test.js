import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { SignJWT } from 'jose'
import request from 'supertest'
import { cleanupTestUsers, exerciseIds, setupApp, signUp } from './helpers.js'

const DAY = '2031-04-09'
let app
let alice
let bob
let aliceWorkout

beforeAll(async () => {
  app = await setupApp()
  alice = await signUp(app, 'alice', { fullName: 'Alice A' })
  bob = await signUp(app, 'bob', { fullName: 'Bob B' })
  const [first, second] = await exerciseIds(app, 2)
  await alice.agent.post('/api/workouts').send({ action: 'add', exerciseId: first, date: DAY })
  aliceWorkout = (await alice.agent.post('/api/workouts').send({ action: 'add', exerciseId: second, date: DAY })).body.workout
})
afterAll(async () => {
  await cleanupTestUsers()
})

const aliceNow = async () => (await alice.agent.get(`/api/workouts?date=${DAY}`)).body.workout

describe("user B cannot see or change user A's data", () => {
  it("B's workout for the same day is empty", async () => {
    const res = await bob.agent.get(`/api/workouts?date=${DAY}`)
    expect(res.status).toBe(200)
    expect(res.body.workout).toBeNull()
  })

  it("B's dashboard does not include A's workout", async () => {
    const res = await bob.agent.get(`/api/dashboard?date=${DAY}`)
    expect(res.status).toBe(200)
    expect(res.body.user.fullName).toBe('Bob B')
    expect(res.body.today).toBeNull()
  })

  it("B cannot tick A's set (404, and A's set is unchanged)", async () => {
    const setId = aliceWorkout.exercises[0].sets[0].id
    const res = await bob.agent.patch('/api/sets').send({ setId, completed: true })
    expect(res.status).toBe(404)
    expect((await aliceNow()).exercises[0].sets[0].completed).toBe(false)
  })

  it("B cannot start or finish A's workout", async () => {
    for (const action of ['start', 'finish']) {
      const res = await bob.agent.post('/api/workouts').send({ action, workoutId: aliceWorkout.id, date: DAY })
      expect(res.status).toBe(404)
    }
    const after = await aliceNow()
    expect(after.status).toBe('planned')
    expect(after.startedAt).toBeNull()
  })

  it("B cannot remove an exercise from A's workout", async () => {
    const weId = aliceWorkout.exercises[0].workoutExerciseId
    const res = await bob.agent.delete(`/api/workouts?workoutExerciseId=${weId}&date=${DAY}`)
    expect(res.status).toBe(404)
    expect((await aliceNow()).exercises).toHaveLength(2)
  })

  it("B adding exercises on the same day creates B's own workout, not A's", async () => {
    const [, , third] = await exerciseIds(app, 3)
    const res = await bob.agent.post('/api/workouts').send({ action: 'add', exerciseId: third, date: DAY })
    expect(res.status).toBe(201)
    expect(res.body.workout.id).not.toBe(aliceWorkout.id)
    expect((await aliceNow()).exercises).toHaveLength(2)
  })

  it('a session token signed with a different secret is rejected', async () => {
    const forged = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(alice.user.id))
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('an-attacker-guessed-secret-that-is-long-enough'))
    const res = await request(app).get(`/api/workouts?date=${DAY}`).set('Cookie', `pf_session=${forged}`)
    expect(res.status).toBe(401)
  })

  it('an expired session token is rejected', async () => {
    const expired = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(alice.user.id))
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(new TextEncoder().encode(process.env.JWT_SECRET))
    const res = await request(app).get('/api/auth/me').set('Cookie', `pf_session=${expired}`)
    expect(res.status).toBe(401)
  })

  it('no API response ever includes a password hash', async () => {
    const responses = await Promise.all([
      alice.agent.get('/api/auth/me'),
      alice.agent.get(`/api/dashboard?date=${DAY}`),
      alice.agent.get(`/api/workouts?date=${DAY}`),
    ])
    for (const res of responses) expect(JSON.stringify(res.body)).not.toMatch(/password|\$2[aby]\$/i)
  })
})
