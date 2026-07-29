import { exec } from 'child_process'
import { promisify } from 'util'
import os from 'os'
import path from 'path'

const execAsync = promisify(exec)

const HOST = process.env.HYPERVISOR_HOST || '100.125.162.107'
const SSH_USER = process.env.HYPERVISOR_USER || 'admin'
const SSH_KEY = process.env.HYPERVISOR_SSH_KEY || path.join(os.homedir(), '.ssh', 'id_ed25519')

async function virsh(cmd) {
  const full = `ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -i ${SSH_KEY} ${SSH_USER}@${HOST} "virsh -c qemu:///system ${cmd}"`
  try {
    const { stdout } = await execAsync(full, { timeout: 30_000 })
    return stdout.trim()
  } catch (e) {
    const msg = (e.stderr || e.message || '').split('\n').map(l => l.trim()).filter(Boolean).pop()
    throw new Error(msg || 'virsh command failed')
  }
}

// Pool lifecycle is intentionally kept OUTSIDE any per-VM Terraform state —
// each VM provisions in its own isolated workspace/state, but a user's pool
// is shared across all their VMs, so it can't be owned/created by any single
// VM's state without colliding on the user's 2nd+ VM.
export async function ensureUserPool(userId) {
  const exists = await virsh(`pool-info ${userId}`).then(() => true).catch(() => false)
  if (exists) return
  const target = `/var/lib/libvirt/users/${userId}`
  await virsh(`pool-define-as ${userId} dir --target ${target}`)
  await virsh(`pool-build ${userId}`)
  await virsh(`pool-start ${userId}`)
  await virsh(`pool-autostart ${userId}`)
}

export const startVm    = (name) => virsh(`start ${name}`)
export const shutdownVm = (name) => virsh(`shutdown ${name}`)
export const rebootVm   = (name) => virsh(`reboot ${name}`)
export const destroyVm  = (name) => virsh(`destroy ${name}`) // hard power-off, not graceful
export const domState   = (name) => virsh(`domstate ${name}`)

// `virsh shutdown`/`start` only *request* a state change — they don't wait
// for it. Writing status to the DB right after issuing one, without
// confirming it actually happened, is how the DB and the real domain state
// drift apart (e.g. a guest that ignores the ACPI shutdown request stays
// running while we've already told the UI it's stopped).
export async function waitForDomState(name, targetStates, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const state = await domState(name).catch(() => null)
    if (state && targetStates.includes(state.trim())) return true
    await new Promise(r => setTimeout(r, 1500))
  }
  return false
}

// Raw `virsh domstats` key=value dump — cumulative counters, callers turn
// these into rates/percentages by diffing against a previous sample.
export async function getDomStats(name) {
  const out = await virsh(`domstats ${name} --cpu-total --balloon --block --interface`)
  const stats = {}
  for (const line of out.split('\n')) {
    const m = line.match(/^\s*([\w.-]+)=(.+)$/)
    if (m) stats[m[1]] = m[2]
  }
  return stats
}

// Bridge-type interfaces don't report addresses through libvirt's default/arp
// lookup — only the qemu-guest-agent channel actually has the real IPv4.
export async function getIPv4(name) {
  const out = await virsh(`domifaddr ${name} --source agent`)
  for (const line of out.split('\n')) {
    if (/^\s*lo\b/.test(line)) continue // skip loopback
    const match = line.match(/(\d{1,3}(?:\.\d{1,3}){3})\/\d+/)
    if (match && match[1] !== '127.0.0.1') return match[1]
  }
  return null
}
