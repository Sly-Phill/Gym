import { neon } from '@neondatabase/serverless'
import { ConfigError } from './errors.js'

let sql

// HTTP driver: one fetch per query, ideal for serverless functions.
export function getSql() {
  if (sql) return sql
  if (!process.env.DATABASE_URL) {
    throw new ConfigError('DATABASE_URL is not set. Add your Neon connection string to .env and restart `npm run dev`.')
  }
  sql = neon(process.env.DATABASE_URL)
  return sql
}

/** Tests only: swap in another tagged-template SQL function (e.g. an in-memory Postgres). */
export function setSqlForTesting(fn) {
  sql = fn
}
