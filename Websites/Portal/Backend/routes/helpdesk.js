import { Router } from 'express'
import { randomUUID } from 'crypto'
import { getDb } from '../services/db.js'

const router = Router()

const IS_ADMIN = (u) => ['superadmin', 'it_admin'].includes(u.role)

async function nextTicketNumber(db) {
  const row = await db.prepare('SELECT MAX(number) AS n FROM tickets').get()
  return (row.n ?? 0) + 1
}

async function withReplies(db, ticket) {
  const replies = await db.prepare(`
    SELECT r.*, u.name AS author_name FROM ticket_replies r
    JOIN users u ON u.id = r.author_id
    WHERE r.ticket_id = ? ORDER BY r.created_at ASC
  `).all(ticket.id)
  return { ...ticket, replies }
}

// GET /api/helpdesk/tickets  — admins see all, employees see own
router.get('/tickets', async (req, res) => {
  const db = getDb()
  const rows = IS_ADMIN(req.user)
    ? await db.prepare(`
        SELECT t.*, u.name AS submitter_name, a.name AS assignee_name
        FROM tickets t
        JOIN users u ON u.id = t.submitter_id
        LEFT JOIN users a ON a.id = t.assignee_id
        ORDER BY t.created_at DESC
      `).all()
    : await db.prepare(`
        SELECT t.*, u.name AS submitter_name, a.name AS assignee_name
        FROM tickets t
        JOIN users u ON u.id = t.submitter_id
        LEFT JOIN users a ON a.id = t.assignee_id
        WHERE t.submitter_id = ?
        ORDER BY t.created_at DESC
      `).all(req.user.id)
  res.json(rows)
})

// GET /api/helpdesk/tickets/:id
router.get('/tickets/:id', async (req, res) => {
  const db = getDb()
  const ticket = await db.prepare(`
    SELECT t.*, u.name AS submitter_name, a.name AS assignee_name
    FROM tickets t
    JOIN users u ON u.id = t.submitter_id
    LEFT JOIN users a ON a.id = t.assignee_id
    WHERE t.id = ?
  `).get(req.params.id)
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
  if (!IS_ADMIN(req.user) && ticket.submitter_id !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' })
  res.json(await withReplies(db, ticket))
})

// POST /api/helpdesk/tickets  { title, description, priority? }
router.post('/tickets', async (req, res) => {
  const { title, description = '', priority = 'P3' } = req.body
  if (!title) return res.status(400).json({ error: 'title required' })
  const db  = getDb()
  const id  = randomUUID()
  const num = await nextTicketNumber(db)
  await db.prepare(
    'INSERT INTO tickets (id, number, submitter_id, title, description, priority) VALUES (?,?,?,?,?,?)'
  ).run(id, num, req.user.id, title, description, priority)
  res.status(201).json(await db.prepare('SELECT * FROM tickets WHERE id = ?').get(id))
})

// PATCH /api/helpdesk/tickets/:id  — admins: status/assignee; submitter: cancel own
router.patch('/tickets/:id', async (req, res) => {
  const db     = getDb()
  const ticket = await db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id)
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' })

  const sets = [], vals = []

  if (IS_ADMIN(req.user)) {
    const { status, assignee_id, priority } = req.body
    if (status      !== undefined) { sets.push('status = ?');      vals.push(status) }
    if (assignee_id !== undefined) { sets.push('assignee_id = ?'); vals.push(assignee_id) }
    if (priority    !== undefined) { sets.push('priority = ?');    vals.push(priority) }
  } else if (ticket.submitter_id === req.user.id) {
    // Submitter can only cancel if still open
    if (req.body.status === 'closed' && ticket.status === 'open') {
      sets.push('status = ?'); vals.push('closed')
    } else {
      return res.status(403).json({ error: 'You can only close your own open tickets' })
    }
  } else {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' })
  sets.push("updated_at = datetime('now')")
  vals.push(req.params.id)
  await db.prepare(`UPDATE tickets SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  res.json(await db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id))
})

// POST /api/helpdesk/tickets/:id/replies  { body }
router.post('/tickets/:id/replies', async (req, res) => {
  const { body } = req.body
  if (!body) return res.status(400).json({ error: 'body required' })
  const db     = getDb()
  const ticket = await db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id)
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
  if (!IS_ADMIN(req.user) && ticket.submitter_id !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' })
  const id = randomUUID()
  await db.prepare('INSERT INTO ticket_replies (id, ticket_id, author_id, body) VALUES (?,?,?,?)')
    .run(id, req.params.id, req.user.id, body)
  await db.prepare("UPDATE tickets SET updated_at = datetime('now') WHERE id = ?").run(req.params.id)
  res.status(201).json(await db.prepare('SELECT * FROM ticket_replies WHERE id = ?').get(id))
})

export default router
