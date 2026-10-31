import { requireUserId } from './auth.js'
import { HttpError, sendError } from './errors.js'

/**
 * Wraps a Vercel-style (req, res) function with method checks, optional auth
 * and friendly JSON errors. With `auth: true`, `req.userId` is the logged-in user.
 */
export function handler({ methods, auth = false }, fn) {
  return async function route(req, res) {
    try {
      if (methods && !methods.includes(req.method)) {
        res.setHeader('Allow', methods.join(', '))
        throw new HttpError(405, `Method ${req.method} is not allowed here.`, 'method_not_allowed')
      }
      if (auth) req.userId = await requireUserId(req)
      res.setHeader('Cache-Control', 'no-store')
      await fn(req, res)
    } catch (err) {
      sendError(res, err)
    }
  }
}

export function body(req) {
  return req.body && typeof req.body === 'object' ? req.body : {}
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** The client sends its local date so "today" matches the user's calendar, not the server's. */
export function requestDate(value) {
  if (typeof value === 'string' && ISO_DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    return value
  }
  return new Date().toISOString().slice(0, 10)
}

export function positiveInt(value, name) {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `${name} must be a positive whole number.`)
  return n
}
