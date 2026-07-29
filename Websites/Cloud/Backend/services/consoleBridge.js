import { spawn } from 'child_process'
import os from 'os'
import path from 'path'
import { WebSocketServer } from 'ws'
import { verifyToken } from './auth.js'
import { getDb } from './db.js'

const HOST = process.env.HYPERVISOR_HOST || '100.125.162.107'
const SSH_USER = process.env.HYPERVISOR_USER || 'admin'
const SSH_KEY = process.env.HYPERVISOR_SSH_KEY || path.join(os.homedir(), '.ssh', 'id_ed25519')

// VPS.tf gives every VM a serial pty console (console { type="pty",
// target_type="serial" }) — `virsh console <name>` over SSH to the
// hypervisor attaches to it live. We just pipe raw bytes between that
// process and the browser's WebSocket; no separate console/VNC stack needed.
export function attachConsoleServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', async (req, socket, head) => {
    let url
    try { url = new URL(req.url, 'http://internal') } catch { socket.destroy(); return }
    if (url.pathname !== '/ws/console') return // let other upgrade handlers (if any) see it

    const token = url.searchParams.get('token')
    const id = url.searchParams.get('id')
    if (!token || !id) { socket.destroy(); return }

    const user = await verifyToken(token).catch(() => null)
    if (!user) { socket.destroy(); return }

    const db = getDb()
    const row = await db.prepare('SELECT * FROM resources WHERE id = ? AND user_id = ?').get(id, user.id)
    if (!row || row.kind !== 'vm') { socket.destroy(); return }

    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, row))
  })

  wss.on('connection', (ws, row) => {
    const ssh = spawn('ssh', [
      '-tt',
      '-o', 'BatchMode=yes',
      '-o', 'StrictHostKeyChecking=accept-new',
      '-i', SSH_KEY,
      `${SSH_USER}@${HOST}`,
      `virsh -c qemu:///system console ${row.id}`,
    ])

    ssh.stdout.on('data', (chunk) => { if (ws.readyState === ws.OPEN) ws.send(chunk) })
    ssh.stderr.on('data', (chunk) => { if (ws.readyState === ws.OPEN) ws.send(chunk) })
    ssh.on('exit', () => { if (ws.readyState === ws.OPEN) ws.close() })
    ssh.on('error', () => { if (ws.readyState === ws.OPEN) ws.close() })

    ws.on('message', (data) => { ssh.stdin.write(data) })
    ws.on('close', () => ssh.kill())
    ws.on('error', () => ssh.kill())
  })
}
