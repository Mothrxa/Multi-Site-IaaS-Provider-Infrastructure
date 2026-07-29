import { Router } from 'express'
import { randomUUID } from 'crypto'
import { getDb } from '../services/db.js'
import { createUser } from '../services/auth.js'

const router = Router()

// HR employees + admins can access everything here
function requireHR(req, res, next) {
  const { role, dept } = req.user
  if (['superadmin', 'it_admin'].includes(role) || dept === 'hr') return next()
  res.status(403).json({ error: 'Forbidden' })
}

router.use(requireHR)

// GET /api/hr/stats  — overview numbers
router.get('/stats', async (_req, res) => {
  const db = getDb()

  const headcount = (await db.prepare(
    "SELECT COUNT(*)::int AS n FROM users WHERE active = 1 AND archived = 0"
  ).get()).n

  const pending_leave = (await db.prepare(
    "SELECT COUNT(*)::int AS n FROM leave_requests WHERE status = 'pending'"
  ).get()).n

  const by_dept = await db.prepare(
    "SELECT department, COUNT(*)::int AS n FROM users WHERE active = 1 AND archived = 0 GROUP BY department"
  ).all()

  const pending_list = await db.prepare(`
    SELECT l.*, u.name AS employee_name, u.department AS employee_dept
    FROM leave_requests l
    JOIN users u ON u.id = l.employee_id
    WHERE l.status = 'pending'
    ORDER BY l.created_at ASC
    LIMIT 10
  `).all()

  res.json({ headcount, pending_leave, by_dept, pending_list })
})

// GET /api/hr/employees  — full employee list with profiles
router.get('/employees', async (_req, res) => {
  const rows = await getDb().prepare(`
    SELECT
      u.id, u.name, u.email, u.department, u.role, u.active, u.created_at,
      p.phone, p.address, p.personal_email
    FROM users u
    LEFT JOIN employee_profiles p ON p.user_id = u.id
    WHERE u.active = 1 AND u.archived = 0
    ORDER BY u.department, u.name
  `).all()
  res.json(rows)
})

// GET /api/hr/referrals  — all referrals (candidate pipeline)
router.get('/referrals', async (_req, res) => {
  const rows = await getDb().prepare(`
    SELECT r.*, u.name AS referrer_name
    FROM referrals r
    JOIN users u ON u.id = r.referrer_id
    ORDER BY r.created_at DESC
  `).all()
  res.json(rows)
})

// GET /api/hr/payroll  — payslips grouped by period with totals
router.get('/payroll', async (_req, res) => {
  const db = getDb()

  // Latest period summary
  const cycles = await db.prepare(`
    SELECT
      period,
      COUNT(*)::int  AS employee_count,
      SUM(gross)     AS total_gross,
      SUM(net)       AS total_net,
      MAX(status)    AS status,
      MAX(created_at) AS created_at
    FROM payroll_slips
    GROUP BY period
    ORDER BY created_at DESC
  `).all()

  // Full slip list for current period
  const current = cycles[0]?.period
  const slips = current
    ? await db.prepare(`
        SELECT p.*, u.name AS employee_name, u.department
        FROM payroll_slips p
        JOIN users u ON u.id = p.employee_id
        WHERE p.period = ?
        ORDER BY u.department, u.name
      `).all(current)
    : []

  res.json({ cycles, slips, current_period: current })
})

// ── Expense claims ────────────────────────────────────────────────────────────

router.get('/expenses', async (_req, res) => {
  res.json(await getDb().prepare(`
    SELECT e.*, u.name AS employee_name, u.department AS employee_dept
    FROM expense_claims e
    JOIN users u ON u.id = e.employee_id
    ORDER BY e.created_at DESC
  `).all())
})

router.patch('/expenses/:id', async (req, res) => {
  const { status } = req.body
  if (!['approved', 'rejected'].includes(status))
    return res.status(400).json({ error: 'status must be approved or rejected' })
  const db = getDb()
  await db.prepare('UPDATE expense_claims SET status = ? WHERE id = ?').run(status, req.params.id)
  res.json(await db.prepare(`
    SELECT e.*, u.name AS employee_name, u.department AS employee_dept
    FROM expense_claims e JOIN users u ON u.id = e.employee_id WHERE e.id = ?
  `).get(req.params.id))
})

// ── Employee profile (HR view/edit of any employee) ───────────────────────────

router.get('/employees/:id/profile', async (req, res) => {
  const db   = getDb()
  const user = await db.prepare('SELECT id, name, email, department, role FROM users WHERE id = ?').get(req.params.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const profile = await db.prepare('SELECT * FROM employee_profiles WHERE user_id = ?').get(req.params.id)
  res.json({ ...user, profile: profile || {} })
})

router.put('/employees/:id/profile', async (req, res) => {
  const { phone, address, emergency_name, emergency_phone, iban, personal_email } = req.body
  const db     = getDb()
  const exists = await db.prepare('SELECT id FROM employee_profiles WHERE user_id = ?').get(req.params.id)
  if (exists) {
    await db.prepare(`UPDATE employee_profiles SET
      phone=?, address=?, emergency_name=?, emergency_phone=?,
      iban=?, personal_email=?, updated_at=datetime('now') WHERE user_id=?`)
      .run(phone, address, emergency_name, emergency_phone, iban, personal_email, req.params.id)
  } else {
    await db.prepare(`INSERT INTO employee_profiles
      (id, user_id, phone, address, emergency_name, emergency_phone, iban, personal_email)
      VALUES (?,?,?,?,?,?,?,?)`)
      .run(randomUUID(), req.params.id, phone, address, emergency_name, emergency_phone, iban, personal_email)
  }
  res.json(await db.prepare('SELECT * FROM employee_profiles WHERE user_id = ?').get(req.params.id))
})

// ── Create employee (HR-accessible user creation) ────────────────────────────

router.post('/employees', async (req, res) => {
  const { name, email, password, department = 'hr', role = 'employee' } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email and password required' })
  try {
    const user = await createUser({ name, email, password, department, role })
    res.status(201).json(user)
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' })
    res.status(500).json({ error: err.message })
  }
})

// ── Open roles ────────────────────────────────────────────────────────────────

router.get('/open-roles', async (_req, res) => {
  res.json(await getDb().prepare('SELECT * FROM open_roles ORDER BY created_at DESC').all())
})

router.post('/open-roles', async (req, res) => {
  const { title, team, type = 'Full-time' } = req.body
  if (!title || !team) return res.status(400).json({ error: 'title and team required' })
  const db = getDb()
  const id = randomUUID()
  await db.prepare('INSERT INTO open_roles (id, title, team, type) VALUES (?,?,?,?)').run(id, title, team, type)
  res.status(201).json(await db.prepare('SELECT * FROM open_roles WHERE id = ?').get(id))
})

router.patch('/open-roles/:id', async (req, res) => {
  const { status, title, team, type } = req.body
  const db = getDb(), sets = [], vals = []
  if (title  !== undefined) { sets.push('title = ?');  vals.push(title)  }
  if (team   !== undefined) { sets.push('team = ?');   vals.push(team)   }
  if (type   !== undefined) { sets.push('type = ?');   vals.push(type)   }
  if (status !== undefined) { sets.push('status = ?'); vals.push(status) }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' })
  vals.push(req.params.id)
  await db.prepare(`UPDATE open_roles SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  res.json(await db.prepare('SELECT * FROM open_roles WHERE id = ?').get(req.params.id))
})

// ── Referral status ───────────────────────────────────────────────────────────

router.patch('/referrals/:id', async (req, res) => {
  const { status } = req.body
  if (!['submitted', 'reviewing', 'hired', 'rejected'].includes(status))
    return res.status(400).json({ error: 'Invalid status' })
  const db = getDb()
  await db.prepare('UPDATE referrals SET status = ? WHERE id = ?').run(status, req.params.id)
  res.json(await db.prepare('SELECT * FROM referrals WHERE id = ?').get(req.params.id))
})

// ── Payroll export (CSV) ──────────────────────────────────────────────────────

router.get('/payroll/export', async (req, res) => {
  const db      = getDb()
  const period  = req.query.period
  const where   = period ? 'WHERE p.period = ?' : ''
  const slips   = await db.prepare(`
    SELECT p.period, u.name, u.department, p.gross, p.net, p.status
    FROM payroll_slips p JOIN users u ON u.id = p.employee_id
    ${where} ORDER BY p.period DESC, u.department, u.name
  `).all(...(period ? [period] : []))

  const rows = [
    'Period,Employee,Department,Gross,Net,Status',
    ...slips.map(s => `${s.period},"${s.name}",${s.department},${s.gross},${s.net},${s.status}`),
  ].join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="payroll${period ? '-' + period.replace(/\s/g, '_') : ''}.csv"`)
  res.send(rows)
})

// ── Run payroll (bulk-create draft slips) ────────────────────────────────────

router.post('/payroll/run', async (req, res) => {
  const { period } = req.body
  if (!period) return res.status(400).json({ error: 'period required' })
  const db = getDb()

  const exists = (await db.prepare('SELECT COUNT(*)::int AS n FROM payroll_slips WHERE period = ?').get(period)).n
  if (exists) return res.status(409).json({ error: `Payroll for "${period}" already exists` })

  const employees = await db.prepare("SELECT id FROM users WHERE active = 1 AND archived = 0").all()
  const ins = db.prepare('INSERT INTO payroll_slips (id, employee_id, period, gross, net, status) VALUES (?,?,?,?,?,?)')
  const tx  = db.transaction(async () => {
    for (const e of employees) await ins.run(randomUUID(), e.id, period, 0, 0, 'draft')
  })
  await tx()

  res.status(201).json({ period, created: employees.length })
})

// ── Update individual payslip ─────────────────────────────────────────────────

router.patch('/payroll/slips/:id', async (req, res) => {
  const { gross, net, status } = req.body
  const db = getDb(), sets = [], vals = []
  if (gross  != null) { sets.push('gross = ?');  vals.push(gross)  }
  if (net    != null) { sets.push('net = ?');    vals.push(net)    }
  if (status != null) { sets.push('status = ?'); vals.push(status) }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' })
  vals.push(req.params.id)
  await db.prepare(`UPDATE payroll_slips SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  res.json(await db.prepare('SELECT * FROM payroll_slips WHERE id = ?').get(req.params.id))
})

export default router
