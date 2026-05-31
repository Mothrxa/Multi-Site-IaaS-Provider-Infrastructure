import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'

// MOCK_MAIL controls mail data (independent of MOCK_AUTH which controls JWT)
// Set MOCK_MAIL=false once real IMAP/SMTP is reachable from this server
const MOCK        = process.env.MOCK_MAIL !== 'false'
const MAIL_DOMAIN = process.env.MAIL_DOMAIN || 'pfe2627.xyz'

const FOLDER_MAP = {
  inbox: process.env.IMAP_FOLDER_INBOX   || 'INBOX',
  sent:  process.env.IMAP_FOLDER_SENT    || 'Sent',
  draft: process.env.IMAP_FOLDER_DRAFTS  || 'Drafts',
  trash: process.env.IMAP_FOLDER_TRASH   || 'Trash',
  arch:  process.env.IMAP_FOLDER_ARCHIVE || 'Archive',
}

// ── Mock data ────────────────────────────────────────────────────────────────
// Matches the frontend's existing hardcoded messages so the visual output is
// identical once the API is wired up. body is the full HTML shown in the reader.

const MOCK_STORE = [
  {
    uid: 1, folder: 'inbox',
    fromName: 'Amira Ould', fromEmail: 'amira.o@pfe2627.xyz',
    subject: 'Payslip for April is available',
    preview: 'Hi! Your April payslip has been published in HR Self-Service. Net pay…',
    body: '<p>Hi,</p><p>Your April payslip has been published in HR Self-Service. Net pay is DZD 147,200. Please log in to review your breakdown and download the PDF.</p><p>Best,<br>Amira Ould<br>Head of HR</p>',
    date: '2026-05-30T08:42:00Z', unread: true, starred: false, labels: ['HR'],
  },
  {
    uid: 2, folder: 'inbox',
    fromName: 'Sarah Benhadj', fromEmail: 'sarah.b@pfe2627.xyz',
    subject: 'Quick sync on gateway 04 RCA',
    preview: "Could we get on a call later today to align on the root cause analysis? I've drafted…",
    body: "<p>Hi,</p><p>Could we get on a call later today to align on the root cause analysis? I've drafted the initial findings — gateway 04 had a BGP session drop at 07:31 that cascaded to three downstream VMs. I want to align before we send the post-mortem to customers.</p><p>Best,<br>Sarah</p>",
    date: '2026-05-30T08:14:00Z', unread: true, starred: false, labels: ['Internal'],
  },
  {
    uid: 3, folder: 'inbox',
    fromName: 'Helpdesk @ STRATA', fromEmail: 'helpdesk@pfe2627.xyz',
    subject: 'Ticket #4821 has been assigned to you',
    preview: 'Customer report: VPN connection drops every 5 minutes. Customer is on Business plan…',
    body: '<p>Ticket <strong>#4821</strong> has been assigned to you.</p><p><strong>Customer:</strong> Atlas Cloud<br><strong>Plan:</strong> Business<br><strong>Report:</strong> VPN connection drops every 5 minutes on the site-to-site tunnel to the Oran office.</p><p>Please investigate and update the ticket within 4 hours (SLA P2).</p>',
    date: '2026-05-30T08:02:00Z', unread: true, starred: false, labels: ['Helpdesk'],
  },
  {
    uid: 4, folder: 'inbox',
    fromName: 'Pierre Saadi', fromEmail: 'pierre.s@pfe2627.xyz',
    subject: 'Atlas Cloud — contract renewal draft',
    preview: "Hey, please find attached the renewal terms I prepared for Atlas Cloud. They've requested…",
    body: "<p>Hey,</p><p>Please find attached the renewal terms I prepared for Atlas Cloud. They've requested a 3-year lock-in at €504k ACV with a 12% expansion clause. Legal has reviewed and signed off. Let me know if you have any changes before I send to the customer.</p><p>Pierre</p>",
    date: '2026-05-29T10:00:00Z', unread: false, starred: false, labels: ['BizOps'],
  },
  {
    uid: 5, folder: 'inbox',
    fromName: 'GitLab', fromEmail: 'noreply@gitlab.com',
    subject: 'MR review requested · cloud-api!482',
    preview: 'Yacine Hamdi has requested your review of merge request: feat(rate-limit) per-account…',
    body: '<p>Yacine Hamdi has requested your review of merge request <strong>cloud-api!482</strong>:</p><p><em>feat(rate-limit): per-account throttling middleware</em></p><p>Please review the changes and leave your feedback in GitLab.</p>',
    date: '2026-05-29T09:30:00Z', unread: false, starred: false, labels: ['Notification'],
  },
  {
    uid: 6, folder: 'inbox',
    fromName: 'Karim Slimani', fromEmail: 'karim.s@pfe2627.xyz',
    subject: 'Interview feedback — Senior Backend',
    preview: 'Thank you for sitting in the interview. Please drop your feedback in the recruiter sheet…',
    body: '<p>Thank you for sitting in the interview for the Senior Backend role. Please drop your feedback in the recruiter sheet by end of day Friday. We need at least 3 evaluators before we can move to offer stage.</p>',
    date: '2026-05-17T14:00:00Z', unread: false, starred: false, labels: ['HR'],
  },
  {
    uid: 7, folder: 'inbox',
    fromName: 'Announcements', fromEmail: 'announce@pfe2627.xyz',
    subject: 'Office closure · May 22 (afternoon)',
    preview: 'Reminder: Algiers HQ will close at 14:00 on Thursday for facility maintenance. Remote…',
    body: '<p>Reminder: Algiers HQ will close at 14:00 on Thursday, May 22 for elevator maintenance. Remote work is authorised from 14:00 onwards. The Oran and Paris offices remain open as usual.</p>',
    date: '2026-05-16T09:00:00Z', unread: false, starred: false, labels: ['Announcement'],
  },
  {
    uid: 8, folder: 'sent',
    fromName: 'You', fromEmail: '',
    subject: 'RE: gateway-edge release plan',
    preview: "Confirmed. Let's freeze code on Friday EOD and run a final QA pass over the weekend…",
    body: "<p>Confirmed. Let's freeze code on Friday EOD and run a final QA pass over the weekend. I'll notify the on-call team and make sure the rollback runbook is up to date.</p>",
    date: '2026-05-16T17:00:00Z', unread: false, starred: false, labels: ['Internal'],
  },
  {
    uid: 9, folder: 'sent',
    fromName: 'You', fromEmail: '',
    subject: 'Helpdesk SOP draft',
    preview: 'Attaching the first draft of the SOP for VPN connectivity issues. Could you review by…',
    body: '<p>Attaching the first draft of the SOP for VPN connectivity issues. Could you review by Thursday and let me know if I missed any edge cases? I want to publish it to the handbook before the next on-call rotation.</p>',
    date: '2026-05-14T11:00:00Z', unread: false, starred: false, labels: ['Helpdesk'],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(raw) {
  const d   = new Date(raw)
  const now = new Date()
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(+today - 86_400_000)
  const day       = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (day >= today)     return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (day >= yesterday) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function normalise(msg, withBody = false) {
  return {
    uid:       msg.uid,
    folder:    msg.folder,
    from:      msg.fromName,
    fromEmail: msg.fromEmail,
    subject:   msg.subject,
    preview:   msg.preview,
    ...(withBody ? { body: msg.body } : {}),
    time:      fmtTime(msg.date),
    date:      msg.date,
    unread:    msg.unread,
    starred:   msg.starred,
    labels:    msg.labels,
  }
}

function makeImap(creds) {
  return new ImapFlow({
    host:   process.env.IMAP_HOST || 'localhost',
    port:   Number(process.env.IMAP_PORT) || 143,
    secure: process.env.IMAP_SECURE === 'true',
    auth:   { user: creds.user, pass: creds.pass },
    logger: false,
    tls:    { rejectUnauthorized: false },
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function listMessages(folderId, creds) {
  if (MOCK || !creds) {
    return MOCK_STORE
      .filter(m => m.folder === folderId)
      .map(m => normalise(m))
  }

  const mailbox = FOLDER_MAP[folderId] ?? folderId
  const client  = makeImap(creds)
  await client.connect()
  const lock = await client.getMailboxLock(mailbox)
  const out  = []
  try {
    for await (const msg of client.fetch('1:50', { uid: true, envelope: true, flags: true })) {
      const env = msg.envelope
      out.unshift({
        uid:       msg.uid,
        folder:    folderId,
        from:      env.from?.[0]?.name || env.from?.[0]?.address || '',
        fromEmail: env.from?.[0]?.address || '',
        subject:   env.subject || '(no subject)',
        preview:   '',
        time:      fmtTime(env.date),
        date:      env.date?.toISOString(),
        unread:    !msg.flags.has('\\Seen'),
        starred:   msg.flags.has('\\Flagged'),
        labels:    [],
      })
    }
  } finally {
    lock.release()
    await client.logout()
  }
  return out
}

export async function getMessage(folderId, uid, creds) {
  if (MOCK || !creds) {
    const m = MOCK_STORE.find(m => m.uid === Number(uid) && m.folder === folderId)
    return m ? normalise(m, true) : null
  }

  const mailbox = FOLDER_MAP[folderId] ?? folderId
  const client  = makeImap(creds)
  await client.connect()
  const lock = await client.getMailboxLock(mailbox)
  try {
    const msg = await client.fetchOne(String(uid), {
      uid: true, envelope: true, flags: true,
      bodyParts: ['text/html', 'text/plain'],
    }, { uid: true })
    if (!msg) return null
    const env  = msg.envelope
    const html = msg.bodyParts?.get('text/html')  || ''
    const text = msg.bodyParts?.get('text/plain') || ''
    return {
      uid:       msg.uid,
      folder:    folderId,
      from:      env.from?.[0]?.name || env.from?.[0]?.address || '',
      fromEmail: env.from?.[0]?.address || '',
      to:        env.to?.[0]?.name || env.to?.[0]?.address || '',
      toEmail:   env.to?.[0]?.address || '',
      subject:   env.subject || '(no subject)',
      preview:   text.slice(0, 120),
      body:      html || `<pre style="white-space:pre-wrap">${text}</pre>`,
      time:      fmtTime(env.date),
      date:      env.date?.toISOString(),
      unread:    !msg.flags.has('\\Seen'),
      starred:   msg.flags.has('\\Flagged'),
      labels:    [],
    }
  } finally {
    lock.release()
    await client.logout()
  }
}

export async function markRead(folderId, uid, read, creds) {
  if (MOCK || !creds) {
    const m = MOCK_STORE.find(m => m.uid === Number(uid))
    if (m) m.unread = !read
    return true
  }
  const client = makeImap(creds)
  await client.connect()
  const lock = await client.getMailboxLock(FOLDER_MAP[folderId] ?? folderId)
  try {
    const method = read ? 'messageFlagsAdd' : 'messageFlagsRemove'
    await client[method](String(uid), ['\\Seen'], { uid: true })
  } finally {
    lock.release()
    await client.logout()
  }
  return true
}

export async function deleteMessage(folderId, uid, creds) {
  if (MOCK || !creds) {
    const idx = MOCK_STORE.findIndex(m => m.uid === Number(uid) && m.folder === folderId)
    if (idx !== -1) MOCK_STORE.splice(idx, 1)
    return true
  }
  const client = makeImap(creds)
  await client.connect()
  const lock = await client.getMailboxLock(FOLDER_MAP[folderId] ?? folderId)
  try {
    await client.messageMove(String(uid), FOLDER_MAP.trash || 'Trash', { uid: true })
  } finally {
    lock.release()
    await client.logout()
  }
  return true
}

export async function sendMessage({ from, to, subject, body }, creds) {
  if (MOCK || !creds) {
    console.log('[mail:mock] send →', to, '|', subject)
    return { messageId: `mock-${Date.now()}@pfe2627.xyz` }
  }
  const transport = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'localhost',
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth:   { user: creds.user, pass: creds.pass },
    tls:    { rejectUnauthorized: false },
  })
  const info = await transport.sendMail({ from, to, subject, text: body, html: body })
  return { messageId: info.messageId }
}
