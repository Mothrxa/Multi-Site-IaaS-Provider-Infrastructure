import { Router } from 'express'
import { login, logout, publicUser, verifyToken } from '../services/auth.js'
import jwt from 'jsonwebtoken'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'strata_dev_secret_change_in_prod'

// POST /api/auth/login  { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  const result = await login(email, password)
  if (!result) return res.status(401).json({ error: 'Invalid credentials' })
  res.json(result)
})

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (token) {
    try { const { sid } = jwt.verify(token, JWT_SECRET); if (sid) await logout(sid) } catch {}
  }
  res.json({ ok: true })
})

// GET /api/auth/me  — verify token, return user (no global middleware on this path)
router.get('/me', async (req, res) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const user = await verifyToken(header.slice(7))
  if (!user) return res.status(401).json({ error: 'Invalid or expired token' })
  res.json(publicUser(user))
})

export default router
