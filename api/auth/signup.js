import bcrypt from 'bcryptjs'
import { getSql } from '../_lib/db.js'
import { publicUser, startSession } from '../_lib/auth.js'
import { HttpError } from '../_lib/errors.js'
import { body, handler } from '../_lib/handler.js'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function checkPassword(password) {
  if (!password.trim()) return 'Please choose a password.'
  if (password.length < 8 || password.length > 72) return 'Your password needs 8 to 72 characters.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Your password needs at least one letter and one number.'
  return null
}

function intInRange(value, min, max, fallback, label) {
  if (value === undefined || value === null || value === '') return fallback
  const n = Number(value)
  if (!Number.isInteger(n) || n < min || n > max) throw new HttpError(400, `${label} must be between ${min} and ${max}.`)
  return n
}

export default handler({ methods: ['POST'] }, async (req, res) => {
  const b = body(req)
  const email = String(b.email ?? '').trim().toLowerCase()
  const password = String(b.password ?? '')
  const fullName = String(b.fullName ?? '').trim()

  if (!fullName || fullName.length > 80) throw new HttpError(400, 'Please tell us your name (up to 80 characters).')
  if (!EMAIL.test(email) || email.length > 254) throw new HttpError(400, 'Please enter a valid email address.')
  const passwordProblem = checkPassword(password)
  if (passwordProblem) throw new HttpError(400, passwordProblem, 'weak_password')
  const goalWorkouts = intInRange(b.weeklyGoalWorkouts, 1, 14, 4, 'Weekly workouts goal')
  const goalMinutes = intInRange(b.weeklyGoalMinutes, 10, 3000, 180, 'Weekly minutes goal')

  const sql = getSql()
  const passwordHash = await bcrypt.hash(password, 10)
  const rows = await sql`
    INSERT INTO users (email, password_hash, full_name, weekly_goal_workouts, weekly_goal_minutes)
    VALUES (${email}, ${passwordHash}, ${fullName}, ${goalWorkouts}, ${goalMinutes})
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email, full_name, weekly_goal_workouts, weekly_goal_minutes, created_at`

  if (!rows.length) throw new HttpError(409, 'An account with this email already exists. Try logging in instead.', 'email_taken')

  await startSession(res, rows[0].id)
  res.status(201).json({ user: publicUser(rows[0]) })
})
