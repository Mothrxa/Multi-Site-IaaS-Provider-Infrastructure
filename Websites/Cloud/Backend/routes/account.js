import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto, { randomUUID } from 'crypto'
import { getDb } from '../services/db.js'

const router = Router()

// GET /api/account
router.get('/', async (req, res) => {
  const db = getDb()
  const u = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  res.json({
    id: u.id, name: u.name, email: u.email, plan: u.plan, status: u.status,
    timezone: u.timezone, language: u.language, two_factor: !!u.two_factor, created_at: u.created_at,
  })
})

// PATCH /api/account  { name, timezone, language }
router.patch('/', async (req, res) => {
  const db = getDb()
  const { name, timezone, language } = req.body || {}
  const sets = []
  const vals = []
  if (name)     { sets.push('name = ?');     vals.push(name) }
  if (timezone) { sets.push('timezone = ?'); vals.push(timezone) }
  if (language) { sets.push('language = ?'); vals.push(language) }
  if (sets.length) {
    vals.push(req.user.id)
    await db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  }
  const u = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  res.json({
    id: u.id, name: u.name, email: u.email, plan: u.plan, status: u.status,
    timezone: u.timezone, language: u.language, two_factor: !!u.two_factor, created_at: u.created_at,
  })
})

// POST /api/account/password  { current, next }
router.post('/password', async (req, res) => {
  const db = getDb()
  const { current, next } = req.body || {}
  if (!current || !next || next.length < 8) return res.status(400).json({ error: 'Invalid password' })
  const u = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!bcrypt.compareSync(current, u.password_hash)) return res.status(401).json({ error: 'Current password is incorrect' })
  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(next, 10), req.user.id)
  await db.prepare('INSERT INTO activity_log (id, user_id, action, detail, kind) VALUES (?,?,?,?,?)')
    .run(randomUUID(), req.user.id, 'Password changed', null, 'accent')
  res.json({ ok: true })
})

// POST /api/account/2fa  { enabled }
router.post('/2fa', async (req, res) => {
  const db = getDb()
  const { enabled } = req.body || {}
  await db.prepare('UPDATE users SET two_factor = ? WHERE id = ?').run(enabled ? 1 : 0, req.user.id)
  res.json({ ok: true })
})

// GET /api/account/sessions
router.get('/sessions', async (req, res) => {
  const db = getDb()
  const rows = await db.prepare(
    "SELECT * FROM sessions WHERE user_id = ? AND expires_at > datetime('now') ORDER BY last_seen DESC"
  ).all(req.user.id)
  res.json(rows.map(s => ({ ...s, current: s.id === req.user.sid })))
})

// DELETE /api/account/sessions/:id
router.delete('/sessions/:id', async (req, res) => {
  const db = getDb()
  if (req.params.id === req.user.sid) return res.status(400).json({ error: 'Cannot revoke current session' })
  await db.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ ok: true })
})

// GET /api/account/activity
router.get('/activity', async (req, res) => {
  const db = getDb()
  const rows = await db.prepare('SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 30').all(req.user.id)
  res.json(rows)
})

// GET /api/account/tokens
router.get('/tokens', async (req, res) => {
  const db = getDb()
  const rows = await db.prepare('SELECT id, name, prefix, scope, last_used, created_at FROM api_tokens WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id)
  res.json(rows)
})

// POST /api/account/tokens  { name, scope }
router.post('/tokens', async (req, res) => {
  const db = getDb()
  const { name, scope } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name required' })
  const id = randomUUID()
  const secret = crypto.randomBytes(24).toString('hex')
  const prefix = 'sk_' + secret.slice(0, 8)
  const token = `${prefix}_${secret.slice(8)}`
  const tokenHash = bcrypt.hashSync(token, 8)
  await db.prepare(
    `INSERT INTO api_tokens (id, user_id, name, prefix, token_hash, scope) VALUES (?,?,?,?,?,?)`
  ).run(id, req.user.id, name, prefix, tokenHash, scope === 'read' ? 'read' : 'full')
  res.json({ id, name, token, prefix, scope: scope === 'read' ? 'read' : 'full' })
})

// DELETE /api/account/tokens/:id
router.delete('/tokens/:id', async (req, res) => {
  const db = getDb()
  await db.prepare('DELETE FROM api_tokens WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ ok: true })
})

// GET /api/account/ssh-keys
router.get('/ssh-keys', async (req, res) => {
  const db = getDb()
  const rows = await db.prepare('SELECT * FROM ssh_keys WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id)
  res.json(rows)
})

// POST /api/account/ssh-keys  { name, public_key }
router.post('/ssh-keys', async (req, res) => {
  const db = getDb()
  const { name, public_key } = req.body || {}
  if (!name || !public_key) return res.status(400).json({ error: 'name and public_key required' })
  const parts = public_key.trim().split(/\s+/)
  const keyType = parts[0] || 'ssh-ed25519'
  const fingerprint = 'SHA256:' + crypto.createHash('sha256').update(public_key.trim()).digest('base64').slice(0, 32)
  const id = randomUUID()
  await db.prepare(
    `INSERT INTO ssh_keys (id, user_id, name, public_key, key_type, fingerprint) VALUES (?,?,?,?,?,?)`
  ).run(id, req.user.id, name, public_key.trim(), keyType, fingerprint)
  const row = await db.prepare('SELECT * FROM ssh_keys WHERE id = ?').get(id)
  res.json(row)
})

// DELETE /api/account/ssh-keys/:id
router.delete('/ssh-keys/:id', async (req, res) => {
  const db = getDb()
  await db.prepare('DELETE FROM ssh_keys WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ ok: true })
})

export default router
