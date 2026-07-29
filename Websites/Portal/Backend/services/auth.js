import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID, createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { getDb } from './db.js'

const JWT_SECRET  = process.env.JWT_SECRET  || 'strata_dev_secret_change_in_prod'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h'

// Derive a 32-byte AES key from the JWT secret
const AES_KEY = Buffer.alloc(32)
Buffer.from(JWT_SECRET).copy(AES_KEY)

function encryptPass(plaintext) {
  const iv     = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', AES_KEY, iv)
  const enc    = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + enc.toString('hex')
}

function decryptPass(stored) {
  const [ivHex, encHex] = stored.split(':')
  const decipher = createDecipheriv('aes-256-cbc', AES_KEY, Buffer.from(ivHex, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8')
}

export async function login(email, password) {
  const db   = getDb()
  const user = await db.prepare('SELECT * FROM users WHERE email = ? AND active = 1 AND archived = 0').get(email)
  if (!user) return null
  if (!bcrypt.compareSync(password, user.password_hash)) return null

  // Create session — store encrypted IMAP password (same as portal password)
  const sid       = randomUUID()
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
  await db.prepare(
    'INSERT INTO sessions (id, user_id, imap_pass, expires_at) VALUES (?,?,?,?)'
  ).run(sid, user.id, encryptPass(password), expiresAt)

  const token = jwt.sign(
    { sub: user.id, sid, name: user.name, email: user.email, dept: user.department, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES },
  )
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
    const user = await db.prepare('SELECT * FROM users WHERE id = ? AND active = 1 AND archived = 0').get(session.user_id)
    if (!user) return null
    // IMAP account uses mail domain, not portal email domain
    const MAIL_DOMAIN = process.env.MAIL_DOMAIN || 'pfe2627.xyz'
    const mailUser    = `${user.email.split('@')[0]}@${MAIL_DOMAIN}`
    return {
      ...publicUser(user),
      imapCreds: { user: mailUser, pass: decryptPass(session.imap_pass) },
    }
  } catch {
    return null
  }
}

export async function logout(sid) {
  await getDb().prepare('DELETE FROM sessions WHERE id = ?').run(sid)
}

export function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, dept: u.department, role: u.role, active: u.active, archived: u.archived ?? 0 }
}

// ── Admin helpers ──────────────────────────────────────────────────────────

const USER_COLS = 'id, name, email, department, role, active, archived, created_at'

export async function listUsers() {
  return getDb().prepare(`SELECT ${USER_COLS} FROM users ORDER BY archived ASC, created_at ASC`).all()
}

export async function createUser({ name, email, password, department, role }) {
  const db   = getDb()
  const id   = randomUUID()
  const hash = bcrypt.hashSync(password, 10)
  await db.prepare(
    'INSERT INTO users (id, name, email, password_hash, department, role) VALUES (?,?,?,?,?,?)'
  ).run(id, name, email, hash, department, role)
  return db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).get(id)
}

export async function updateUser(id, fields) {
  const db   = getDb()
  const sets = []
  const vals = []
  if (fields.name)                  { sets.push('name = ?');         vals.push(fields.name) }
  if (fields.department)            { sets.push('department = ?');   vals.push(fields.department) }
  if (fields.role)                  { sets.push('role = ?');         vals.push(fields.role) }
  if (fields.active   !== undefined){ sets.push('active = ?');       vals.push(fields.active   ? 1 : 0) }
  if (fields.archived !== undefined){ sets.push('archived = ?');     vals.push(fields.archived ? 1 : 0) }
  if (fields.password)              { sets.push('password_hash = ?');vals.push(bcrypt.hashSync(fields.password, 10)) }
  if (!sets.length) return null
  sets.push("updated_at = datetime('now')")
  vals.push(id)
  await db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  return db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).get(id)
}
