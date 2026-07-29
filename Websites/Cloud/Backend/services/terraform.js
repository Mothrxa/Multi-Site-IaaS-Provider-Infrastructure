import { exec, execFile } from 'child_process'
import { mkdir, writeFile, rm, symlink } from 'fs/promises'
import { promisify } from 'util'
import { createHash } from 'crypto'
import path from 'path'
import nodeOs from 'os'
import { MAX_BYTES as MAX_IMAGE_BYTES } from './imageValidation.js'

const execAsync = promisify(exec)
const execFileAsync = promisify(execFile)

const TEMPLATES_DIR = process.env.TERRAFORM_TEMPLATES_DIR || '/opt/strata/terraform'
const WORKSPACES_DIR = process.env.TERRAFORM_WORKSPACES_DIR || '/opt/strata/workspaces'

const HYPERVISOR_HOST = process.env.HYPERVISOR_HOST || '100.125.162.107'
const HYPERVISOR_USER = process.env.HYPERVISOR_USER || 'admin'
const HYPERVISOR_SSH_KEY = process.env.HYPERVISOR_SSH_KEY || path.join(nodeOs.homedir(), '.ssh', 'id_ed25519')

const OS_IMAGES = {
  'ubuntu-24.04': 'ubuntu-24.04-server-cloudimg-amd64.img',
  'debian-12':    'debian-12-generic-amd64.qcow2',
  'fedora-44':    'Fedora-Cloud-Base-44.qcow2',
  'almalinux-9':  'AlmaLinux-9-GenericCloud-latest.x86_64.qcow2',
  'rocky-9':      'Rocky-9-GenericCloud-latest.x86_64.qcow2',
}

function wsDir(userId, resourceId) {
  return path.join(WORKSPACES_DIR, userId, resourceId)
}

function stripAnsi(s) {
  return s.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
}

function terraformErrorMessage(stderr) {
  if (!stderr) return null
  const lines = stripAnsi(stderr).split('\n').map(l => l.trim()).filter(Boolean)
  const errIdx = lines.findIndex(l => l.startsWith('Error:'))
  if (errIdx === -1) return lines[lines.length - 1] || null
  // Terraform often wraps the real reason on the next non-empty line(s).
  const detail = lines.slice(errIdx + 1).find(l => l && !l.startsWith('with ') && !l.startsWith('on '))
  const head = lines[errIdx].replace(/^Error:\s*/, '')
  return detail && detail !== head ? `${head} — ${detail}` : head
}

async function run(cmd, cwd) {
  try {
    const { stdout } = await execAsync(`${cmd} -no-color`, { cwd, timeout: 300_000 })
    return stdout
  } catch (e) {
    const msg = terraformErrorMessage(e.stderr) || stripAnsi(e.message || '').trim()
    throw new Error(msg)
  }
}

export async function initWorkspace(userId, resourceId) {
  const dir = wsDir(userId, resourceId)
  await mkdir(dir, { recursive: true })
  await symlink(path.join(TEMPLATES_DIR, 'VPS.tf'),        path.join(dir, 'VPS.tf'))
  await symlink(path.join(TEMPLATES_DIR, 'cloudinit.tf'),  path.join(dir, 'cloudinit.tf'))
  await run('terraform init -input=false', dir)
}

const SSH_BASE = [
  '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new',
  '-i', HYPERVISOR_SSH_KEY,
  `${HYPERVISOR_USER}@${HYPERVISOR_HOST}`,
]

async function virshRemote(cmd) {
  const { stdout } = await execFileAsync('ssh', [...SSH_BASE, `virsh -c qemu:///system ${cmd}`], { timeout: 30_000 })
  return stdout
}

// Waits for the ready-marker volume another in-flight request will create
// once its upload finishes.
async function waitForReadyVolume(readyVol, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const ok = await virshRemote(`vol-info --pool default ${readyVol}`).then(() => true).catch(() => false)
    if (ok) return
    await new Promise(r => setTimeout(r, 3000))
  }
  throw new Error('Timed out waiting for a concurrent download of the same image to finish')
}

// Content-addressed by URL hash so repeat use of the same custom image (by
// the same or a different customer) reuses the volume already on the
// hypervisor instead of re-downloading it.
//
// The SSH user has no filesystem write access to /var/lib/libvirt/images
// (it's owned qemu:qemu, no group/other write) — only the privileged
// libvirt daemon can write there. So the image is streamed straight into a
// libvirt-managed volume via `virsh vol-upload` (the same path Terraform's
// own volume creation uses), never touching the filesystem directly.
//
// "Done downloading" is tracked with a second, tiny marker *volume*
// (`custom-<hash>.ready`) in the same pool, not a plain file — a plain file
// in /tmp is subject to systemd-tmpfiles' periodic cleanup, which could
// silently delete just the marker while the real image volume survives,
// leaving future requests unable to tell it's already there. Keeping both
// in libvirt's own storage means they live and die together.
//
// `vol-create-as` is atomic in libvirt: if two requests race for the same
// new URL, the loser gets "already exists" and just waits for the winner's
// ready-marker volume instead of a separate external lock.
async function ensureCustomImage(url) {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 16)
  const filename = `custom-${hash}.qcow2`
  const readyVol = `custom-${hash}.ready`
  const safeUrl = `'${url.replace(/'/g, "'\\''")}'`

  const alreadyReady = await virshRemote(`vol-info --pool default ${readyVol}`).then(() => true).catch(() => false)
  if (alreadyReady) return filename

  // The fetch AND the download both run on the hypervisor, not here — the
  // backend only reaches the internet through the slower simulated lab
  // links, while the hypervisor has a fast direct connection. Routing the
  // image through Node (fetch here, pipe over SSH) would send it across the
  // slow link for no reason; a single remote command keeps the whole
  // transfer on the hypervisor's own fast path.
  const sizeOut = await execFileAsync('ssh', [...SSH_BASE, `curl -sI -L ${safeUrl}`]).then(r => r.stdout).catch(() => '')
  const sizeMatch = [...sizeOut.matchAll(/^content-length:\s*(\d+)/gim)].pop()
  const size = sizeMatch ? Number(sizeMatch[1]) : MAX_IMAGE_BYTES

  try {
    await virshRemote(`vol-create-as default ${filename} ${size} --format qcow2`)
  } catch (e) {
    if (/already exists/i.test(e.message || '')) {
      await waitForReadyVolume(readyVol, 20 * 60_000)
      return filename
    }
    throw e
  }

  const inner = `set -o pipefail; curl -fSL --max-filesize ${MAX_IMAGE_BYTES} ${safeUrl} | virsh -c qemu:///system vol-upload --vol ${filename} --file /dev/stdin --pool default`
  const cmd = `bash -c '${inner.replace(/'/g, "'\\''")}'`
  await execFileAsync('ssh', [...SSH_BASE, cmd], { timeout: 20 * 60_000 })

  await virshRemote(`vol-create-as default ${readyVol} 1`)
  return filename
}

export async function applyVm(userId, resourceId, { hostname, os, cpu, memory, disk, sshKey }) {
  const dir = wsDir(userId, resourceId)
  const osImage = /^https:\/\//i.test(os) ? await ensureCustomImage(os) : (OS_IMAGES[os] || os)
  const tfvars = [
    `user_id     = "${userId}"`,
    `vm_name     = "${resourceId}"`,
    `vm_hostname = "${hostname}"`,
    `vm_cpu      = ${cpu}`,
    `vm_memory   = ${memory}`,
    `vm_size     = ${disk}`,
    `os_image    = "${osImage}"`,
    `ssh_key     = "${sshKey}"`,
  ].join('\n')
  await writeFile(path.join(dir, 'terraform.tfvars'), tfvars)
  await run('terraform apply -auto-approve -input=false', dir)
}

export async function getOutput(userId, resourceId) {
  const dir = wsDir(userId, resourceId)
  const out = await run('terraform output -json', dir)
  return JSON.parse(out)
}

export async function destroy(userId, resourceId) {
  const dir = wsDir(userId, resourceId)
  try {
    await run('terraform destroy -auto-approve -input=false', dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
