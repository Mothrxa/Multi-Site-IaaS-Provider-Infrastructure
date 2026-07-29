import { Router } from 'express'
import { randomUUID } from 'crypto'
import { existsSync, mkdirSync } from 'fs'
import { resolve, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import { getDb } from '../services/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = resolve(__dirname, '../../Database/files')
mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => cb(null, randomUUID() + extname(file.originalname)),
})
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } })

const router = Router()

const IS_ADMIN  = (u) => ['superadmin', 'it_admin'].includes(u.role)
const IS_HR     = (u) => u.dept === 'hr' || IS_ADMIN(u)
// Any employee can manage docs for their own dept; HR/admins can manage all
const canManage = (u, dept) => IS_ADMIN(u) || u.dept === 'hr' || u.dept === dept

function canRead(doc, user) {
  if (IS_ADMIN(user))          return true
  if (doc.acl === 'everyone')  return true
  if (doc.acl === 'dept_only') return doc.dept === user.dept || doc.dept === 'company'
  if (doc.acl === 'owner_only')return doc.owner_id === user.id
  return false
}

// GET /api/documents?archived=1
router.get('/', async (req, res) => {
  const showArchived = req.query.archived === '1'
  const where        = showArchived ? '' : 'WHERE d.archived = 0'
  const all = await getDb().prepare(`
    SELECT d.*, u.name AS owner_name FROM documents d
    JOIN users u ON u.id = d.owner_id
    ${where} ORDER BY d.uploaded_at DESC
  `).all()
  res.json(all.filter(d => canRead(d, req.user)))
})

// POST /api/documents/upload  multipart/form-data
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' })
  const { name, description = '', dept = req.user.dept, acl = 'dept_only' } = req.body
  if (!canManage(req.user, dept))
    return res.status(403).json({ error: 'You can only upload documents for your own department' })
  const db = getDb(), id = randomUUID()
  await db.prepare(
    'INSERT INTO documents (id, name, description, file_path, size_bytes, mime_type, owner_id, dept, acl) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(id, name || req.file.originalname, description, req.file.filename, req.file.size, req.file.mimetype, req.user.id, dept, acl)
  res.status(201).json(await db.prepare('SELECT d.*, u.name AS owner_name FROM documents d JOIN users u ON u.id=d.owner_id WHERE d.id=?').get(id))
})

// PATCH /api/documents/:id
router.patch('/:id', async (req, res) => {
  const doc = await getDb().prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id)
  if (!doc) return res.status(404).json({ error: 'Document not found' })
  if (!canManage(req.user, doc.dept)) return res.status(403).json({ error: 'Forbidden' })
  const { name, description, dept, acl } = req.body
  const sets = [], vals = []
  if (name        !== undefined) { sets.push('name = ?');        vals.push(name) }
  if (description !== undefined) { sets.push('description = ?'); vals.push(description) }
  if (dept        !== undefined) { sets.push('dept = ?');        vals.push(dept) }
  if (acl         !== undefined) { sets.push('acl = ?');         vals.push(acl) }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' })
  vals.push(req.params.id)
  await getDb().prepare(`UPDATE documents SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  res.json(await getDb().prepare('SELECT d.*, u.name AS owner_name FROM documents d JOIN users u ON u.id=d.owner_id WHERE d.id=?').get(req.params.id))
})

// PATCH /api/documents/:id/archive
router.patch('/:id/archive', async (req, res) => {
  const doc = await getDb().prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id)
  if (!doc) return res.status(404).json({ error: 'Document not found' })
  if (!canManage(req.user, doc.dept)) return res.status(403).json({ error: 'Forbidden' })
  const archived = req.body.archived !== false ? 1 : 0
  await getDb().prepare('UPDATE documents SET archived = ? WHERE id = ?').run(archived, req.params.id)
  res.json({ ok: true, archived })
})

// GET /api/documents/:id/download
router.get('/:id/download', async (req, res) => {
  const doc = await getDb().prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id)
  if (!doc) return res.status(404).json({ error: 'Document not found' })
  if (!canRead(doc, req.user)) return res.status(403).json({ error: 'Forbidden' })
  if (!doc.file_path) return res.status(404).json({ error: 'No file attached to this document' })
  const full = resolve(UPLOAD_DIR, doc.file_path)
  if (!existsSync(full)) return res.status(404).json({ error: 'File not found on server' })
  res.download(full, doc.name)
})

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  const doc = await getDb().prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id)
  if (!doc) return res.status(404).json({ error: 'Document not found' })
  if (!canManage(req.user, doc.dept)) return res.status(403).json({ error: 'Forbidden' })
  await getDb().prepare('DELETE FROM documents WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
