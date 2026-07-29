import { Router } from 'express'
import { randomUUID } from 'crypto'
import { getDb } from '../services/db.js'
import * as tf from '../services/terraform.js'
import * as virsh from '../services/virsh.js'
import * as natMap from '../services/natMap.js'
import * as stats from '../services/stats.js'
import { validateCustomImageUrl } from '../services/imageValidation.js'

const router = Router()

const VPS_PLANS = {
  's-1-1':  { cpu: 1, ram: 1,  disk: 25,  hr: 0.0089 },
  's-2-2':  { cpu: 2, ram: 2,  disk: 60,  hr: 0.0179 },
  's-2-4':  { cpu: 2, ram: 4,  disk: 80,  hr: 0.0357 },
  's-4-8':  { cpu: 4, ram: 8,  disk: 160, hr: 0.0714 },
  'p-2-8':  { cpu: 2, ram: 8,  disk: 100, hr: 0.1042 },
  'p-4-16': { cpu: 4, ram: 16, disk: 200, hr: 0.2083 },
  'p-8-32': { cpu: 8, ram: 32, disk: 400, hr: 0.4167 },
  'm-2-16': { cpu: 2, ram: 16, disk: 50,  hr: 0.1339 },
  'm-4-32': { cpu: 4, ram: 32, disk: 100, hr: 0.2679 },
  'm-8-64': { cpu: 8, ram: 64, disk: 200, hr: 0.5357 },
}

const CONTAINER_PLANS = {
  'c-nano':  { cpu: 0.25, ram: 0.25, hr: 0.0011 },
  'c-micro': { cpu: 0.5,  ram: 0.5,  hr: 0.0021 },
  'c-small': { cpu: 1,    ram: 1,    hr: 0.0042 },
  'c-med':   { cpu: 2,    ram: 2,    hr: 0.0084 },
  'c-large': { cpu: 4,    ram: 4,    hr: 0.0167 },
}

function randomIp(priv = false) {
  return priv
    ? `10.0.4.${Math.floor(Math.random() * 250) + 2}`
    : `157.245.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`
}

function rowToJson(r) {
  return { ...r, env: r.env ? JSON.parse(r.env) : undefined }
}

// GET /api/resources?kind=vm|container
router.get('/', async (req, res) => {
  const db = getDb()
  const { kind } = req.query
  const dbKind = kind === 'vm' ? 'vm' : kind === 'cnt' || kind === 'container' ? 'container' : null
  const rows = dbKind
    ? await db.prepare('SELECT * FROM resources WHERE user_id = ? AND kind = ? ORDER BY created_at DESC').all(req.user.id, dbKind)
    : await db.prepare('SELECT * FROM resources WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id)
  res.json(rows.map(rowToJson).map(decorate))
})

function decorate(r) {
  return {
    ...r,
    os: r.kind === 'vm' ? r.image : undefined,
    image: r.kind === 'container' ? r.image : r.image,
  }
}

// GET /api/resources/:id
router.get('/:id', async (req, res) => {
  const db = getDb()
  let row = await db.prepare('SELECT * FROM resources WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  // opportunistic catch-up: the initial provisioning poll may have moved on
  // before nat-add.sh finished writing the mapping — fill it in lazily
  if (row.kind === 'vm' && row.ip && !row.public_ip) {
    const publicIp = await natMap.getPublicIp(row.ip).catch(() => null)
    if (publicIp) {
      await db.prepare('UPDATE resources SET public_ip = ? WHERE id = ?').run(publicIp, row.id)
      row = { ...row, public_ip: publicIp }
    }
  }
  // reconcile against the real domain state — the DB only reflects state
  // changes made *through this API*, so anything done directly on the
  // hypervisor (or a shutdown request the guest silently ignored) can drift
  // from it. Only check in steady states, not mid-transition.
  if (row.kind === 'vm' && (row.status === 'running' || row.status === 'stopped')) {
    const raw = await virsh.domState(row.id).catch(() => null)
    if (raw) {
      const real = raw.trim() === 'shut off' ? 'stopped' : 'running'
      if (real !== row.status) {
        await db.prepare('UPDATE resources SET status = ? WHERE id = ?').run(real, row.id)
        row = { ...row, status: real }
      }
    }
  }
  res.json(decorate(rowToJson(row)))
})

// POST /api/resources
router.post('/', async (req, res) => {
  const db = getDb()
  const body = req.body || {}
  const id = randomUUID()
  const region = body.region || 'alg1'

  if (body.kind === 'container') {
    const plan = CONTAINER_PLANS[body.plan_id] || CONTAINER_PLANS['c-micro']
    await db.prepare(
      `INSERT INTO resources (id, user_id, kind, name, label, image, region, status, plan_id, ip, vcpu, ram_gb, storage_gb, hourly_rate, replicas, ports, env)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id, req.user.id, 'container', body.name, body.label || null, body.image, region, 'deploying',
      body.plan_id || 'c-micro', randomIp(true), plan.cpu, plan.ram, 0, plan.hr,
      body.replicas || 1, body.ports || '80', JSON.stringify(body.env || []),
    )
  } else {
    const plan = VPS_PLANS[body.plan_id] || VPS_PLANS['s-2-4']

    const sshKey = await db.prepare(
      'SELECT public_key FROM ssh_keys WHERE user_id = ? ORDER BY created_at ASC LIMIT 1'
    ).get(req.user.id)
    if (!sshKey) return res.status(400).json({ error: 'No SSH key on account — add one in Account → SSH Keys first.' })

    const os = body.os || 'ubuntu-24.04'
    if (/^https?:\/\//i.test(os)) {
      try { await validateCustomImageUrl(os) }
      catch (e) { return res.status(400).json({ error: e.message }) }
    }

    await db.prepare(
      `INSERT INTO resources (id, user_id, kind, name, label, image, region, status, stage, plan_id, ip, vcpu, ram_gb, storage_gb, hourly_rate, replicas)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id, req.user.id, 'vm', body.name, body.label || null, os, 'local', 'deploying', 'queued',
      body.plan_id || 's-2-4', null, plan.cpu, plan.ram, plan.disk, plan.hr, 1,
    )

    await db.prepare('INSERT INTO activity_log (id, user_id, action, detail, kind) VALUES (?,?,?,?,?)')
      .run(randomUUID(), req.user.id, `Deployed ${body.name}`, body.plan_id, 'good')

    const row = await db.prepare('SELECT * FROM resources WHERE id = ?').get(id)
    res.json(decorate(rowToJson(row)))

    // provision in background — stage tracks real terraform progress
    ;(async () => {
      try {
        await db.prepare("UPDATE resources SET stage = 'initializing' WHERE id = ?").run(id)
        await tf.initWorkspace(req.user.id, id)

        await virsh.ensureUserPool(req.user.id)

        await db.prepare("UPDATE resources SET stage = 'provisioning' WHERE id = ?").run(id)
        await tf.applyVm(req.user.id, id, {
          hostname: body.name,
          os,
          cpu: plan.cpu,
          memory: plan.ram * 1024,
          disk: plan.disk,
          sshKey: sshKey.public_key,
        })

        await db.prepare("UPDATE resources SET stage = 'finalizing' WHERE id = ?").run(id)
        // Bridge-type interfaces don't report addresses through Terraform's
        // default network_interface output — only qemu-guest-agent has it,
        // queried directly via virsh (see services/virsh.js).
        let ip = null
        for (let attempt = 0; attempt < 20; attempt++) {
          ip = await virsh.getIPv4(id).catch(() => null)
          if (ip) break
          await new Promise((r) => setTimeout(r, 4000))
        }

        // The DHCP `on commit` hook fires nat-add.sh asynchronously around
        // lease time — give it a short window to land in the mapping file.
        let publicIp = null
        if (ip) {
          for (let attempt = 0; attempt < 8; attempt++) {
            publicIp = await natMap.getPublicIp(ip).catch(() => null)
            if (publicIp) break
            await new Promise((r) => setTimeout(r, 2000))
          }
        }

        await db.prepare("UPDATE resources SET status = 'running', stage = 'done', ip = ?, public_ip = ? WHERE id = ?").run(ip, publicIp, id)
      } catch (e) {
        console.error(`[terraform] provision failed for ${id}:`, e.message)
        await db.prepare("UPDATE resources SET status = 'failed', stage = NULL, error_message = ? WHERE id = ?").run(e.message, id)
        // best-effort cleanup of any partially-created infra + the workspace dir
        tf.destroy(req.user.id, id).catch(() => {})
        // give the frontend's poll (~1.8s) a window to read the failure before the row disappears
        setTimeout(() => {
          db.prepare('DELETE FROM resources WHERE id = ?').run(id).catch(() => {})
        }, 8000)
      }
    })()
    return
  }

  await db.prepare('INSERT INTO activity_log (id, user_id, action, detail, kind) VALUES (?,?,?,?,?)')
    .run(randomUUID(), req.user.id, `Deployed ${body.name}`, `${region} · ${body.plan_id}`, 'good')

  setTimeout(() => {
    db.prepare("UPDATE resources SET status = 'running' WHERE id = ?").run(id).catch(() => {})
  }, 8000)

  const row = await db.prepare('SELECT * FROM resources WHERE id = ?').get(id)
  const out = decorate(rowToJson(row))
  out.regionName = region.toUpperCase()
  res.json(out)
})

// GET /api/resources/:id/stats — live CPU/RAM/disk/network from qemu-guest-agent
router.get('/:id/stats', async (req, res) => {
  const db = getDb()
  const row = await db.prepare('SELECT * FROM resources WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  if (row.kind !== 'vm') return res.status(501).json({ error: 'Live stats are only available for VMs.' })
  if (row.status !== 'running') return res.status(409).json({ error: 'VM is not running.' })
  try {
    const s = await stats.getVmStats(row.id, row.vcpu)
    res.json(s)
  } catch (e) {
    res.status(502).json({ error: `Failed to read stats: ${e.message}` })
  }
})

// PATCH /api/resources/:id  — { action } or update fields
router.patch('/:id', async (req, res) => {
  const db = getDb()
  const row = await db.prepare('SELECT * FROM resources WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (!row) return res.status(404).json({ error: 'Not found' })

  const { action, ...fields } = req.body || {}

  if (action) {
    const isVm = row.kind === 'vm'
    if (action === 'start') {
      if (isVm) {
        try { await virsh.startVm(row.id) }
        catch (e) {
          // the DB can drift from the real domain state (e.g. someone ran
          // virsh directly on the hypervisor) — if it's already running,
          // that's the state we wanted, not a failure
          if (!/already active/i.test(e.message)) {
            return res.status(502).json({ error: `Failed to start VM: ${e.message}` })
          }
        }
        stats.clearStats(row.id)
      }
      await db.prepare("UPDATE resources SET status = 'running' WHERE id = ?").run(row.id)
    } else if (action === 'stop') {
      if (isVm) {
        try {
          await virsh.shutdownVm(row.id)
          // `virsh shutdown` only requests an ACPI shutdown — it doesn't wait
          // for the guest to actually power off. Writing 'stopped' to the DB
          // without confirming that happened is how the DB and the real
          // domain state drift apart (a guest that ignores/delays the
          // request stays running while the UI already claims it's off).
          const confirmed = await virsh.waitForDomState(row.id, ['shut off'], 20_000)
          if (!confirmed) {
            // guest didn't respond in time — force power-off rather than
            // reporting a state that isn't true
            await virsh.destroyVm(row.id)
          }
        } catch (e) { return res.status(502).json({ error: `Failed to stop VM: ${e.message}` }) }
        stats.clearStats(row.id)
      }
      await db.prepare("UPDATE resources SET status = 'stopped' WHERE id = ?").run(row.id)
    } else if (action === 'reboot') {
      await db.prepare("UPDATE resources SET status = 'rebooting' WHERE id = ?").run(row.id)
      if (isVm) {
        try { await virsh.rebootVm(row.id) } catch (e) {
          await db.prepare("UPDATE resources SET status = 'running' WHERE id = ?").run(row.id)
          return res.status(502).json({ error: `Failed to reboot VM: ${e.message}` })
        }
      }
      setTimeout(() => {
        db.prepare("UPDATE resources SET status = 'running' WHERE id = ?").run(row.id).catch(() => {})
      }, 5000)
    } else {
      return res.status(400).json({ error: 'Unknown action' })
    }
  } else {
    const sets = []
    const vals = []
    for (const k of ['name', 'label']) {
      if (fields[k] !== undefined) { sets.push(`${k} = ?`); vals.push(fields[k]) }
    }
    if (sets.length) {
      vals.push(row.id)
      await db.prepare(`UPDATE resources SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
    }
  }

  const updated = await db.prepare('SELECT * FROM resources WHERE id = ?').get(row.id)
  res.json(decorate(rowToJson(updated)))
})

// DELETE /api/resources/:id
router.delete('/:id', async (req, res) => {
  const db = getDb()
  const row = await db.prepare('SELECT * FROM resources WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  await db.prepare('DELETE FROM resources WHERE id = ?').run(row.id)
  await db.prepare('INSERT INTO activity_log (id, user_id, action, detail, kind) VALUES (?,?,?,?,?)')
    .run(randomUUID(), req.user.id, `Destroyed ${row.name}`, `${row.plan_id}`, 'bad')
  res.json({ ok: true })
  if (row.kind === 'vm') {
    stats.clearStats(row.id)
    tf.destroy(row.user_id, row.id).catch(e => console.error(`[terraform] destroy failed for ${row.id}:`, e.message))
  }
})

export default router
