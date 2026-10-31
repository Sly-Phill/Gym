import { SignJWT, jwtVerify } from 'jose'
import { ConfigError, HttpError } from './errors.js'

const COOKIE = 'pf_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function secretKey() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new ConfigError('JWT_SECRET is missing or too short. Run `npm run dev` to generate one in .env.')
  }
  return new TextEncoder().encode(secret)
}

function readCookie(req, name) {
  const header = req.headers?.cookie || ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

// A second, non-secret cookie the browser can read, so the app knows whether to ask /api/auth/me
// at all. Logged-out visitors then make no request (and get no 401 noise in the console).
const HINT_COOKIE = 'pf_signed_in'

function cookies(token, maxAge) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return [
    `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
    `${HINT_COOKIE}=${maxAge ? '1' : ''}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`,
  ]
}

export async function startSession(res, userId) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey())
  res.setHeader('Set-Cookie', cookies(token, MAX_AGE))
}

export function endSession(res) {
  res.setHeader('Set-Cookie', cookies('', 0))
}

/** Returns the logged-in user's id, or null if there's no valid session. */
export async function getUserId(req) {
  const token = readCookie(req, COOKIE)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] })
    const id = Number(payload.sub)
    return Number.isInteger(id) && id > 0 ? id : null
  } catch (err) {
    if (err instanceof ConfigError) throw err
    return null
  }
}

export async function requireUserId(req) {
  const id = await getUserId(req)
  if (!id) throw new HttpError(401, 'Please log in to continue.')
  return id
}

export function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    weeklyGoalWorkouts: row.weekly_goal_workouts,
    weeklyGoalMinutes: row.weekly_goal_minutes,
    createdAt: row.created_at,
  }
}
