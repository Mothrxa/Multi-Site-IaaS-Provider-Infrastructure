// One-off migration: copy recovered SQLite data into the new Postgres `portal` database.
// Usage: DATABASE_URL=postgres://admin:admin@localhost:5433/portal node scripts/migrate-sqlite-to-pg.mjs
import Database from 'better-sqlite3'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initDb, getDb } from '../services/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sqlite = new Database(resolve(__dirname, '../../Database/portal.db'), { readonly: true })

await initDb()
const db = getDb()

// Tables that get auto-seeded by initDb() — wipe before importing the real data.
await db.exec(`
  TRUNCATE TABLE
    announcement_reactions, announcements, ticket_replies, tickets,
    expense_claims, referrals, open_roles, employee_profiles,
    payroll_slips, leave_requests, audit_logs, sessions,
    client_billing, deals, documents, clients, users
  CASCADE
`)

// Order matters: parents before children.
const TABLES = [
  'users',
  'clients',
  'client_billing',
  'deals',
  'sessions',
  'audit_logs',
  'leave_requests',
  'payroll_slips',
  'tickets',
  'ticket_replies',
  'announcements',
  'announcement_reactions',
  'documents',
  'employee_profiles',
  'expense_claims',
  'referrals',
  'open_roles',
]

for (const table of TABLES) {
  const rows = sqlite.prepare(`SELECT * FROM ${table}`).all()
  if (!rows.length) {
    console.log(`${table}: 0 rows`)
    continue
  }
  const cols = Object.keys(rows[0])
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(',')
  const sql = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`
  const stmt = db.prepare(sql)
  for (const row of rows) {
    await stmt.run(...cols.map(c => row[c]))
  }
  console.log(`${table}: ${rows.length} rows`)
}

console.log('done')
process.exit(0)
