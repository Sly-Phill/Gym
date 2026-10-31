// Removes every account the browser tests created (their workouts and sets cascade).
// With the in-memory database there is nothing to clean: it disappears with the server.
import { existsSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'
import { E2E_EMAIL_DOMAIN } from './helpers.js'

export default async function globalTeardown() {
  if (existsSync('.env')) process.loadEnvFile('.env')
  if (!process.env.DATABASE_URL) return
  const sql = neon(process.env.DATABASE_URL)
  const rows = await sql`DELETE FROM users WHERE email LIKE ${`%@${E2E_EMAIL_DOMAIN}`} RETURNING id`
  console.log(`[e2e] Removed ${rows.length} test account(s)`)
}
