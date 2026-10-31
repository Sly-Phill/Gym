export class HttpError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code || (status === 401 ? 'unauthorized' : status === 404 ? 'not_found' : 'bad_request')
  }
}

export class ConfigError extends Error {}

const SQLSTATE = /^[0-9A-Z]{5}$/

// Postgres answered, but the connection itself is the problem (bad password, missing db, shutting down…)
const CONNECTION_SQLSTATES = new Set(['28P01', '28000', '3D000', '57P01', '57P03'])

function isDbUnreachable(err) {
  if (typeof err?.code === 'string' && SQLSTATE.test(err.code)) {
    return err.code.startsWith('08') || CONNECTION_SQLSTATES.has(err.code)
  }
  return (
    err?.name === 'NeonDbError' ||
    /fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|getaddrinfo|socket|network/i.test(
      `${err?.message} ${err?.cause?.message ?? ''} ${err?.sourceError?.message ?? ''}`,
    )
  )
}

export function sendError(res, err) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.code, message: err.message })
  }
  if (err instanceof ConfigError) {
    console.error('[api] config:', err.message)
    return res.status(503).json({ error: 'config', message: err.message })
  }
  if (err?.code === '42P01') {
    return res.status(503).json({
      error: 'database_not_setup',
      message: "The database tables haven't been created yet. Run `npm run db:setup`, then refresh.",
    })
  }
  if (isDbUnreachable(err)) {
    console.error('[api] database unreachable:', err.message)
    return res.status(503).json({
      error: 'database_unreachable',
      message: "We can't reach the database right now. Check your internet connection and DATABASE_URL, then try again.",
    })
  }
  console.error('[api]', err)
  return res.status(500).json({ error: 'server_error', message: 'Something went wrong on our side. Please try again.' })
}
