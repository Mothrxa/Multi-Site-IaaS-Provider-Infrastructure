import { Router } from 'express'
import { getDb } from '../services/db.js'

const router = Router()

function series(n, base, variance) {
  const out = []
  let v = base
  for (let i = 0; i < n; i++) {
    v += (Math.random() - 0.5) * variance
    v = Math.max(0, v)
    out.push(Math.round(v * 10) / 10)
  }
  return out
}

// GET /api/dashboard
router.get('/', async (req, res) => {
  const db = getDb()
  const resources = await db.prepare('SELECT * FROM resources WHERE user_id = ?').all(req.user.id)
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)

  const vms = resources.filter(r => r.kind === 'vm')
  const containers = resources.filter(r => r.kind === 'container')
  const running = resources.filter(r => r.status === 'running').length

  const hourly = resources.reduce((sum, r) => sum + (r.hourly_rate * (r.replicas || 1)) * (r.status === 'running' ? 1 : 0), 0)
  const counts = { total: resources.length, vms: vms.length, containers: containers.length, running }
  const spend = {
    credit: user.credit,
    monthly: Math.round(hourly * 24 * 30 * 100) / 100,
    hourly: Math.round(hourly * 10000) / 10000,
    today: Math.round(hourly * 24 * 100) / 100,
  }
  const capacity = {
    vcpu: resources.reduce((s, r) => s + r.vcpu * (r.replicas || 1), 0),
    ram_gb: resources.reduce((s, r) => s + r.ram_gb * (r.replicas || 1), 0),
    storage_gb: resources.reduce((s, r) => s + r.storage_gb * (r.replicas || 1), 0),
  }
  const regions = [...new Set(resources.map(r => r.region))]

  const recent = await db.prepare(
    'SELECT id, kind, name, status, region, created_at FROM resources WHERE user_id = ? ORDER BY created_at DESC LIMIT 6'
  ).all(req.user.id)

  res.json({
    counts,
    spend,
    capacity,
    regions,
    cpuSeries: series(48, 40, 8),
    netSeries: series(48, 220, 60),
    recent,
  })
})

export default router
