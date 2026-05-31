import { Router } from 'express'
import { listUsers, createUser, updateUser } from '../services/auth.js'
import { provisionUser } from '../services/dovecot.js'
import { logAudit } from '../services/audit.js'

const router = Router()

const ADMIN_ROLES = ['superadmin', 'it_admin']

function requireAdmin(req, res, next) {
  if (!ADMIN_ROLES.includes(req.user?.role)) return res.status(403).json({ error: 'Forbidden' })
  next()
}

router.use(requireAdmin)

// GET /api/users
router.get('/', (_req, res) => {
  res.json(listUsers())
})

// POST /api/users  { name, email, password, department, role }
router.post('/', (req, res) => {
  const { name, email, password, department, role } = req.body
  if (!name || !email || !password || !department || !role)
    return res.status(400).json({ error: 'name, email, password, department and role are required' })

  let user
  try {
    user = createUser({ name, email, password, department, role })
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' })
    return res.status(500).json({ error: err.message })
  }

  // Provision IMAP account in Dovecot
  const dovecot = provisionUser(email, password)
  logAudit({
    action:  'dovecot_provision',
    actorId: req.user.id,
    target:  email,
    status:  dovecot.ok ? 'ok' : 'error',
    message: dovecot.ok ? null : dovecot.error,
    payload: dovecot.ok ? null : { email, hash: dovecot.hash },
  })

  res.status(201).json({ ...user, dovecot: dovecot.ok ? 'ok' : 'error' })
})

// PATCH /api/users/:id  { name?, department?, role?, active?, password? }
router.patch('/:id', (req, res) => {
  const user = updateUser(req.params.id, req.body)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

export default router
