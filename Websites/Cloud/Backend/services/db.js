import pg from 'pg'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://admin:admin@localhost:5432/cloud',
})

// `?` -> `$1, $2, ...` placeholder conversion + a couple sqlite-isms
function toPg(sql) {
  let i = 0
  return sql
    .replace(/datetime\('now'\)/gi, "to_char(now(), 'YYYY-MM-DD HH24:MI:SS')")
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
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      plan          TEXT NOT NULL DEFAULT 'starter' CHECK(plan IN ('starter','business','enterprise')),
      status        TEXT NOT NULL DEFAULT 'active',
      timezone      TEXT NOT NULL DEFAULT 'Africa/Algiers (UTC+1)',
      language      TEXT NOT NULL DEFAULT 'English',
      two_factor    INTEGER NOT NULL DEFAULT 0,
      credit        REAL NOT NULL DEFAULT 100,
      billing_model TEXT NOT NULL DEFAULT 'payg' CHECK(billing_model IN ('payg','prepaid','monthly')),
      spend_cap         REAL NOT NULL DEFAULT 0,
      alert_threshold   REAL NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ip          TEXT,
      os          TEXT,
      browser     TEXT,
      expires_at  TEXT NOT NULL,
      last_seen   TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
      created_at  TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS resources (
      id           TEXT PRIMARY KEY,
      user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind         TEXT NOT NULL CHECK(kind IN ('vm','container')),
      name         TEXT NOT NULL,
      label        TEXT,
      image        TEXT NOT NULL,
      region       TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'deploying' CHECK(status IN ('running','deploying','stopped','rebooting','failed')),
      plan_id      TEXT NOT NULL,
      ip           TEXT,
      vcpu         REAL NOT NULL DEFAULT 1,
      ram_gb       REAL NOT NULL DEFAULT 1,
      storage_gb   REAL NOT NULL DEFAULT 25,
      hourly_rate  REAL NOT NULL DEFAULT 0,
      replicas     INTEGER NOT NULL DEFAULT 1,
      ports        TEXT,
      env          TEXT,
      created_at   TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action     TEXT NOT NULL,
      detail     TEXT,
      kind       TEXT NOT NULL DEFAULT 'accent',
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS api_tokens (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      prefix     TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      scope      TEXT NOT NULL DEFAULT 'full' CHECK(scope IN ('full','read')),
      last_used  TEXT,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS ssh_keys (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      public_key  TEXT NOT NULL,
      key_type    TEXT NOT NULL DEFAULT 'ssh-ed25519',
      fingerprint TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS payment_methods (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      brand      TEXT NOT NULL,
      last4      TEXT NOT NULL,
      exp_month  INTEGER,
      exp_year   INTEGER,
      holder     TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      number     TEXT NOT NULL,
      period     TEXT NOT NULL,
      amount     REAL NOT NULL,
      issued     TEXT NOT NULL
    );

    ALTER TABLE resources ADD COLUMN IF NOT EXISTS stage TEXT;
    ALTER TABLE resources ADD COLUMN IF NOT EXISTS error_message TEXT;
    ALTER TABLE resources ADD COLUMN IF NOT EXISTS public_ip TEXT;
  `)

  const { n } = await db.prepare('SELECT COUNT(*)::int AS n FROM users').get()
  if (n === 0) await seed(db)
}

async function seed(db) {
  const id = randomUUID()
  await db.prepare(
    `INSERT INTO users (id, name, email, password_hash, plan, status, credit)
     VALUES (?,?,?,?,?,?,?)`
  ).run(id, 'Demo User', 'demo@strata.io', bcrypt.hashSync('Demo1234!', 10), 'business', 'active', 250)

  const RES = [
    { kind: 'vm',        name: 'web-prod-01',  label: 'Production web server', image: 'Ubuntu-24.04 LTS', region: 'alg1', status: 'running',   plan_id: 's-2-4',   ip: '157.245.12.10', vcpu: 2, ram: 4,  disk: 80,  rate: 0.0357, replicas: 1 },
    { kind: 'vm',        name: 'db-primary',   label: 'Postgres primary',      image: 'Ubuntu-24.04 LTS', region: 'fra1', status: 'running',   plan_id: 'p-2-8',   ip: '157.245.12.18', vcpu: 2, ram: 8,  disk: 100, rate: 0.1042, replicas: 1 },
    { kind: 'vm',        name: 'worker-02',    label: 'Background jobs',       image: 'Debian-12',        region: 'nyc3', status: 'stopped',   plan_id: 's-2-2',   ip: '157.245.12.31', vcpu: 2, ram: 2,  disk: 60,  rate: 0.0179, replicas: 1 },
    { kind: 'container', name: 'api-gateway',  label: null,                    image: 'nginx:1.27',       region: 'alg1', status: 'running',   plan_id: 'c-small', ip: '10.0.4.12',     vcpu: 1, ram: 1,  disk: 0,   rate: 0.0042, replicas: 2 },
    { kind: 'container', name: 'redis-cache',  label: null,                    image: 'redis:7-alpine',   region: 'alg1', status: 'running',   plan_id: 'c-micro', ip: '10.0.4.18',     vcpu: 0.5, ram: 0.5, disk: 0, rate: 0.0021, replicas: 1 },
  ]
  const ins = db.prepare(
    `INSERT INTO resources (id, user_id, kind, name, label, image, region, status, plan_id, ip, vcpu, ram_gb, storage_gb, hourly_rate, replicas)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  )
  for (const r of RES) {
    await ins.run(randomUUID(), id, r.kind, r.name, r.label, r.image, r.region, r.status, r.plan_id, r.ip, r.vcpu, r.ram, r.disk, r.rate, r.replicas)
  }

  const act = db.prepare(`INSERT INTO activity_log (id, user_id, action, detail, kind) VALUES (?,?,?,?,?)`)
  await act.run(randomUUID(), id, 'Signed in', 'New session started', 'accent')
  await act.run(randomUUID(), id, 'Deployed web-prod-01', 'alg1 · s-2-4', 'good')

  console.log('[db] seeded demo user — demo@strata.io / Demo1234!')
}
