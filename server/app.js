// Builds an Express app that serves every file in /api exactly like Vercel does:
//   api/stats.js        -> /api/stats
//   api/auth/login.js   -> /api/auth/login
// Files and folders starting with "_" (e.g. api/_lib) are helpers, not routes.
// Used by the local dev server and by the backend tests (Supertest).
import express from 'express'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apiDir = path.join(root, 'api')

export function collectRoutes(dir = apiDir, prefix = '/api') {
  const routes = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      routes.push(...collectRoutes(full, `${prefix}/${entry.name}`))
    } else if (/\.m?js$/.test(entry.name)) {
      const name = entry.name.replace(/\.m?js$/, '')
      routes.push({ route: name === 'index' ? prefix : `${prefix}/${name}`, file: full })
    }
  }
  return routes
}

export async function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '100kb' }))

  const routes = collectRoutes()
  for (const { route, file } of routes) {
    const { default: fn } = await import(pathToFileURL(file).href)
    app.all(route, (req, res, next) => Promise.resolve(fn(req, res)).catch(next))
  }

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'not_found', message: `No API route for ${req.method} ${req.originalUrl}` })
  })

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const badJson = err.type === 'entity.parse.failed'
    if (!badJson) console.error('[api]', err)
    res.status(badJson ? 400 : 500).json({
      error: badJson ? 'bad_request' : 'server_error',
      message: badJson ? 'The request body was not valid JSON.' : 'Something went wrong on our side. Please try again.',
    })
  })

  return { app, routes }
}
