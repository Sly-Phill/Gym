import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { PASSWORD, cleanupTestUsers, exerciseIds, setupApp, signUp, testEmail } from './helpers.js'

const DAY = '2031-03-12' // fixed fake "today" so results don't depend on the real date
let app

beforeAll(async () => {
  app = await setupApp()
})
afterAll(async () => {
  await cleanupTestUsers()
})

const sessionCookie = (res) => (res.headers['set-cookie'] || []).find((c) => c.startsWith('pf_session='))

describe('POST /api/auth/signup', () => {
  it('creates an account, returns the user and sets an httpOnly session cookie', async () => {
    const email = testEmail('signup')
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ fullName: 'Sam Signup', email, password: PASSWORD, weeklyGoalWorkouts: 5, weeklyGoalMinutes: 200 })
    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({ email, fullName: 'Sam Signup', weeklyGoalWorkouts: 5, weeklyGoalMinutes: 200 })
    expect(res.body.user).not.toHaveProperty('password_hash')
    const cookie = sessionCookie(res)
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/SameSite=Lax/i)
    // The readable "signed in" marker carries no secret, just a flag
    const hint = res.headers['set-cookie'].find((c) => c.startsWith('pf_signed_in='))
    expect(hint).toMatch(/^pf_signed_in=1;/)
    expect(hint).not.toMatch(/HttpOnly/i)
  })

  it('stores emails case-insensitively', async () => {
    const email = testEmail('case')
    const res = await request(app).post('/api/auth/signup').send({ fullName: 'Casey', email: email.toUpperCase(), password: PASSWORD })
    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe(email)
  })

  it('blocks a duplicate email', async () => {
    const { details } = await signUp(app, 'dupe')
    const res = await request(app).post('/api/auth/signup').send({ ...details, email: details.email.toUpperCase() })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('email_taken')
    expect(sessionCookie(res)).toBeUndefined()
  })

  it.each([
    ['an empty password', ''],
    ['a password shorter than 8 characters', 'abc123'],
    ['a whitespace-only password', '        '],
    ['a password with no numbers', 'onlyletters'],
    ['a password with no letters', '1234567890'],
  ])('blocks %s', async (_, password) => {
    const res = await request(app).post('/api/auth/signup').send({ fullName: 'Weak', email: testEmail('weak'), password })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/password/i)
  })

  it.each([
    ['a missing name', { fullName: '' }, /name/i],
    ['an invalid email', { email: 'not-an-email' }, /email/i],
    ['an out-of-range workouts goal', { weeklyGoalWorkouts: 0 }, /workouts goal/i],
    ['a non-numeric minutes goal', { weeklyGoalMinutes: 'lots' }, /minutes goal/i],
  ])('rejects %s', async (_, override, message) => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ fullName: 'Val', email: testEmail('val'), password: PASSWORD, ...override })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(message)
  })

  it('rejects invalid JSON with a friendly 400', async () => {
    const res = await request(app).post('/api/auth/signup').set('Content-Type', 'application/json').send('{oops')
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('bad_request')
  })
})

describe('login, logout and /api/auth/me', () => {
  it('logs in with the right password and /me returns the user', async () => {
    const { details } = await signUp(app, 'login')
    const agent = request.agent(app)
    const res = await agent.post('/api/auth/login').send({ email: details.email, password: PASSWORD })
    expect(res.status).toBe(200)
    expect(sessionCookie(res)).toMatch(/HttpOnly/i)
    const me = await agent.get('/api/auth/me')
    expect(me.status).toBe(200)
    expect(me.body.user.email).toBe(details.email)
  })

  it('fails with the wrong password', async () => {
    const { details } = await signUp(app, 'wrongpw')
    const res = await request(app).post('/api/auth/login').send({ email: details.email, password: 'Wrong1234!' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('invalid_credentials')
    expect(sessionCookie(res)).toBeUndefined()
  })

  it('gives the same error for an unknown email (no account enumeration)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testEmail('ghost'), password: PASSWORD })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('invalid_credentials')
  })

  it('requires both fields', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: '' })
    expect(res.status).toBe(400)
  })

  it('logout clears the cookie and /me then returns 401', async () => {
    const { agent } = await signUp(app, 'logout')
    expect((await agent.get('/api/auth/me')).status).toBe(200)
    const out = await agent.post('/api/auth/logout')
    expect(out.status).toBe(200)
    expect(sessionCookie(out)).toMatch(/Max-Age=0/)
    expect(out.headers['set-cookie'].find((c) => c.startsWith('pf_signed_in='))).toMatch(/Max-Age=0/)
    const me = await agent.get('/api/auth/me')
    expect(me.status).toBe(401)
  })

  it('/me returns 401 when logged out', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('/me rejects a forged or garbage session cookie', async () => {
    const forged =
      'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.' // alg "none", sub 1
    for (const token of [forged, 'not-a-jwt', '']) {
      const res = await request(app).get('/api/auth/me').set('Cookie', `pf_session=${token}`)
      expect(res.status).toBe(401)
    }
  })

  it('rejects the wrong HTTP method with 405', async () => {
    const res = await request(app).get('/api/auth/login')
    expect(res.status).toBe(405)
  })
})

describe('GET /api/stats', () => {
  it('returns members, workouts completed and classes this week as whole numbers', async () => {
    await signUp(app, 'stats')
    const res = await request(app).get('/api/stats')
    expect(res.status).toBe(200)
    for (const key of ['members', 'workoutsCompleted', 'classesThisWeek']) {
      expect(Number.isInteger(res.body[key])).toBe(true)
      expect(res.body[key]).toBeGreaterThanOrEqual(0)
    }
    expect(res.body.members).toBeGreaterThanOrEqual(1)
    expect(res.body.classesThisWeek).toBeGreaterThanOrEqual(10)
  })
})

describe('GET /api/exercises', () => {
  it('returns all 30 exercises with the fields the Library needs', async () => {
    const res = await request(app).get('/api/exercises')
    expect(res.status).toBe(200)
    expect(res.body.exercises).toHaveLength(30)
    for (const e of res.body.exercises) {
      expect(e).toEqual({
        id: expect.any(Number),
        name: expect.any(String),
        muscleGroup: expect.stringMatching(/^(Chest|Back|Legs|Arms|Core|Cardio)$/),
        sets: expect.any(Number),
        reps: expect.any(String),
        difficulty: expect.stringMatching(/^(Beginner|Intermediate|Advanced)$/),
        restSeconds: expect.any(Number),
        description: expect.any(String),
      })
    }
  })

  it.each(['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio'])('filters by %s', async (group) => {
    const res = await request(app).get(`/api/exercises?muscleGroup=${group}`)
    expect(res.status).toBe(200)
    expect(res.body.exercises).toHaveLength(5)
    expect(res.body.exercises.every((e) => e.muscleGroup === group)).toBe(true)
  })

  it('rejects an unknown muscle group', async () => {
    const res = await request(app).get('/api/exercises?muscleGroup=Neck')
    expect(res.status).toBe(400)
  })
})

describe('/api/workouts and /api/sets', () => {
  let agent
  let ids
  let workout

  beforeAll(async () => {
    ;({ agent } = await signUp(app, 'workouts'))
    ids = await exerciseIds(app, 3)
  })

  it('has no workout before anything is added', async () => {
    const res = await agent.get(`/api/workouts?date=${DAY}`)
    expect(res.status).toBe(200)
    expect(res.body.workout).toBeNull()
  })

  it("adding an exercise creates today's workout with one set row per prescribed set", async () => {
    const res = await agent.post('/api/workouts').send({ action: 'add', exerciseId: ids[0], date: DAY })
    expect(res.status).toBe(201)
    expect(res.body.added).toBe(true)
    workout = res.body.workout
    expect(workout).toMatchObject({ status: 'planned', workoutDate: DAY })
    expect(workout.exercises).toHaveLength(1)
    const [ex] = workout.exercises
    const catalog = (await request(app).get('/api/exercises')).body.exercises.find((e) => e.id === ids[0])
    expect(ex.sets).toHaveLength(catalog.sets)
    expect(ex.sets.map((s) => s.setNumber)).toEqual(Array.from({ length: catalog.sets }, (_, i) => i + 1))
    expect(ex.sets.every((s) => s.completed === false)).toBe(true)
    expect(workout.name).toMatch(/Day$/)
  })

  it('adds a second exercise and keeps their order', async () => {
    const res = await agent.post('/api/workouts').send({ action: 'add', exerciseId: ids[1], date: DAY })
    expect(res.status).toBe(201)
    workout = res.body.workout
    expect(workout.exercises.map((e) => e.exerciseId)).toEqual([ids[0], ids[1]])
  })

  it('adding the same exercise twice does not duplicate it', async () => {
    const res = await agent.post('/api/workouts').send({ action: 'add', exerciseId: ids[0], date: DAY })
    expect(res.status).toBe(200)
    expect(res.body.added).toBe(false)
    expect(res.body.workout.exercises).toHaveLength(2)
  })

  it('removes an exercise', async () => {
    await agent.post('/api/workouts').send({ action: 'add', exerciseId: ids[2], date: DAY })
    const third = (await agent.get(`/api/workouts?date=${DAY}`)).body.workout.exercises[2]
    const res = await agent.delete(`/api/workouts?workoutExerciseId=${third.workoutExerciseId}&date=${DAY}`)
    expect(res.status).toBe(200)
    expect(res.body.workout.exercises.map((e) => e.exerciseId)).toEqual([ids[0], ids[1]])
  })

  it('rejects unknown exercises, bad ids and unknown actions', async () => {
    expect((await agent.post('/api/workouts').send({ action: 'add', exerciseId: 999999, date: DAY })).status).toBe(404)
    expect((await agent.post('/api/workouts').send({ action: 'add', exerciseId: 'abc', date: DAY })).status).toBe(400)
    expect((await agent.post('/api/workouts').send({ action: 'dance', date: DAY })).status).toBe(400)
  })

  it('start sets the status and start time', async () => {
    const res = await agent.post('/api/workouts').send({ action: 'start', workoutId: workout.id, date: DAY })
    expect(res.status).toBe(200)
    expect(res.body.workout.status).toBe('in_progress')
    expect(Date.parse(res.body.workout.startedAt)).not.toBeNaN()
  })

  it('ticks and unticks a set', async () => {
    const setId = workout.exercises[0].sets[0].id
    const tick = await agent.patch('/api/sets').send({ setId, completed: true })
    expect(tick.status).toBe(200)
    expect(tick.body.set).toEqual({ id: setId, completed: true })
    let saved = (await agent.get(`/api/workouts?date=${DAY}`)).body.workout
    expect(saved.exercises[0].sets[0].completed).toBe(true)

    const untick = await agent.patch('/api/sets').send({ setId, completed: false })
    expect(untick.status).toBe(200)
    expect(untick.body.set.completed).toBe(false)
    saved = (await agent.get(`/api/workouts?date=${DAY}`)).body.workout
    expect(saved.exercises[0].sets[0].completed).toBe(false)
  })

  it('validates set updates', async () => {
    const setId = workout.exercises[0].sets[0].id
    expect((await agent.patch('/api/sets').send({ setId, completed: 'yes' })).status).toBe(400)
    expect((await agent.patch('/api/sets').send({ setId: 999999, completed: true })).status).toBe(404)
    expect((await agent.post('/api/sets').send({ setId, completed: true })).status).toBe(405)
  })

  it('finishing marks it completed and saves the duration', async () => {
    for (const ex of workout.exercises) {
      for (const s of ex.sets) await agent.patch('/api/sets').send({ setId: s.id, completed: true })
    }
    const res = await agent.post('/api/workouts').send({ action: 'finish', workoutId: workout.id, date: DAY })
    expect(res.status).toBe(200)
    expect(res.body.workout.status).toBe('completed')
    expect(res.body.workout.durationMinutes).toBeGreaterThanOrEqual(1)
    expect(Date.parse(res.body.workout.completedAt)).not.toBeNaN()
    expect(res.body.workout.exercises.flatMap((e) => e.sets).every((s) => s.completed)).toBe(true)
  })

  it('finishing again is harmless and keeps the saved duration', async () => {
    const before = (await agent.get(`/api/workouts?date=${DAY}`)).body.workout
    const res = await agent.post('/api/workouts').send({ action: 'finish', workoutId: workout.id, date: DAY })
    expect(res.status).toBe(200)
    expect(res.body.workout.durationMinutes).toBe(before.durationMinutes)
    expect(res.body.workout.completedAt).toBe(before.completedAt)
  })

  it('locks a completed workout: no more adds, removals or set changes', async () => {
    const add = await agent.post('/api/workouts').send({ action: 'add', exerciseId: ids[2], date: DAY })
    expect(add.status).toBe(409)
    const setId = workout.exercises[0].sets[0].id
    const set = await agent.patch('/api/sets').send({ setId, completed: false })
    expect(set.status).toBe(409)
    const del = await agent.delete(`/api/workouts?workoutExerciseId=${workout.exercises[0].workoutExerciseId}&date=${DAY}`)
    expect(del.status).toBe(404)
  })
})

describe('protected routes without login', () => {
  it.each([
    ['GET', '/api/auth/me'],
    ['GET', '/api/dashboard'],
    ['GET', '/api/workouts'],
    ['POST', '/api/workouts'],
    ['DELETE', '/api/workouts?workoutExerciseId=1'],
    ['PATCH', '/api/sets'],
  ])('%s %s returns 401', async (method, path) => {
    const res = await request(app)[method.toLowerCase()](path).send({ action: 'add', exerciseId: 1, setId: 1, completed: true })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('unauthorized')
  })

  it('unknown API routes return a JSON 404', async () => {
    const res = await request(app).get('/api/nope')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('not_found')
  })
})
