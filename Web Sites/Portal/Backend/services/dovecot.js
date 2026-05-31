import { execFileSync } from 'child_process'
import { appendFileSync, mkdirSync } from 'fs'

const DOMAIN           = process.env.MAIL_DOMAIN        || 'pfe2627.xyz'
const MAIL_BASE        = process.env.MAIL_BASE          || '/var/mail/vmail'
const POSTFIX_VMAILBOX = process.env.POSTFIX_VMAILBOX   || '/etc/postfix/vmailbox'
const DOVECOT_PASSWD   = process.env.DOVECOT_PASSWD     || '/etc/dovecot/users'
const FILES_BASE       = process.env.EMPLOYEE_FILES_DIR || '/var/files'

function localPart(email) {
  return email.split('@')[0]
}

// Hash using doveadm — no sudo, node process must have execute permission
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

  // Step 1: hash
  try {
    hash = hashPassword(plaintext)
    steps.hash = true
  } catch (err) {
    return { ok: false, error: `Hash generation failed: ${err.message}`, hash: null, steps }
  }

  // Step 2: Maildir structure (node process must own /var/mail/vmail or have write perms)
  try {
    mkdirSync(`${MAIL_BASE}/${DOMAIN}/${user}/Maildir/cur`, { recursive: true })
    mkdirSync(`${MAIL_BASE}/${DOMAIN}/${user}/Maildir/new`, { recursive: true })
    mkdirSync(`${MAIL_BASE}/${DOMAIN}/${user}/Maildir/tmp`, { recursive: true })
    steps.maildir = true
  } catch (err) {
    errors.push(`Maildir: ${err.message}`)
    steps.maildir = false
  }

  // Step 3: Postfix vmailbox (node process must have write perms on the file)
  try {
    appendFileSync(POSTFIX_VMAILBOX, `${user}@${DOMAIN}      ${DOMAIN}/${user}/Maildir/\n`, 'utf8')
    try { execFileSync('postmap', [POSTFIX_VMAILBOX], { timeout: 5000 }) } catch {}
    steps.vmailbox = true
  } catch (err) {
    errors.push(`vmailbox: ${err.message}`)
    steps.vmailbox = false
  }

  // Step 4: Dovecot passwd file
  try {
    appendFileSync(DOVECOT_PASSWD, `${user}@${DOMAIN}:${hash}\n`, 'utf8')
    steps.dovecot = true
  } catch (err) {
    errors.push(`Dovecot users: ${err.message}`)
    steps.dovecot = false
  }

  // Step 5: Employee files directory
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
    mkdirSync(`${MAIL_BASE}/${DOMAIN}/${user}/Maildir/cur`, { recursive: true })
    mkdirSync(`${MAIL_BASE}/${DOMAIN}/${user}/Maildir/new`, { recursive: true })
    mkdirSync(`${MAIL_BASE}/${DOMAIN}/${user}/Maildir/tmp`, { recursive: true })
  } catch (err) { errors.push(`Maildir: ${err.message}`) }

  try {
    appendFileSync(POSTFIX_VMAILBOX, `${user}@${DOMAIN}      ${DOMAIN}/${user}/Maildir/\n`, 'utf8')
    try { execFileSync('postmap', [POSTFIX_VMAILBOX], { timeout: 5000 }) } catch {}
  } catch (err) { errors.push(`vmailbox: ${err.message}`) }

  try {
    appendFileSync(DOVECOT_PASSWD, `${user}@${DOMAIN}:${storedHash}\n`, 'utf8')
  } catch (err) { errors.push(`Dovecot users: ${err.message}`) }

  try {
    mkdirSync(`${FILES_BASE}/${user}/payslip`, { recursive: true })
  } catch (err) { errors.push(`Files directory: ${err.message}`) }

  if (errors.length > 0) return { ok: false, error: errors.join(' | ') }
  return { ok: true }
}
