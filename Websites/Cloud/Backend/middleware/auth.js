import { verifyToken } from '../services/auth.js'

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const user = await verifyToken(header.slice(7))
  if (!user) return res.status(401).json({ error: 'Invalid or expired token' })

  req.user = user
  next()
}
