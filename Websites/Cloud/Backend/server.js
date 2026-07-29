import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import resourcesRoutes from './routes/resources.js'
import billingRoutes from './routes/billing.js'
import accountRoutes from './routes/account.js'
import { initDb } from './services/db.js'
import { attachConsoleServer } from './services/consoleBridge.js'

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }))
app.get('/api/stats', (_req, res) => res.json({ ok: true }))

// Auth routes — no middleware needed
app.use('/api/auth', authRoutes)

// Everything else requires a valid session
app.use(authMiddleware)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/resources', resourcesRoutes)
app.use('/api/billing',   billingRoutes)
app.use('/api/account',   accountRoutes)

const PORT = process.env.PORT || 4001
const server = http.createServer(app)
attachConsoleServer(server)

initDb().then(() => {
  server.listen(PORT, () => console.log(`STRATA Cloud backend → http://localhost:${PORT}`))
}).catch(err => {
  console.error('[db] failed to initialize:', err)
  process.exit(1)
})
