// Runs Lighthouse (mobile, default throttling) against the production build.
// Usage: npm run build && node scripts/lighthouse.js [label]
// Starts a throwaway in-memory API and `vite preview`, audits 3 pages, prints scores
// and saves them to test-results/lighthouse-<label>.json.
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

const label = process.argv[2] || 'run'
const API_PORT = 3201
const WEB_PORT = 4273
const base = `http://localhost:${WEB_PORT}`

function start(cmd, args, env) {
  return spawn([cmd, ...args].join(' '), { env: { ...process.env, ...env }, shell: true, stdio: 'ignore' })
}

// The servers run through a shell, so stop the whole process tree (child.kill() alone leaves them running on Windows).
function stop(child) {
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  else child.kill()
}

async function ensurePortFree(port) {
  try {
    await fetch(`http://localhost:${port}`)
    throw new Error(`Port ${port} is already in use; stop the old server first.`)
  } catch (err) {
    if (err.message.startsWith('Port')) throw err
  }
}

await ensurePortFree(API_PORT)
await ensurePortFree(WEB_PORT)

async function waitFor(url) {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

const api = start('node', ['server/dev-server.js'], { API_PORT: String(API_PORT), PULSEFIT_DB: 'memory', DATABASE_URL: '' })
const web = start('npx', ['vite', 'preview', '--port', String(WEB_PORT), '--strictPort'], { API_PORT: String(API_PORT) })

try {
  await waitFor(`http://localhost:${API_PORT}/api/stats`)
  await waitFor(base)

  // A member with a workout, so the dashboard has real content
  const signup = await fetch(`${base}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Light House', email: `lighthouse-${Date.now()}@pulsefit.test`, password: 'Test1234!' }),
  })
  if (signup.status !== 201) throw new Error(`Sign up through the preview server failed: ${signup.status} ${await signup.text()}`)
  const cookie = signup.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')
  const d = new Date()
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  for (const exerciseId of [1, 2]) {
    await fetch(`${base}/api/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ action: 'add', exerciseId, date }),
    })
  }

  const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new'] })
  // Put the member's cookies into the audited browser (page scripts must be able to see them).
  const cdp = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`)
  const setCookies = (header) =>
    cdp.contexts()[0].addCookies(
      header
        ? header.split('; ').map((pair) => {
            const [name, value] = pair.split('=')
            return { name, value, url: base }
          })
        : [],
    )
  const results = {}
  const pages = [
    ['Landing', '/', null],
    ['Login', '/login', null],
    ['Dashboard (logged in)', '/dashboard', cookie],
  ]
  for (const [name, path, auth] of pages) {
    await cdp.contexts()[0].clearCookies()
    await setCookies(auth)
    const { lhr } = await lighthouse(`${base}${path}`, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      disableStorageReset: Boolean(auth), // keep the login cookies for member pages
    })
    if (auth && !lhr.finalDisplayedUrl.endsWith(path)) throw new Error(`Expected ${path}, landed on ${lhr.finalDisplayedUrl}`)
    const scores = Object.fromEntries(Object.values(lhr.categories).map((c) => [c.title, Math.round(c.score * 100)]))
    const failing = Object.values(lhr.audits)
      .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable')
      .map((a) => {
        const nodes = (a.details?.items ?? [])
          .map((i) => i.node?.selector || i.node?.snippet)
          .filter(Boolean)
          .slice(0, 3)
        return `${a.id}: ${a.displayValue || a.title}${nodes.length ? ` → ${nodes.join(' | ')}` : ''}`
      })
    results[name] = { scores, failing }
    mkdirSync('test-results', { recursive: true })
    writeFileSync(`test-results/lhr-${path.replace(/\W/g, '') || 'landing'}.json`, JSON.stringify(lhr))
    console.log(`\n${name} (${lhr.finalDisplayedUrl})`, scores)
    for (const f of failing) console.log('   -', f)
  }
  await cdp.close().catch(() => {})
  await chrome.kill()
  mkdirSync('test-results', { recursive: true })
  writeFileSync(`test-results/lighthouse-${label}.json`, JSON.stringify(results, null, 2))
} finally {
  stop(api)
  stop(web)
}
