import { execFileSync } from 'child_process'
import { appendFileSync, mkdirSync, existsSync, readFileSync } from 'fs'

const DOMAIN           = process.env.MAIL_DOMAIN        || 'pfe2627.xyz'
const MAIL_BASE        = process.env.MAIL_BASE          || '/var/mail/vmail'
const POSTFIX_VMAILBOX = process.env.POSTFIX_VMAILBOX   || '/etc/postfix/vmailbox'
const DOVECOT_PASSWD   = process.env.DOVECOT_PASSWD     || '/etc/dovecot/users'
const FILES_BASE       = process.env.EMPLOYEE_FILES_DIR || '/var/files'

function localPart(email) {
  return email.split('@')[0]
}

// Append only if the key doesn't already appear in the file
function appendUnique(filePath, entry, key) {
  if (existsSync(filePath)) {
    const lines = readFileSync(filePath, 'utf8').split('\n')
    if (lines.some(l => l.startsWith(key))) return // already present
  }
  appendFileSync(filePath, entry, 'utf8')
}

export function hashPassword(plaintext) {
  const out = execFileSync(
    'doveadm', ['pw', '-s', 'SHA512-CRYPT', '-p', plaintext],
    { encoding: 'utf8', timeout: 10_000 }
  ).trim()
  return out.startsWith('{') ? out : `{SHA512-CRYPT}${out}`
}

export function provisionUser(email, plaintext) {
  const user   = localPart(email)
  const steps  = {}
  const errors = []
  let   hash   = null

  try {
    hash = hashPassword(plaintext)
    steps.hash = true
  } catch (err) {
    return { ok: false, error: `Hash generation failed: ${err.message}`, hash: null, steps }
  }

  try {
    for (const dir of ['new', 'cur', 'tmp', 'sent', 'star', 'arch']) {
      mkdirSync(`${MAIL_BASE}/${DOMAIN}/${user}/Maildir/${dir}`, { recursive: true })
    }
    steps.maildir = true
  } catch (err) {
    errors.push(`Maildir: ${err.message}`)
    steps.maildir = false
  }

  try {
    appendUnique(POSTFIX_VMAILBOX, `${user}@${DOMAIN}      ${DOMAIN}/${user}/Maildir/\n`, `${user}@${DOMAIN}`)
    try { execFileSync('postmap', [POSTFIX_VMAILBOX], { timeout: 5000 }) } catch {}
    steps.vmailbox = true
  } catch (err) {
    errors.push(`vmailbox: ${err.message}`)
    steps.vmailbox = false
  }

  try {
    appendUnique(DOVECOT_PASSWD, `${user}@${DOMAIN}:${hash}\n`, `${user}@${DOMAIN}:`)
    steps.dovecot = true
  } catch (err) {
    errors.push(`Dovecot users: ${err.message}`)
    steps.dovecot = false
  }

  try {
    mkdirSync(`${FILES_BASE}/${user}/payslip`, { recursive: true })
    steps.filesDir = true
  } catch (err) {
    errors.push(`Files directory: ${err.message}`)
    steps.filesDir = false
  }

  if (errors.length > 0) return { ok: false, error: errors.join(' | '), hash, steps }
  return { ok: true, hash, steps }
}

export function reprovisionUser(email, storedHash) {
  const user   = localPart(email)
  const errors = []

  try {
    for (const dir of ['new', 'cur', 'tmp', 'sent', 'star', 'arch']) {
      mkdirSync(`${MAIL_BASE}/${DOMAIN}/${user}/Maildir/${dir}`, { recursive: true })
    }
  } catch (err) { errors.push(`Maildir: ${err.message}`) }

  try {
    appendUnique(POSTFIX_VMAILBOX, `${user}@${DOMAIN}      ${DOMAIN}/${user}/Maildir/\n`, `${user}@${DOMAIN}`)
    try { execFileSync('postmap', [POSTFIX_VMAILBOX], { timeout: 5000 }) } catch {}
  } catch (err) { errors.push(`vmailbox: ${err.message}`) }

  try {
    appendUnique(DOVECOT_PASSWD, `${user}@${DOMAIN}:${storedHash}\n`, `${user}@${DOMAIN}:`)
  } catch (err) { errors.push(`Dovecot users: ${err.message}`) }

  try {
    mkdirSync(`${FILES_BASE}/${user}/payslip`, { recursive: true })
  } catch (err) { errors.push(`Files directory: ${err.message}`) }

  if (errors.length > 0) return { ok: false, error: errors.join(' | ') }
  return { ok: true }
}
