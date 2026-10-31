// Runs db/schema.sql then db/seed.sql against DATABASE_URL. Safe to re-run.
import { readFileSync } from 'node:fs'
import { Pool, neonConfig } from '@neondatabase/serverless'

process.loadEnvFile('.env')

// Node 22+ ships a global WebSocket, which the Pool (multi-statement SQL) needs.
neonConfig.webSocketConstructor = globalThis.WebSocket

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

try {
  const client = await pool.connect()
  try {
    // Seeded class times ("Monday 06:30") are interpreted in your local time zone.
    await client.query(`SET TIME ZONE '${timeZone.replace(/'/g, '')}'`)

    console.log('→ Creating tables (db/schema.sql)…')
    await client.query(readFileSync('db/schema.sql', 'utf8'))

    console.log('→ Seeding sample data (db/seed.sql)…')
    await client.query(readFileSync('db/seed.sql', 'utf8'))

    const { rows } = await client.query(`
      SELECT 'exercises' AS table, count(*)::int AS rows FROM exercises
      UNION ALL SELECT 'classes', count(*)::int FROM classes
      UNION ALL SELECT 'classes this week', count(*)::int FROM classes
        WHERE start_time >= date_trunc('week', now()) AND start_time < date_trunc('week', now()) + interval '7 days'
      UNION ALL SELECT 'users', count(*)::int FROM users`)
    console.log('\n✓ Database ready (time zone: ' + timeZone + ')')
    console.table(rows)
  } finally {
    client.release()
  }
} catch (err) {
  console.error('\n✗ Database setup failed:', err.message)
  if (/password authentication|ENOTFOUND|getaddrinfo|fetch failed|WebSocket/i.test(err.message)) {
    console.error('  Check DATABASE_URL in .env (copy it again from Neon → Connect) and your internet connection.')
  }
  process.exitCode = 1
} finally {
  await pool.end()
}
