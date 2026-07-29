import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import mailRoutes from './routes/mail.js'
import userRoutes          from './routes/users.js'
import auditRoutes         from './routes/audit.js'
import announcementRoutes  from './routes/announcements.js'
import helpdeskRoutes      from './routes/helpdesk.js'
import selfServiceRoutes   from './routes/selfservice.js'
import documentRoutes      from './routes/documents.js'
import hrRoutes            from './routes/hr.js'
import clientsRoutes       from './routes/clients.js'
import itRoutes            from './routes/it.js'
import { initDb } from './services/db.js'

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, time: new Date().toISOString() }),
)

// Auth routes — no middleware needed
app.use('/api/auth', authRoutes)

// Everything else requires a valid session
app.use(authMiddleware)
app.use('/api/mail',          mailRoutes)
app.use('/api/users',         userRoutes)
app.use('/api/audit',         auditRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/helpdesk',      helpdeskRoutes)
app.use('/api/self-service',  selfServiceRoutes)
app.use('/api/documents',     documentRoutes)
app.use('/api/hr',            hrRoutes)
app.use('/api/clients',       clientsRoutes)
app.use('/api/it',            itRoutes)

const PORT = process.env.PORT || 3001
initDb().then(() => {
  app.listen(PORT, () =>
    console.log(`STRATA backend → http://localhost:${PORT}  [MOCK_AUTH=${process.env.MOCK_AUTH ?? 'true'}]`),
  )
}).catch(err => {
  console.error('[db] failed to initialize:', err)
  process.exit(1)
})
