import { Router } from 'express'
import { listAuditLogs, getAuditLog, resolveAuditLog, archiveLog, logAudit, archiveLogs } from '../services/audit.js'
import { reprovisionUser } from '../services/dovecot.js'

const router = Router()

const ADMIN_ROLES = ['superadmin', 'it_admin']

function requireAdmin(req, res, next) {
  if (!ADMIN_ROLES.includes(req.user?.role)) return res.status(403).json({ error: 'Forbidden' })
  next()
}

router.use(requireAdmin)

// GET /api/audit?archived=1
router.get('/', (req, res) => {
  res.json(listAuditLogs({ showArchived: req.query.archived === '1' }))
})

// POST /api/audit/archive  — archive all current (non-archived) logs
router.post('/archive', (req, res) => {
  const count = archiveLogs()
  logAudit({ action: 'logs_archived', actorId: req.user.id, status: 'ok', message: `${count} entries archived` })
  res.json({ ok: true, archived: count })
})

// POST /api/audit/:id/archive  — archive a single log entry
router.post('/:id/archive', (req, res) => {
  const entry = getAuditLog(req.params.id)
  if (!entry) return res.status(404).json({ error: 'Log entry not found' })
  archiveLog(entry.id)
  res.json({ ok: true })
})

// POST /api/audit/:id/redo  — retry a failed dovecot_provision using the stored hash
router.post('/:id/redo', (req, res) => {
  const entry = getAuditLog(req.params.id)
  if (!entry) return res.status(404).json({ error: 'Log entry not found' })
  if (entry.action !== 'dovecot_provision') return res.status(400).json({ error: 'Only dovecot_provision entries can be retried' })
  if (entry.status === 'resolved') return res.status(400).json({ error: 'Already resolved' })
  if (!entry.payload?.hash || !entry.payload?.email) return res.status(400).json({ error: 'No stored hash to retry with' })

  const result = reprovisionUser(entry.payload.email, entry.payload.hash)

  if (result.ok) {
    resolveAuditLog(entry.id)
    logAudit({
      action:  'dovecot_provision_redo',
      actorId: req.user.id,
      target:  entry.payload.email,
      status:  'ok',
      message: 'Redo succeeded',
    })
    return res.json({ ok: true })
  }

  // Still failing — log the new attempt
  logAudit({
    action:  'dovecot_provision_redo',
    actorId: req.user.id,
    target:  entry.payload.email,
    status:  'error',
    message: result.error,
    payload: entry.payload,
  })
  res.status(500).json({ ok: false, error: result.error })
})

export default router
