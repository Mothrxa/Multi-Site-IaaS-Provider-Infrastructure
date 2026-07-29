import pg from 'pg'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://admin:admin@localhost:5432/portal',
})

// sqlite -> postgres dialect shims + `?` -> `$1, $2, ...` placeholder conversion
function toPg(sql) {
  let i = 0
  return sql
    .replace(/datetime\('now'\)/gi, "to_char(now(), 'YYYY-MM-DD HH24:MI:SS')")
    .replace(/strftime\('%Y',\s*([a-z_.]+)\)/gi, "to_char($1::timestamp, 'YYYY')")
    .replace(/char\((10|13|9)\)/gi, (_, code) => `chr(${code})`)
    .replace(/\?/g, () => `$${++i}`)
}

const db = {
  prepare(sql) {
    const text = toPg(sql)
    return {
      get: async (...params) => (await pool.query(text, params)).rows[0],
      all: async (...params) => (await pool.query(text, params)).rows,
      run: async (...params) => {
        const r = await pool.query(text, params)
        return { changes: r.rowCount }
      },
    }
  },
  exec: async (sql) => { await pool.query(sql) },
  // Not a real ACID transaction (pg pool, not a single client) — fine for our
  // use cases, which are seed scripts and sequences of independent writes.
  transaction(fn) {
    return async (...args) => fn(...args)
  },
}

let _ready = null

export function getDb() {
  return db
}

export async function initDb() {
  if (_ready) return _ready
  _ready = initSchema(db)
  return _ready
}

async function initSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      department  TEXT NOT NULL,
      role        TEXT NOT NULL CHECK(role IN ('superadmin','it_admin','employee')),
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
      updated_at  TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id         TEXT PRIMARY KEY,
      action     TEXT NOT NULL,
      actor_id   TEXT,
      target     TEXT,
      status     TEXT NOT NULL CHECK(status IN ('ok','error','resolved')),
      message    TEXT,
      payload    TEXT,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
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
      created_at  TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS payroll_slips (
      id          TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES users(id),
      period      TEXT NOT NULL,
      gross       REAL NOT NULL,
      net         REAL NOT NULL,
      status      TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','ready','paid')),
      created_at  TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
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
      created_at  TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
      updated_at  TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS ticket_replies (
      id          TEXT PRIMARY KEY,
      ticket_id   TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      author_id   TEXT NOT NULL REFERENCES users(id),
      body        TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id          TEXT PRIMARY KEY,
      author_id   TEXT NOT NULL REFERENCES users(id),
      scope       TEXT NOT NULL DEFAULT 'company' CHECK(scope IN ('company','it','hr','biz')),
      title       TEXT NOT NULL,
      body        TEXT NOT NULL,
      pinned      INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
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
      uploaded_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
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
      updated_at        TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
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
      created_at  TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id              TEXT PRIMARY KEY,
      referrer_id     TEXT NOT NULL REFERENCES users(id),
      candidate_name  TEXT NOT NULL,
      candidate_email TEXT NOT NULL,
      role_applied    TEXT NOT NULL,
      notes           TEXT,
      status          TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','reviewing','hired','rejected')),
      created_at      TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS open_roles (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      team       TEXT NOT NULL,
      type       TEXT NOT NULL DEFAULT 'Full-time',
      status     TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','on_hold','closed')),
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      imap_pass   TEXT NOT NULL,
      expires_at  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      company         TEXT,
      plan            TEXT NOT NULL DEFAULT 'starter' CHECK(plan IN ('starter','business','enterprise')),
      region          TEXT NOT NULL DEFAULT 'DC-Alger',
      vm_count        INTEGER NOT NULL DEFAULT 0,
      container_count INTEGER NOT NULL DEFAULT 0,
      monthly_revenue REAL NOT NULL DEFAULT 0,
      status          TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','trial','at_risk','churned')),
      renewal_date    TEXT,
      created_at      TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS client_billing (
      id             TEXT PRIMARY KEY,
      client_id      TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      period         TEXT NOT NULL,
      vm_hours       REAL NOT NULL DEFAULT 0,
      egress_gb      REAL NOT NULL DEFAULT 0,
      total_amount   REAL NOT NULL DEFAULT 0,
      status         TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','issued','paid','overdue')),
      invoice_number TEXT,
      issued_date    TEXT,
      due_date       TEXT,
      created_at     TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS deals (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      client_id    TEXT REFERENCES clients(id),
      stage        TEXT NOT NULL DEFAULT 'Discovery' CHECK(stage IN ('Discovery','Qualified','Proposal','Negotiation','Closed Won')),
      contact_name TEXT,
      amount       REAL NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );
  `)

  // migrations — idempotent, safe to run every boot
  await db.exec(`ALTER TABLE documents  ADD COLUMN IF NOT EXISTS archived INTEGER NOT NULL DEFAULT 0`)
  await db.prepare("UPDATE users SET role = 'employee' WHERE role = 'dept_head'").run()
  await db.exec(`ALTER TABLE users      ADD COLUMN IF NOT EXISTS archived INTEGER NOT NULL DEFAULT 0`)
  await db.exec(`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS archived INTEGER DEFAULT 0`)
  // Backfill NULL → 0 for rows added before the column existed
  await db.prepare(`UPDATE audit_logs SET archived = 0 WHERE archived IS NULL`).run()
  // Clean control characters from existing message fields (from raw error output)
  await db.prepare(`UPDATE audit_logs SET message = trim(replace(replace(replace(message, chr(10), ' '), chr(13), ' '), chr(9), ' ')) WHERE message IS NOT NULL`).run()

  const { n } = await db.prepare('SELECT COUNT(*)::int AS n FROM users').get()
  if (n === 0) await seed(db)

  const { n: clientCount } = await db.prepare('SELECT COUNT(*)::int AS n FROM clients').get()
  if (clientCount === 0) await seedClients(db)
}

async function seed(db) {
  const USERS = [
    { name: 'System Admin',    email: 'admin@strata.io',    password: 'Admin123!',   dept: 'it',  role: 'superadmin' },
    { name: 'Sarah Benhadj',   email: 'sarah.b@strata.io',  password: 'Sarah123!',   dept: 'it',  role: 'it_admin'   },
    { name: 'Amira Ould',      email: 'amira.o@strata.io',  password: 'Amira123!',   dept: 'hr',  role: 'employee'   },
    { name: 'Yacine Belkacem', email: 'yacine.b@strata.io', password: 'Yacine123!',  dept: 'biz', role: 'employee'   },
  ]
  const ins = db.prepare(
    'INSERT INTO users (id, name, email, password_hash, department, role) VALUES (?,?,?,?,?,?)'
  )
  for (const u of USERS) {
    await ins.run(randomUUID(), u.name, u.email, bcrypt.hashSync(u.password, 10), u.dept, u.role)
  }
  console.log('[db] seeded 4 users — change passwords after first login!')
  console.log('  admin@strata.io      Admin123!')
  console.log('  sarah.b@strata.io    Sarah123!')
  console.log('  amira.o@strata.io    Amira123!')
  console.log('  yacine.b@strata.io   Yacine123!')
}

async function seedClients(db) {
  const CLIENTS = [
    { name: 'Atlas Cloud',     company: 'Atlas Cloud SARL',     plan: 'enterprise', region: 'DC-Alger',  vm_count: 18, container_count: 42, monthly_revenue: 8400,  status: 'active',  renewal_date: '2026-09-12' },
    { name: 'Helios Tech',     company: 'Helios Technologies',  plan: 'enterprise', region: 'DC-Oran',   vm_count: 12, container_count: 30, monthly_revenue: 6200,  status: 'active',  renewal_date: '2026-08-01' },
    { name: 'Nexion SARL',     company: 'Nexion SARL',          plan: 'business',   region: 'DC-Alger',  vm_count: 6,  container_count: 10, monthly_revenue: 2100,  status: 'active',  renewal_date: '2026-07-20' },
    { name: 'Maris Logistics', company: 'Maris Logistics SPA',  plan: 'business',   region: 'DC-Alger',  vm_count: 4,  container_count: 6,  monthly_revenue: 1450,  status: 'at_risk', renewal_date: '2026-07-02' },
    { name: 'Saharan AI',      company: 'Saharan AI Labs',      plan: 'enterprise', region: 'DC-Oran',   vm_count: 9,  container_count: 4,  monthly_revenue: 7300,  status: 'active',  renewal_date: '2026-10-15' },
    { name: 'Riadh Capital',   company: 'Riadh Capital Group',  plan: 'business',   region: 'DC-Alger',  vm_count: 5,  container_count: 8,  monthly_revenue: 1900,  status: 'at_risk', renewal_date: '2026-06-28' },
    { name: 'Karkur Studios',  company: 'Karkur Studios',       plan: 'starter',    region: 'DC-Constantine', vm_count: 2, container_count: 3, monthly_revenue: 420, status: 'trial',  renewal_date: '2026-07-10' },
    { name: 'Vela Systems',    company: 'Vela Systems Ltd',     plan: 'starter',    region: 'DC-Constantine', vm_count: 1, container_count: 2, monthly_revenue: 280, status: 'churned', renewal_date: null },
  ]
  const ins = db.prepare(`
    INSERT INTO clients (id, name, company, plan, region, vm_count, container_count, monthly_revenue, status, renewal_date)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `)
  const ids = {}
  for (const c of CLIENTS) {
    const id = randomUUID()
    ids[c.name] = id
    await ins.run(id, c.name, c.company, c.plan, c.region, c.vm_count, c.container_count, c.monthly_revenue, c.status, c.renewal_date)
  }

  const billIns = db.prepare(`
    INSERT INTO client_billing (id, client_id, period, vm_hours, egress_gb, total_amount, status, invoice_number, issued_date, due_date)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `)
  const BILLING = [
    { client: 'Atlas Cloud',     period: '2026-05', vm_hours: 12960, egress_gb: 3200, total: 8400, status: 'paid',   inv: 'INV-2026-0501', issued: '2026-06-01', due: '2026-06-15' },
    { client: 'Atlas Cloud',     period: '2026-06', vm_hours: 13104, egress_gb: 3350, total: 8400, status: 'issued', inv: 'INV-2026-0601', issued: '2026-06-15', due: '2026-06-29' },
    { client: 'Helios Tech',     period: '2026-05', vm_hours: 8640,  egress_gb: 1800, total: 6200, status: 'paid',   inv: 'INV-2026-0502', issued: '2026-06-01', due: '2026-06-15' },
    { client: 'Helios Tech',     period: '2026-06', vm_hours: 8712,  egress_gb: 1860, total: 6200, status: 'overdue', inv: 'INV-2026-0602', issued: '2026-06-15', due: '2026-06-29' },
    { client: 'Nexion SARL',     period: '2026-06', vm_hours: 4320,  egress_gb: 540,  total: 2100, status: 'issued', inv: 'INV-2026-0603', issued: '2026-06-15', due: '2026-06-29' },
    { client: 'Maris Logistics', period: '2026-06', vm_hours: 2880,  egress_gb: 310,  total: 1450, status: 'draft',  inv: null, issued: null, due: null },
    { client: 'Saharan AI',      period: '2026-06', vm_hours: 6480,  egress_gb: 2100, total: 7300, status: 'issued', inv: 'INV-2026-0604', issued: '2026-06-15', due: '2026-06-29' },
    { client: 'Riadh Capital',   period: '2026-06', vm_hours: 3600,  egress_gb: 420,  total: 1900, status: 'paid',   inv: 'INV-2026-0503', issued: '2026-06-01', due: '2026-06-15' },
  ]
  for (const b of BILLING) {
    await billIns.run(randomUUID(), ids[b.client], b.period, b.vm_hours, b.egress_gb, b.total, b.status, b.inv, b.issued, b.due)
  }

  const dealIns = db.prepare(`
    INSERT INTO deals (id, name, client_id, stage, contact_name, amount) VALUES (?,?,?,?,?,?)
  `)
  const DEALS = [
    { name: 'Atlas Cloud — capacity expansion',  client: 'Atlas Cloud',     stage: 'Negotiation', contact: 'M. Khelifi',  amount: 15000 },
    { name: 'Helios Tech — DR site',             client: 'Helios Tech',     stage: 'Proposal',    contact: 'R. Amrani',   amount: 22000 },
    { name: 'Nexion SARL — container migration', client: 'Nexion SARL',     stage: 'Qualified',   contact: 'L. Brahimi',  amount: 5400 },
    { name: 'New logo — Tassili Retail',         client: null,              stage: 'Discovery',   contact: 'F. Cherif',   amount: 3200 },
    { name: 'Saharan AI — GPU cluster',          client: 'Saharan AI',      stage: 'Closed Won',  contact: 'N. Boudjema', amount: 48000 },
    { name: 'Riadh Capital — upsell business',   client: 'Riadh Capital',   stage: 'Proposal',    contact: 'S. Tlemcani', amount: 8600 },
    { name: 'Karkur Studios — trial conversion', client: 'Karkur Studios',  stage: 'Negotiation', contact: 'A. Yahia',    amount: 1800 },
  ]
  for (const d of DEALS) {
    await dealIns.run(randomUUID(), d.name, d.client ? ids[d.client] : null, d.stage, d.contact, d.amount)
  }

  console.log('[db] seeded clients, billing and pipeline data')
}
