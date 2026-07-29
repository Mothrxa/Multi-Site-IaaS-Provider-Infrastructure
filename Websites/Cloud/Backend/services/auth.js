import jwt from 'jsonwebtoken'
import dgram from 'dgram'
import crypto from 'crypto'
import { randomUUID } from 'crypto'
import { getDb } from './db.js'
import pg from 'pg'

const JWT_SECRET  = process.env.JWT_SECRET  || 'strata_cloud_dev_secret_change_in_prod'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h'

// ── RADIUS client config ───────────────────────────────────────────────────────
const RADIUS_HOST   = process.env.RADIUS_HOST   || 'localhost'
const RADIUS_PORT   = parseInt(process.env.RADIUS_PORT   || '1812')
const RADIUS_SECRET = process.env.RADIUS_SECRET || 'strataprod'

// RADIUS attribute codes
const ATTR = { USER_NAME: 1, USER_PASSWORD: 2, NAS_IP_ADDRESS: 4, NAS_PORT: 5, MESSAGE_AUTHENTICATOR: 80 }
const CODE = { ACCESS_REQUEST: 1, ACCESS_ACCEPT: 2, ACCESS_REJECT: 3 }

// Encode a PAP password per RFC 2865 §5.2
function encodePapPassword(password, authenticator, secret) {
  const secretBuf = Buffer.from(secret, 'utf8')
  const passBuf   = Buffer.from(password.padEnd(Math.ceil(password.length / 16) * 16, '\0'), 'utf8')
  const result    = Buffer.alloc(passBuf.length)
  let prev = authenticator
  for (let i = 0; i < passBuf.length; i += 16) {
    const b = crypto.createHash('md5').update(secretBuf).update(prev).digest()
    for (let j = 0; j < 16; j++) result[i + j] = (passBuf[i + j] || 0) ^ b[j]
    prev = result.slice(i, i + 16)
  }
  return result
}

// Build a RADIUS Access-Request packet
function buildAccessRequest(id, authenticator, username, password) {
  const userNameBuf  = Buffer.from(username, 'utf8')
  const userPassBuf  = encodePapPassword(password, authenticator, RADIUS_SECRET)
  const nasIp        = Buffer.from([127, 0, 0, 1])

  const attrs = Buffer.concat([
    Buffer.from([ATTR.USER_NAME, 2 + userNameBuf.length]), userNameBuf,
    Buffer.from([ATTR.USER_PASSWORD, 2 + userPassBuf.length]), userPassBuf,
    Buffer.from([ATTR.NAS_IP_ADDRESS, 6]), nasIp,
    Buffer.from([ATTR.NAS_PORT, 6, 0, 0, 0, 0]),
    // Message-Authenticator placeholder (16 bytes of zeros, computed below)
    Buffer.from([ATTR.MESSAGE_AUTHENTICATOR, 18, ...new Array(16).fill(0)]),
  ])

  const len  = 20 + attrs.length
  const pkt  = Buffer.alloc(len)
  pkt[0] = CODE.ACCESS_REQUEST
  pkt[1] = id
  pkt.writeUInt16BE(len, 2)
  authenticator.copy(pkt, 4)
  attrs.copy(pkt, 20)

  // Compute Message-Authenticator over the whole packet
  const maOffset = pkt.indexOf(Buffer.from([ATTR.MESSAGE_AUTHENTICATOR, 18]))
  if (maOffset !== -1) {
    const mac = crypto.createHmac('md5', RADIUS_SECRET).update(pkt).digest()
    mac.copy(pkt, maOffset + 2)
  }
  return pkt
}

// Send RADIUS Access-Request and resolve true/false
function radiusAuth(username, password) {
  return new Promise((resolve) => {
    const sock = dgram.createSocket('udp4')
    const id   = Math.floor(Math.random() * 256)
    const authenticator = crypto.randomBytes(16)
    const pkt  = buildAccessRequest(id, authenticator, username, password)

    const timeout = setTimeout(() => { sock.close(); resolve(false) }, 5000)

    sock.once('message', (msg) => {
      clearTimeout(timeout)
      sock.close()
      resolve(msg[0] === CODE.ACCESS_ACCEPT)
    })

    sock.send(pkt, RADIUS_PORT, RADIUS_HOST, (err) => { if (err) { clearTimeout(timeout); sock.close(); resolve(false) } })
  })
}

// ── RADIUS DB: add user to radcheck — same Postgres instance as the Cloud DB,
// both co-located on 10.0.40.2 ───────────────────────────────────────────────
const radiusPool = new pg.Pool({
  host:     process.env.RADIUS_DB_HOST || 'localhost',
  port:     parseInt(process.env.RADIUS_DB_PORT || '5432'),
  database: process.env.RADIUS_DB_NAME || 'radius',
  user:     process.env.RADIUS_DB_USER || 'radius',
  password: process.env.RADIUS_DB_PASS || 'radius',
})

async function radiusProvision(username, password) {
  const result = await radiusPool.query(
    `INSERT INTO radcheck (username, attribute, op, value)
     VALUES ($1, 'Cleartext-Password', ':=', $2)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [username, password]
  )
  if (result.rowCount === 0) {
    // ON CONFLICT DO NOTHING silently no-ops if a row already exists for this
    // username — that's a real failure state we need to surface, not swallow.
    const existing = await radiusPool.query('SELECT 1 FROM radcheck WHERE username = $1', [username])
    if (existing.rowCount === 0) throw new Error('RADIUS provisioning failed: insert did not persist')
  }
}

// ── Signup ─────────────────────────────────────────────────────────────────────
export async function signup(name, email, password) {
  const db = getDb()
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) return null

  // Provision RADIUS credential first — if this fails, we never create the
  // local profile row, so there's no way to end up with a Cloud account that
  // can never log in.
  try {
    await radiusProvision(email, password)
  } catch (e) {
    console.error('[radius] provision failed:', e.message)
    throw new Error('Could not create account — authentication service is unavailable. Try again shortly.')
  }

  const id = randomUUID()
  // Store a dummy hash — auth is done by RADIUS, not bcrypt
  await db.prepare(
    `INSERT INTO users (id, name, email, password_hash) VALUES (?,?,?,?)`
  ).run(id, name, email, 'radius-authed')

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  return startSession(user)
}

// ── Login ──────────────────────────────────────────────────────────────────────
export async function login(email, password) {
  const db = getDb()
  // Authenticate against RADIUS (username = email)
  const ok = await radiusAuth(email, password)
  if (!ok) return null

  // Load profile from local Postgres (create on-the-fly if first login via pre-existing RADIUS account)
  let user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) {
    const id = randomUUID()
    await db.prepare(
      `INSERT INTO users (id, name, email, password_hash) VALUES (?,?,?,?)`
    ).run(id, email.split('@')[0], email, 'radius-authed')
    user = await db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  }

  return startSession(user)
}

// ── Session helpers ────────────────────────────────────────────────────────────
async function startSession(user) {
  const db = getDb()
  const sid       = randomUUID()
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
  await db.prepare(
    `INSERT INTO sessions (id, user_id, os, browser, expires_at) VALUES (?,?,?,?,?)`
  ).run(sid, user.id, 'Linux', 'Chrome', expiresAt)

  const token = jwt.sign({ sub: user.id, sid }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
  return { token, user: publicUser(user) }
}

export async function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const db      = getDb()
    const session = await db.prepare(
      "SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')"
    ).get(payload.sid)
    if (!session) return null
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id)
    if (!user) return null
    await db.prepare("UPDATE sessions SET last_seen = to_char(now(), 'YYYY-MM-DD HH24:MI:SS') WHERE id = ?").run(session.id)
    return { ...publicUser(user), sid: session.id }
  } catch {
    return null
  }
}

export async function logout(sid) {
  await getDb().prepare('DELETE FROM sessions WHERE id = ?').run(sid)
}

export function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, plan: u.plan, status: u.status }
}
