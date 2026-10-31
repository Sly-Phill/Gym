// Makes sure .env exists and has what the API needs.
// - Generates a strong JWT_SECRET if it's missing.
// - Stops with clear instructions if DATABASE_URL is missing.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const ENV_FILE = '.env'
const TEMPLATE = 'DATABASE_URL=\nJWT_SECRET=\n'

if (!existsSync(ENV_FILE)) {
  writeFileSync(ENV_FILE, existsSync('.env.example') ? readFileSync('.env.example', 'utf8') : TEMPLATE)
  console.log('Created .env')
}

let text = readFileSync(ENV_FILE, 'utf8')

const read = (key) =>
  (text.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1] ?? '').trim().replace(/^["']|["']$/g, '')

function write(key, value) {
  const line = `${key}=${value}`
  const pattern = new RegExp(`^${key}=.*$`, 'm')
  text = pattern.test(text) ? text.replace(pattern, line) : `${text}${text.endsWith('\n') || !text ? '' : '\n'}${line}\n`
  writeFileSync(ENV_FILE, text)
}

if (!read('JWT_SECRET')) {
  write('JWT_SECRET', randomBytes(48).toString('base64url'))
  console.log('Generated a new random JWT_SECRET and saved it to .env')
}

const url = read('DATABASE_URL')
if (!url || !/^postgres(ql)?:\/\//.test(url)) {
  console.error(`
  ┌──────────────────────────────────────────────────────────────────┐
  │  DATABASE_URL is missing from .env                               │
  └──────────────────────────────────────────────────────────────────┘

  Get your free Neon connection string:
    1. Go to https://console.neon.tech and sign in (free plan is fine).
    2. Create a project (any name, e.g. "pulsefit"), or open your existing one.
    3. On the Project Dashboard, click the "Connect" button (top right).
    4. Leave Branch = production, Database = neondb, keep "Connection pooling" ON.
    5. Click "Show password", then copy the full string. It looks like:
         postgresql://neondb_owner:xxxx@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
    6. Paste it into .env in this folder:
         DATABASE_URL=postgresql://...

  Then run:  npm run db:setup   and   npm run dev
`)
  process.exit(1)
}
