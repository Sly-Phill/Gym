import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

if (existsSync('.env')) process.loadEnvFile('.env')

// Real Neon when DATABASE_URL is set (test users are cleaned up afterwards);
// otherwise the API runs on a throwaway in-memory Postgres.
const useMemory = !process.env.DATABASE_URL
const API_PORT = 3101
const WEB_PORT = 5174

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  globalTeardown: './e2e/global-teardown.js',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    // iPhone 13 screen size, touch and user agent, rendered with Chromium
    { name: 'iphone', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: [
    {
      command: 'node server/dev-server.js',
      url: `http://localhost:${API_PORT}/api/stats`,
      env: { API_PORT: String(API_PORT), ...(useMemory ? { PULSEFIT_DB: 'memory' } : {}) },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PORT: String(API_PORT) },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
