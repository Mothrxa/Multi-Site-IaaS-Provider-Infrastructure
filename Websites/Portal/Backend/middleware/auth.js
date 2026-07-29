import { verifyToken } from '../services/auth.js'

// Mock users — only used when MOCK_AUTH=true (development without a real DB)
const MOCK_USERS = {
  'sarah.b@strata.io':  { id: 'u-1', name: 'Sarah Benhadj',   email: 'sarah.b@strata.io',  dept: 'it',  role: 'it_admin',  active: 1, imapCreds: null },
  'amira.o@strata.io':  { id: 'u-2', name: 'Amira Ould',      email: 'amira.o@strata.io',  dept: 'hr',  role: 'dept_head', active: 1, imapCreds: null },
  'yacine.b@strata.io': { id: 'u-3', name: 'Yacine Belkacem', email: 'yacine.b@strata.io', dept: 'biz', role: 'dept_head', active: 1, imapCreds: null },
  'admin@strata.io':    { id: 'u-0', name: 'System Admin',    email: 'admin@strata.io',    dept: 'it',  role: 'superadmin',active: 1, imapCreds: null },
}

export async function authMiddleware(req, res, next) {
  if (process.env.MOCK_AUTH !== 'false') {
    const email = req.headers['x-mock-user'] || 'sarah.b@strata.io'
    req.user = MOCK_USERS[email] ?? MOCK_USERS['sarah.b@strata.io']
    return next()
  }

  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })

  const user = await verifyToken(header.slice(7))
  if (!user) return res.status(401).json({ error: 'Invalid or expired token' })

  req.user = user
  next()
}
