import { randomUUID } from 'crypto'
import { getDb } from './db.js'

export function logAudit({ action, actorId = null, target = null, status, message = null, payload = null }) {
  // Strip control characters from message so JSON serialization stays valid
  const safeMsg = message ? String(message).replace(/[\x00-\x1F\x7F]/g, ' ').trim() : null
  getDb().prepare(
    'INSERT INTO audit_logs (id, action, actor_id, target, status, message, payload) VALUES (?,?,?,?,?,?,?)'
  ).run(
    randomUUID(), action, actorId, target, status, safeMsg,
    payload ? JSON.stringify(payload) : null,
  )
}

export function listAuditLogs({ limit = 200, showArchived = false } = {}) {
  const where = showArchived ? '' : 'WHERE (archived = 0 OR archived IS NULL)'
  return getDb()
    .prepare(`SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ?`)
    .all(limit)
    .map(row => ({ ...row, payload: row.payload ? JSON.parse(row.payload) : null }))
}

export function archiveLog(id) {
  getDb().prepare('UPDATE audit_logs SET archived = 1 WHERE id = ?').run(id)
}

export function archiveLogs() {
  const info = getDb().prepare('UPDATE audit_logs SET archived = 1 WHERE archived = 0').run()
  return info.changes
}

export function getAuditLog(id) {
  const row = getDb().prepare('SELECT * FROM audit_logs WHERE id = ?').get(id)
  if (!row) return null
  return { ...row, payload: row.payload ? JSON.parse(row.payload) : null }
}

export function resolveAuditLog(id) {
  getDb().prepare("UPDATE audit_logs SET status = 'resolved' WHERE id = ?").run(id)
}
