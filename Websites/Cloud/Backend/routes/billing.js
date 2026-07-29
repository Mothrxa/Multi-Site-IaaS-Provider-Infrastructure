import { Router } from 'express'
import { randomUUID } from 'crypto'
import { getDb } from '../services/db.js'

const router = Router()

function detectBrand(number) {
  const n = number.replace(/\D/g, '')
  if (n.startsWith('4')) return 'Visa'
  if (/^5[1-5]/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'Amex'
  return 'Card'
}

async function buildBilling(db, user) {
  const resources = await db.prepare("SELECT * FROM resources WHERE user_id = ? AND status != 'failed'").all(user.id)
  const now = new Date()
  const daysIntoMonth = now.getDate()

  const lineItems = resources.map(r => {
    const hours = Math.round(daysIntoMonth * 24 * 0.9)
    return {
      id: r.id,
      name: r.name,
      kind: r.kind,
      plan_id: r.plan_id,
      hourly_rate: r.hourly_rate,
      hours,
      amount: Math.round(r.hourly_rate * hours * (r.replicas || 1) * 100) / 100,
    }
  })
  const mtd = Math.round(lineItems.reduce((s, l) => s + l.amount, 0) * 100) / 100
  const hourly = resources.reduce((s, r) => s + r.hourly_rate * (r.status === 'running' ? (r.replicas || 1) : 0), 0)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const projected = Math.round((mtd / daysIntoMonth) * daysInMonth * 100) / 100

  const paymentMethods = await db.prepare('SELECT * FROM payment_methods WHERE user_id = ? ORDER BY created_at ASC').all(user.id)
  const invoices = await db.prepare('SELECT * FROM invoices WHERE user_id = ? ORDER BY issued DESC').all(user.id)

  return {
    credit: user.credit,
    billingModel: user.billing_model,
    spendCap: user.spend_cap,
    alertThreshold: user.alert_threshold,
    paymentMethods: paymentMethods.map(m => ({ ...m, is_default: !!m.is_default })),
    current: {
      period: now.toISOString().slice(0, 7),
      mtd,
      projected,
      hourly: Math.round(hourly * 10000) / 10000,
      lineItems,
    },
    invoices,
  }
}

// GET /api/billing
router.get('/', async (req, res) => {
  const db = getDb()
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  res.json(await buildBilling(db, user))
})

// PATCH /api/billing/model  { model }
router.patch('/model', async (req, res) => {
  const db = getDb()
  const { model } = req.body || {}
  if (!['payg', 'prepaid', 'monthly'].includes(model)) return res.status(400).json({ error: 'Invalid billing model' })
  await db.prepare('UPDATE users SET billing_model = ? WHERE id = ?').run(model, req.user.id)
  res.json({ ok: true })
})

// PATCH /api/billing/limits  { spendCap, alertThreshold }
router.patch('/limits', async (req, res) => {
  const db = getDb()
  const { spendCap, alertThreshold } = req.body || {}
  await db.prepare('UPDATE users SET spend_cap = ?, alert_threshold = ? WHERE id = ?')
    .run(Number(spendCap) || 0, Number(alertThreshold) || 0, req.user.id)
  res.json({ ok: true })
})

// POST /api/billing/methods  { number, exp_month, exp_year, holder }
router.post('/methods', async (req, res) => {
  const db = getDb()
  const { number, exp_month, exp_year, holder } = req.body || {}
  if (!number || number.replace(/\D/g, '').length < 13) return res.status(400).json({ error: 'Invalid card number' })
  const id = randomUUID()
  const last4 = number.replace(/\D/g, '').slice(-4)
  const brand = detectBrand(number)
  const existing = await db.prepare('SELECT COUNT(*)::int AS n FROM payment_methods WHERE user_id = ?').get(req.user.id)
  const isDefault = existing.n === 0
  await db.prepare(
    `INSERT INTO payment_methods (id, user_id, brand, last4, exp_month, exp_year, holder, is_default)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(id, req.user.id, brand, last4, exp_month || null, exp_year || null, holder || null, isDefault ? 1 : 0)
  const method = await db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(id)
  res.json({ ...method, is_default: !!method.is_default })
})

// PATCH /api/billing/methods/:id/default
router.patch('/methods/:id/default', async (req, res) => {
  const db = getDb()
  const method = await db.prepare('SELECT * FROM payment_methods WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (!method) return res.status(404).json({ error: 'Not found' })
  await db.prepare('UPDATE payment_methods SET is_default = 0 WHERE user_id = ?').run(req.user.id)
  await db.prepare('UPDATE payment_methods SET is_default = 1 WHERE id = ?').run(method.id)
  res.json({ ok: true })
})

// DELETE /api/billing/methods/:id
router.delete('/methods/:id', async (req, res) => {
  const db = getDb()
  const method = await db.prepare('SELECT * FROM payment_methods WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (!method) return res.status(404).json({ error: 'Not found' })
  await db.prepare('DELETE FROM payment_methods WHERE id = ?').run(method.id)
  if (method.is_default) {
    const next = await db.prepare('SELECT id FROM payment_methods WHERE user_id = ? ORDER BY created_at ASC LIMIT 1').get(req.user.id)
    if (next) await db.prepare('UPDATE payment_methods SET is_default = 1 WHERE id = ?').run(next.id)
  }
  res.json({ ok: true })
})

export default router
