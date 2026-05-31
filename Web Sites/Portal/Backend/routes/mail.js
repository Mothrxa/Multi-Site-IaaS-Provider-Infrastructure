import { Router } from 'express'
import { listMessages, getMessage, markRead, deleteMessage, sendMessage } from '../services/mail.js'

const router = Router()

// GET /api/mail/messages?folder=inbox
router.get('/messages', async (req, res) => {
  try {
    const folder   = req.query.folder || 'inbox'
    const messages = await listMessages(folder, req.user.imapCreds)
    res.json({ messages, total: messages.length, unread: messages.filter(m => m.unread).length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/mail/messages/:uid?folder=inbox
router.get('/messages/:uid', async (req, res) => {
  try {
    const folder = req.query.folder || 'inbox'
    const msg    = await getMessage(folder, req.params.uid, req.user.imapCreds)
    if (!msg) return res.status(404).json({ error: 'Message not found' })
    res.json(msg)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/mail/messages/:uid/read  body: { folder, read }
router.patch('/messages/:uid/read', async (req, res) => {
  try {
    const { folder = 'inbox', read = true } = req.body
    await markRead(folder, req.params.uid, read, req.user.imapCreds)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/mail/messages/:uid?folder=inbox
router.delete('/messages/:uid', async (req, res) => {
  try {
    const folder = req.query.folder || 'inbox'
    await deleteMessage(folder, req.params.uid, req.user.imapCreds)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/mail/send  body: { to, subject, body }
router.post('/send', async (req, res) => {
  try {
    const { to, subject, body } = req.body
    if (!to || !subject) return res.status(400).json({ error: 'to and subject are required' })
    const MAIL_DOMAIN = process.env.MAIL_DOMAIN || 'pfe2627.xyz'
    const from        = `${req.user.email.split('@')[0]}@${MAIL_DOMAIN}`
    const result      = await sendMessage(
      { from, to, subject, body: body || '' },
      req.user.imapCreds,
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
