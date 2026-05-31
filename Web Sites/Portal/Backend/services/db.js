import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH   = resolve(__dirname, '../../Database/portal.db')

let _db = null

export function getDb() {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initSchema(_db)
  return _db
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      department  TEXT NOT NULL,
      role        TEXT NOT NULL CHECK(role IN ('superadmin','it_admin','employee')),
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id         TEXT PRIMARY KEY,
      action     TEXT NOT NULL,
      actor_id   TEXT,
      target     TEXT,
      status     TEXT NOT NULL CHECK(status IN ('ok','error','resolved')),
      message    TEXT,
      payload    TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id          TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES users(id),
      type        TEXT NOT NULL CHECK(type IN ('annual','sick','personal','parental')),
      start_date  TEXT NOT NULL,
      end_date    TEXT NOT NULL,
      reason      TEXT,
      status      TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
      reviewed_by TEXT REFERENCES users(id),
      reviewed_at TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payroll_slips (
      id          TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES users(id),
      period      TEXT NOT NULL,
      gross       REAL NOT NULL,
      net         REAL NOT NULL,
      status      TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','ready','paid')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id          TEXT PRIMARY KEY,
      number      INTEGER NOT NULL,
      submitter_id TEXT NOT NULL REFERENCES users(id),
      title       TEXT NOT NULL,
      description TEXT,
      priority    TEXT NOT NULL DEFAULT 'P3' CHECK(priority IN ('P1','P2','P3','P4')),
      status      TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved','closed')),
      assignee_id TEXT REFERENCES users(id),
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket_replies (
      id          TEXT PRIMARY KEY,
      ticket_id   TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      author_id   TEXT NOT NULL REFERENCES users(id),
      body        TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id          TEXT PRIMARY KEY,
      author_id   TEXT NOT NULL REFERENCES users(id),
      scope       TEXT NOT NULL DEFAULT 'company' CHECK(scope IN ('company','it','hr','biz')),
      title       TEXT NOT NULL,
      body        TEXT NOT NULL,
      pinned      INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS announcement_reactions (
      id              TEXT PRIMARY KEY,
      announcement_id TEXT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
      user_id         TEXT NOT NULL REFERENCES users(id),
      emoji           TEXT NOT NULL,
      UNIQUE(announcement_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      file_path   TEXT NOT NULL,
      size_bytes  INTEGER NOT NULL DEFAULT 0,
      mime_type   TEXT NOT NULL DEFAULT 'application/octet-stream',
      owner_id    TEXT NOT NULL REFERENCES users(id),
      dept        TEXT NOT NULL DEFAULT 'company' CHECK(dept IN ('company','it','hr','biz')),
      acl         TEXT NOT NULL DEFAULT 'everyone' CHECK(acl IN ('everyone','dept_only','owner_only')),
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS employee_profiles (
      id                TEXT PRIMARY KEY,
      user_id           TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      phone             TEXT,
      address           TEXT,
      emergency_name    TEXT,
      emergency_phone   TEXT,
      iban              TEXT,
      personal_email    TEXT,
      updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expense_claims (
      id          TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES users(id),
      description TEXT NOT NULL,
      amount      REAL NOT NULL,
      currency    TEXT NOT NULL DEFAULT 'DZD',
      category    TEXT NOT NULL,
      receipt_path TEXT,
      status      TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id              TEXT PRIMARY KEY,
      referrer_id     TEXT NOT NULL REFERENCES users(id),
      candidate_name  TEXT NOT NULL,
      candidate_email TEXT NOT NULL,
      role_applied    TEXT NOT NULL,
      notes           TEXT,
      status          TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','reviewing','hired','rejected')),
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS open_roles (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      team       TEXT NOT NULL,
      type       TEXT NOT NULL DEFAULT 'Full-time',
      status     TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','on_hold','closed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      imap_pass   TEXT NOT NULL,
      expires_at  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // migrations — idempotent, safe to run every boot
  try { db.exec(`ALTER TABLE documents ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`) } catch {}
  db.prepare("UPDATE users SET role = 'employee' WHERE role = 'dept_head'").run()
  try { db.exec(`ALTER TABLE users      ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`) } catch {}
  try { db.exec(`ALTER TABLE audit_logs ADD COLUMN archived INTEGER DEFAULT 0`) } catch {}
  // Backfill NULL → 0 for rows added before the column existed
  db.prepare(`UPDATE audit_logs SET archived = 0 WHERE archived IS NULL`).run()
  // Clean control characters from existing message fields (from raw error output)
  db.prepare(`UPDATE audit_logs SET message = trim(replace(replace(replace(message, char(10), ' '), char(13), ' '), char(9), ' ')) WHERE message IS NOT NULL`).run()

  const { n } = db.prepare('SELECT COUNT(*) AS n FROM users').get()
  if (n === 0) seed(db)
}

function seed(db) {
  const USERS = [
    { name: 'System Admin',    email: 'admin@strata.io',    password: 'Admin123!',   dept: 'it',  role: 'superadmin' },
    { name: 'Sarah Benhadj',   email: 'sarah.b@strata.io',  password: 'Sarah123!',   dept: 'it',  role: 'it_admin'   },
    { name: 'Amira Ould',      email: 'amira.o@strata.io',  password: 'Amira123!',   dept: 'hr',  role: 'employee'   },
    { name: 'Yacine Belkacem', email: 'yacine.b@strata.io', password: 'Yacine123!',  dept: 'biz', role: 'employee'   },
  ]
  const ins = db.prepare(
    'INSERT INTO users (id, name, email, password_hash, department, role) VALUES (?,?,?,?,?,?)'
  )
  const tx = db.transaction(() => {
    for (const u of USERS) {
      ins.run(randomUUID(), u.name, u.email, bcrypt.hashSync(u.password, 10), u.dept, u.role)
    }
  })
  tx()
  console.log('[db] seeded 4 users — change passwords after first login!')
  console.log('  admin@strata.io      Admin123!')
  console.log('  sarah.b@strata.io    Sarah123!')
  console.log('  amira.o@strata.io    Amira123!')
  console.log('  yacine.b@strata.io   Yacine123!')
}
