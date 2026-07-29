import { Router } from 'express'
import { randomUUID } from 'crypto'
import { getDb } from '../services/db.js'

const router = Router()

// GET /api/clients/stats
router.get('/stats', async (req, res) => {
  const db = getDb()
  const clients = await db.prepare('SELECT * FROM clients').all()

  const mrr = clients.reduce((s, c) => s + c.monthly_revenue, 0)
  const arr = mrr * 12
  const active  = clients.filter(c => c.status === 'active').length
  const trial   = clients.filter(c => c.status === 'trial').length
  const at_risk = clients.filter(c => c.status === 'at_risk').length
  const churned = clients.filter(c => c.status === 'churned').length

  const byPlanMap = {}
  for (const c of clients) {
    byPlanMap[c.plan] = (byPlanMap[c.plan] || 0) + c.monthly_revenue
  }
  const by_plan = Object.entries(byPlanMap).map(([plan, mrr]) => ({ plan, mrr }))

  const top_clients = clients
    .slice()
    .sort((a, b) => b.monthly_revenue - a.monthly_revenue)
    .slice(0, 5)
    .map(c => ({ name: c.name, mrr: c.monthly_revenue, vm_count: c.vm_count, container_count: c.container_count }))

  res.json({ mrr, arr, active, trial, at_risk, churned, by_plan, top_clients })
})

// GET /api/clients/billing/all?status=a,b,c
router.get('/billing/all', async (req, res) => {
  const db = getDb()
  let rows
  if (req.query.status) {
    const statuses = String(req.query.status).split(',').map(s => s.trim()).filter(Boolean)
    const placeholders = statuses.map(() => '?').join(',')
    rows = await db.prepare(`
      SELECT b.*, c.name AS client_name
      FROM client_billing b
      JOIN clients c ON c.id = b.client_id
      WHERE b.status IN (${placeholders})
      ORDER BY b.period DESC, c.name ASC
    `).all(...statuses)
  } else {
    rows = await db.prepare(`
      SELECT b.*, c.name AS client_name
      FROM client_billing b
      JOIN clients c ON c.id = b.client_id
      ORDER BY b.period DESC, c.name ASC
    `).all()
  }
  res.json(rows)
})

// GET /api/clients/pipeline/deals
router.get('/pipeline/deals', async (req, res) => {
  const db = getDb()
  const rows = await db.prepare(`
    SELECT d.*, c.name AS client_name
    FROM deals d
    LEFT JOIN clients c ON c.id = d.client_id
    ORDER BY d.created_at DESC
  `).all()
  res.json(rows)
})

// GET /api/clients
router.get('/', async (req, res) => {
  const rows = await getDb().prepare('SELECT * FROM clients ORDER BY monthly_revenue DESC').all()
  res.json(rows)
})

// POST /api/clients
router.post('/', async (req, res) => {
  if (!['superadmin', 'it_admin'].includes(req.user.role))
    return res.status(403).json({ error: 'Forbidden' })

  const { name, company, plan = 'starter', region = 'DC-Alger', vm_count = 0, container_count = 0, monthly_revenue = 0, status = 'active', renewal_date = null } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })

  const id = randomUUID()
  await getDb().prepare(`
    INSERT INTO clients (id, name, company, plan, region, vm_count, container_count, monthly_revenue, status, renewal_date)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(id, name, company, plan, region, vm_count, container_count, monthly_revenue, status, renewal_date)

  res.status(201).json(await getDb().prepare('SELECT * FROM clients WHERE id = ?').get(id))
})

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  const client = await getDb().prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id)
  if (!client) return res.status(404).json({ error: 'Not found' })
  res.json(client)
})

// PATCH /api/clients/:id
router.patch('/:id', async (req, res) => {
  if (!['superadmin', 'it_admin'].includes(req.user.role))
    return res.status(403).json({ error: 'Forbidden' })

  const fields = ['name', 'company', 'plan', 'region', 'vm_count', 'container_count', 'monthly_revenue', 'status', 'renewal_date']
  const sets = [], vals = []
  for (const f of fields) {
    if (req.body[f] !== undefined) { sets.push(`${f} = ?`); vals.push(req.body[f]) }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' })
  vals.push(req.params.id)
  await getDb().prepare(`UPDATE clients SET ${sets.join(', ')} WHERE id = ?`).run(...vals)

  const client = await getDb().prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id)
  if (!client) return res.status(404).json({ error: 'Not found' })
  res.json(client)
})

// GET /api/clients/:id/resources
router.get('/:id/resources', async (req, res) => {
  const client = await getDb().prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id)
  if (!client) return res.status(404).json({ error: 'Not found' })

  const vms = Array.from({ length: client.vm_count }, (_, i) => ({
    id: `vm-${client.id.slice(0, 6)}-${i + 1}`,
    name: `${client.name.toLowerCase().replace(/\s+/g, '-')}-vm-${String(i + 1).padStart(2, '0')}`,
    type: 'vm',
  }))
  const containers = Array.from({ length: client.container_count }, (_, i) => ({
    id: `ct-${client.id.slice(0, 6)}-${i + 1}`,
    name: `${client.name.toLowerCase().replace(/\s+/g, '-')}-ct-${String(i + 1).padStart(2, '0')}`,
    type: 'container',
  }))

  res.json({ vms, containers })
})

export default router
