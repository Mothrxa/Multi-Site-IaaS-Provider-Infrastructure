import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { login, signup, logout, publicUser, verifyToken } from '../services/auth.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'strata_cloud_dev_secret_change_in_prod'

// POST /api/auth/signup  { name, email, password }
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  let result
  try {
    result = await signup(name, email, password)
  } catch (e) {
    return res.status(502).json({ error: e.message })
  }
  if (!result) return res.status(409).json({ error: 'An account with that email already exists' })
  res.json(result)
})

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

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const user = await verifyToken(header.slice(7))
  if (!user) return res.status(401).json({ error: 'Invalid or expired token' })
  res.json(publicUser(user))
})

export default router
