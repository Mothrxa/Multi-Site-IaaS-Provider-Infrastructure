import { Router } from 'express'
import { cloudDb } from '../services/cloud-db.js'

const router = Router()

function requireIT(req, res, next) {
  const { role, dept } = req.user
  if (['superadmin', 'it_admin'].includes(role) || dept === 'it') return next()
  res.status(403).json({ error: 'Forbidden' })
}

router.use(requireIT)

// GET /api/it/cloud-stats — aggregate numbers for IT Overview KPIs
router.get('/cloud-stats', async (_req, res) => {
  try {
    const [totalRes, byKind, byStatus, userCount, recentActivity] = await Promise.all([
      cloudDb.prepare('SELECT COUNT(*)::int AS n FROM resources').get(),
      cloudDb.prepare("SELECT kind, COUNT(*)::int AS n FROM resources GROUP BY kind").all(),
      cloudDb.prepare("SELECT status, COUNT(*)::int AS n FROM resources GROUP BY status").all(),
      cloudDb.prepare('SELECT COUNT(*)::int AS n FROM users').get(),
      cloudDb.prepare(`
        SELECT a.id, a.action, a.detail, a.kind, a.created_at, u.name AS user_name
        FROM activity_log a
        JOIN users u ON u.id = a.user_id
        ORDER BY a.created_at DESC LIMIT 20
      `).all(),
    ])

    const kindMap  = Object.fromEntries(byKind.map(r => [r.kind, r.n]))
    const statMap  = Object.fromEntries(byStatus.map(r => [r.status, r.n]))

    res.json({
      total_resources:     totalRes.n,
      total_vms:           kindMap.vm        || 0,
      total_containers:    kindMap.container  || 0,
      running:             statMap.running    || 0,
      stopped:             statMap.stopped    || 0,
      deploying:           statMap.deploying  || 0,
      total_users:         userCount.n,
      recent_activity:     recentActivity,
    })
  } catch (err) {
    console.error('[it/cloud-stats]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/it/workloads — all resources with owner info
router.get('/workloads', async (req, res) => {
  try {
    const { status, kind, limit = 50 } = req.query
    let sql = `
      SELECT r.*, u.name AS owner_name, u.email AS owner_email
      FROM resources r
      JOIN users u ON u.id = r.user_id
      WHERE 1=1
    `
    const params = []
    if (status) { sql += ' AND r.status = ?'; params.push(status) }
    if (kind)   { sql += ' AND r.kind = ?';   params.push(kind) }
    sql += ' ORDER BY r.created_at DESC LIMIT ?'
    params.push(Number(limit))
    const rows = await cloudDb.prepare(sql).all(...params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/it/customers — cloud customers list for IT visibility
router.get('/customers', async (_req, res) => {
  try {
    const rows = await cloudDb.prepare(`
      SELECT
        u.id, u.name, u.email, u.plan, u.status, u.credit, u.created_at,
        COUNT(r.id)::int          AS resource_count,
        COALESCE(SUM(CASE WHEN r.kind='vm'        THEN 1 ELSE 0 END)::int, 0) AS vm_count,
        COALESCE(SUM(CASE WHEN r.kind='container' THEN 1 ELSE 0 END)::int, 0) AS container_count,
        COALESCE(SUM(r.hourly_rate * 720)::numeric(10,2), 0)                  AS monthly_spend
      FROM users u
      LEFT JOIN resources r ON r.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all()
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
