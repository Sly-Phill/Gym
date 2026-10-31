// A throwaway in-memory Postgres (PGlite) with the real schema and seed applied.
// Used when no DATABASE_URL is configured, so tests never need (or touch) a real database.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { setSqlForTesting } from '../api/_lib/db.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export async function createMemoryDatabase() {
  const db = new PGlite()
  await db.exec(readFileSync(path.join(root, 'db/schema.sql'), 'utf8'))
  await db.exec(readFileSync(path.join(root, 'db/seed.sql'), 'utf8'))

  // Same calling convention as Neon's `sql` tagged template: resolves to an array of rows.
  const sql = (strings, ...values) => {
    let text = strings[0]
    values.forEach((_, i) => {
      text += `$${i + 1}${strings[i + 1]}`
    })
    return db.query(text, values).then((r) => r.rows)
  }
  return { db, sql }
}

export async function useMemoryDatabase() {
  const memory = await createMemoryDatabase()
  setSqlForTesting(memory.sql)
  return memory
}
