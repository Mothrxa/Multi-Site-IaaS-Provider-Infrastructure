import { Router } from 'express'
import { randomUUID } from 'crypto'
import { getDb } from '../services/db.js'

const router = Router()

// Scope filter: employees only see company + their own dept
function scopesFor(user) {
  if (['superadmin', 'it_admin'].includes(user.role)) return ['company', 'it', 'hr', 'biz']
  return ['company', user.dept]
}

// GET /api/announcements
router.get('/', async (req, res) => {
  const scopes = scopesFor(req.user)
  const placeholders = scopes.map(() => '?').join(',')
  const rows = await getDb().prepare(`
    SELECT a.*, u.name AS author_name, u.department AS author_dept,
      (SELECT COUNT(*) FROM announcement_reactions r WHERE r.announcement_id = a.id) AS reaction_count,
      (SELECT emoji FROM announcement_reactions r WHERE r.announcement_id = a.id AND r.user_id = ?) AS my_reaction
    FROM announcements a
    JOIN users u ON u.id = a.author_id
    WHERE a.scope IN (${placeholders})
    ORDER BY a.pinned DESC, a.created_at DESC
  `).all(req.user.id, ...scopes)
  res.json(rows)
})

// POST /api/announcements  { title, body, scope, pinned? }
router.post('/', async (req, res) => {
  const { title, body, scope = 'company', pinned = 0 } = req.body
  if (!title || !body) return res.status(400).json({ error: 'title and body required' })
  // only admins can post
  if (!['superadmin', 'it_admin'].includes(req.user.role))
    return res.status(403).json({ error: 'Only admins can post announcements' })
  const id = randomUUID()
  await getDb().prepare(
    'INSERT INTO announcements (id, author_id, scope, title, body, pinned) VALUES (?,?,?,?,?,?)'
  ).run(id, req.user.id, scope, title, body, pinned ? 1 : 0)
  res.status(201).json(await getDb().prepare('SELECT * FROM announcements WHERE id = ?').get(id))
})

// PATCH /api/announcements/:id
router.patch('/:id', async (req, res) => {
  if (!['superadmin', 'it_admin'].includes(req.user.role))
    return res.status(403).json({ error: 'Forbidden' })
  const { title, body, scope, pinned } = req.body
  const sets = [], vals = []
  if (title   !== undefined) { sets.push('title = ?');  vals.push(title) }
  if (body    !== undefined) { sets.push('body = ?');   vals.push(body) }
  if (scope   !== undefined) { sets.push('scope = ?');  vals.push(scope) }
  if (pinned  !== undefined) { sets.push('pinned = ?'); vals.push(pinned ? 1 : 0) }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' })
  vals.push(req.params.id)
  await getDb().prepare(`UPDATE announcements SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  res.json(await getDb().prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id))
})

// DELETE /api/announcements/:id
router.delete('/:id', async (req, res) => {
  if (!['superadmin', 'it_admin'].includes(req.user.role))
    return res.status(403).json({ error: 'Forbidden' })
  await getDb().prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// POST /api/announcements/:id/react  { emoji }
router.post('/:id/react', async (req, res) => {
  const { emoji } = req.body
  if (!emoji) return res.status(400).json({ error: 'emoji required' })
  const db = getDb()
  const existing = await db.prepare(
    'SELECT * FROM announcement_reactions WHERE announcement_id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id)

  if (existing) {
    if (existing.emoji === emoji) {
      await db.prepare('DELETE FROM announcement_reactions WHERE id = ?').run(existing.id)
    } else {
      await db.prepare('UPDATE announcement_reactions SET emoji = ? WHERE id = ?').run(emoji, existing.id)
    }
  } else {
    await db.prepare(
      'INSERT INTO announcement_reactions (id, announcement_id, user_id, emoji) VALUES (?,?,?,?)'
    ).run(randomUUID(), req.params.id, req.user.id, emoji)
  }
  const { n } = await db.prepare('SELECT COUNT(*)::int AS n FROM announcement_reactions WHERE announcement_id = ?').get(req.params.id)
  res.json({ ok: true, count: n })
})

export default router
