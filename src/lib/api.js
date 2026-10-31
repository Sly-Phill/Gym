// Tiny fetch wrapper for the /api functions. The browser never talks to the database directly.

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

const OFFLINE_MESSAGE = "Can't reach the PulseFit server. Make sure `npm run dev` is running, then try again."

export async function api(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(OFFLINE_MESSAGE, 0, 'network')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // A non-JSON 5xx means the Vite proxy couldn't reach the local API server.
    if (!data && res.status >= 500) throw new ApiError(OFFLINE_MESSAGE, res.status, 'network')
    throw new ApiError(data?.message || 'Something went wrong. Please try again.', res.status, data?.error)
  }
  return data
}

/** The user's local calendar date (YYYY-MM-DD), so "today" matches their timezone. */
export function localDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
