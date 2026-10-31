// Local stand-in for Vercel's serverless functions (see server/app.js).
import path from 'node:path'
import { createApp, root } from './app.js'

try {
  process.loadEnvFile(path.join(root, '.env'))
} catch {
  console.warn('[api] No .env file found')
}

// Test-only: PULSEFIT_DB=memory runs the API on a throwaway in-memory Postgres (used by the
// browser tests when no DATABASE_URL is configured). Never set this outside of tests.
if (process.env.PULSEFIT_DB === 'memory') {
  const { useMemoryDatabase } = await import('../test/memory-db.js')
  await useMemoryDatabase()
  process.env.JWT_SECRET ||= 'test-secret-'.padEnd(48, 'x')
  console.log('[api] Using in-memory test database')
}

const PORT = Number(process.env.API_PORT) || 3001
const { app, routes } = await createApp()

app.listen(PORT, () => {
  console.log(`[api] PulseFit API on http://localhost:${PORT} (${routes.length} routes)`)
  for (const r of routes) console.log(`[api]   ${r.route}`)
})
