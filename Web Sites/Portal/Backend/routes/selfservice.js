import { Router } from 'express'
import { randomUUID } from 'crypto'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { getDb } from '../services/db.js'

const FILES_BASE = process.env.EMPLOYEE_FILES_DIR || '/var/files'

// Derive folder name from email local part: "sarah.b@strata.io" → "sarah.b"
function userFolder(email) {
  return join(FILES_BASE, email.split('@')[0])
}

const router = Router()

const IS_HR = (u) => u.dept === 'hr' || ['superadmin', 'it_admin'].includes(u.role)

// ── Leave requests ────────────────────────────────────────────────────────────

// GET /api/self-service/leave  — own requests (or all if HR)
router.get('/leave', (req, res) => {
  const db = getDb()
  const rows = IS_HR(req.user)
    ? db.prepare(`
        SELECT l.*, u.name AS employee_name, u.department AS employee_dept,
               r.name AS reviewer_name
        FROM leave_requests l
        JOIN users u ON u.id = l.employee_id
        LEFT JOIN users r ON r.id = l.reviewed_by
        ORDER BY l.created_at DESC
      `).all()
    : db.prepare(`
        SELECT l.*, u.name AS employee_name, r.name AS reviewer_name
        FROM leave_requests l
        JOIN users u ON u.id = l.employee_id
        LEFT JOIN users r ON r.id = l.reviewed_by
        WHERE l.employee_id = ?
        ORDER BY l.created_at DESC
      `).all(req.user.id)
  res.json(rows)
})

// POST /api/self-service/leave  { type, start_date, end_date, reason? }
router.post('/leave', (req, res) => {
  const { type, start_date, end_date, reason = '' } = req.body
  if (!type || !start_date || !end_date)
    return res.status(400).json({ error: 'type, start_date and end_date required' })
  const db = getDb()
  const id = randomUUID()
  db.prepare(
    'INSERT INTO leave_requests (id, employee_id, type, start_date, end_date, reason) VALUES (?,?,?,?,?,?)'
  ).run(id, req.user.id, type, start_date, end_date, reason)
  res.status(201).json(db.prepare(`
    SELECT l.*, u.name AS employee_name, u.department AS employee_dept
    FROM leave_requests l JOIN users u ON u.id = l.employee_id WHERE l.id = ?
  `).get(id))
})

// PATCH /api/self-service/leave/:id  — HR approves/rejects; employee cancels own pending
router.patch('/leave/:id', (req, res) => {
  const db  = getDb()
  const req_row = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(req.params.id)
  if (!req_row) return res.status(404).json({ error: 'Request not found' })

  const sets = [], vals = []

  if (IS_HR(req.user)) {
    const { status } = req.body
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ error: 'status must be approved or rejected' })
    sets.push('status = ?', 'reviewed_by = ?', "reviewed_at = datetime('now')")
    vals.push(status, req.user.id)
  } else if (req_row.employee_id === req.user.id) {
    if (req_row.status !== 'pending')
      return res.status(400).json({ error: 'Only pending requests can be cancelled' })
    sets.push('status = ?')
    vals.push('cancelled')
  } else {
    return res.status(403).json({ error: 'Forbidden' })
  }

  vals.push(req.params.id)
  db.prepare(`UPDATE leave_requests SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  res.json(db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(req.params.id))
})

// ── Payroll slips ─────────────────────────────────────────────────────────────

// GET /api/self-service/payslips  — own (or all if HR)
router.get('/payslips', (req, res) => {
  const db = getDb()
  const rows = IS_HR(req.user)
    ? db.prepare(`
        SELECT p.*, u.name AS employee_name FROM payroll_slips p
        JOIN users u ON u.id = p.employee_id ORDER BY p.created_at DESC
      `).all()
    : db.prepare(`
        SELECT p.*, u.name AS employee_name FROM payroll_slips p
        JOIN users u ON u.id = p.employee_id
        WHERE p.employee_id = ? ORDER BY p.created_at DESC
      `).all(req.user.id)
  res.json(rows)
})

// POST /api/self-service/payslips  — HR/admin only  { employee_id, period, gross, net }
router.post('/payslips', (req, res) => {
  if (!IS_HR(req.user)) return res.status(403).json({ error: 'Forbidden' })
  const { employee_id, period, gross, net } = req.body
  if (!employee_id || !period || gross == null || net == null)
    return res.status(400).json({ error: 'employee_id, period, gross and net required' })
  const db = getDb()
  const id = randomUUID()
  db.prepare(
    'INSERT INTO payroll_slips (id, employee_id, period, gross, net, status) VALUES (?,?,?,?,?,?)'
  ).run(id, employee_id, period, gross, net, 'ready')
  res.status(201).json(db.prepare('SELECT * FROM payroll_slips WHERE id = ?').get(id))
})

// ── File downloads ────────────────────────────────────────────────────────────

// GET /api/self-service/file/certificate
// File: /var/files/$USER/Work_Certificate.pdf
router.get('/file/certificate', (req, res) => {
  const path = join(userFolder(req.user.email), 'Work_Certificate.pdf')
  if (!existsSync(path)) return res.status(404).json({ error: 'Work certificate not found in your folder' })
  res.download(path, 'Work_Certificate.pdf')
})

// GET /api/self-service/file/payslip?period=April+2026
// Files: /var/files/$USER/payslip/
router.get('/file/payslip', (req, res) => {
  const payslipDir = join(userFolder(req.user.email), 'payslip')
  if (!existsSync(payslipDir)) return res.status(404).json({ error: 'Payslip folder not found — contact HR' })

  const { period } = req.query
  if (period) {
    const candidates = [`${period}.pdf`, `${period.replace(/\s+/g, '_')}.pdf`]
    const match = candidates.map(n => join(payslipDir, n)).find(existsSync)
    if (!match) return res.status(404).json({ error: `Payslip for "${period}" not found` })
    return res.download(match)
  }

  // No period — serve the most recent PDF in the payslip/ folder
  const pdfs = readdirSync(payslipDir).filter(f => f.endsWith('.pdf')).sort().reverse()
  if (!pdfs.length) return res.status(404).json({ error: 'No payslip found — contact HR' })
  res.download(join(payslipDir, pdfs[0]), pdfs[0])
})

// ── Employee profile ──────────────────────────────────────────────────────────

// GET /api/self-service/profile
router.get('/profile', (req, res) => {
  const db  = getDb()
  const row = db.prepare('SELECT * FROM employee_profiles WHERE user_id = ?').get(req.user.id)
  const user = db.prepare('SELECT id, name, email, department FROM users WHERE id = ?').get(req.user.id)
  res.json({ ...user, profile: row || {} })
})

// PUT /api/self-service/profile
router.put('/profile', (req, res) => {
  const { phone, address, emergency_name, emergency_phone, iban, personal_email } = req.body
  const db  = getDb()
  const exists = db.prepare('SELECT id FROM employee_profiles WHERE user_id = ?').get(req.user.id)
  if (exists) {
    db.prepare(`UPDATE employee_profiles SET
      phone = ?, address = ?, emergency_name = ?, emergency_phone = ?,
      iban = ?, personal_email = ?, updated_at = datetime('now')
      WHERE user_id = ?`
    ).run(phone, address, emergency_name, emergency_phone, iban, personal_email, req.user.id)
  } else {
    db.prepare(`INSERT INTO employee_profiles
      (id, user_id, phone, address, emergency_name, emergency_phone, iban, personal_email)
      VALUES (?,?,?,?,?,?,?,?)`
    ).run(randomUUID(), req.user.id, phone, address, emergency_name, emergency_phone, iban, personal_email)
  }
  res.json(db.prepare('SELECT * FROM employee_profiles WHERE user_id = ?').get(req.user.id))
})

// ── Expense claims ────────────────────────────────────────────────────────────

// GET /api/self-service/expenses
router.get('/expenses', (req, res) => {
  const rows = getDb().prepare(
    'SELECT * FROM expense_claims WHERE employee_id = ? ORDER BY created_at DESC'
  ).all(req.user.id)
  res.json(rows)
})

// POST /api/self-service/expenses  { description, amount, currency?, category }
router.post('/expenses', (req, res) => {
  const { description, amount, currency = 'DZD', category } = req.body
  if (!description || !amount || !category)
    return res.status(400).json({ error: 'description, amount and category required' })
  const db = getDb()
  const id = randomUUID()
  db.prepare(
    'INSERT INTO expense_claims (id, employee_id, description, amount, currency, category) VALUES (?,?,?,?,?,?)'
  ).run(id, req.user.id, description, amount, currency, category)
  res.status(201).json(db.prepare('SELECT * FROM expense_claims WHERE id = ?').get(id))
})

// ── Referrals ─────────────────────────────────────────────────────────────────

// GET /api/self-service/referrals
router.get('/referrals', (req, res) => {
  res.json(getDb().prepare(
    'SELECT * FROM referrals WHERE referrer_id = ? ORDER BY created_at DESC'
  ).all(req.user.id))
})

// POST /api/self-service/referrals  { candidate_name, candidate_email, role_applied, notes? }
router.post('/referrals', (req, res) => {
  const { candidate_name, candidate_email, role_applied, notes = '' } = req.body
  if (!candidate_name || !candidate_email || !role_applied)
    return res.status(400).json({ error: 'candidate_name, candidate_email and role_applied required' })
  const db = getDb()
  const id = randomUUID()
  db.prepare(
    'INSERT INTO referrals (id, referrer_id, candidate_name, candidate_email, role_applied, notes) VALUES (?,?,?,?,?,?)'
  ).run(id, req.user.id, candidate_name, candidate_email, role_applied, notes)
  res.status(201).json(db.prepare('SELECT * FROM referrals WHERE id = ?').get(id))
})

// GET /api/self-service/leave/balance  — calculate real leave balance for current user
router.get('/leave/balance', (req, res) => {
  const db   = getDb()
  const year = String(new Date().getFullYear())

  const approved = db.prepare(`
    SELECT type, start_date, end_date FROM leave_requests
    WHERE employee_id = ? AND status = 'approved'
    AND strftime('%Y', start_date) = ?
  `).all(req.user.id, year)

  function days(start, end) {
    return Math.max(1, Math.round((new Date(end) - new Date(start)) / 86_400_000) + 1)
  }

  const annual_used = approved.filter(r => r.type === 'annual')
    .reduce((s, r) => s + days(r.start_date, r.end_date), 0)
  const sick_used = approved.filter(r => r.type === 'sick')
    .reduce((s, r) => s + days(r.start_date, r.end_date), 0)

  res.json({
    annual: { total: 22, used: annual_used, remaining: Math.max(0, 22 - annual_used) },
    sick:   { total: 10, used: sick_used,   remaining: Math.max(0, 10 - sick_used)   },
  })
})

export default router
