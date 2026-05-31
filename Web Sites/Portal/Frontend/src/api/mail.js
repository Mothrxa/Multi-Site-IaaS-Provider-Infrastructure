const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export const mailApi = {
  list:     (folder)              => req(`/api/mail/messages?folder=${folder}`),
  get:      (uid, folder)         => req(`/api/mail/messages/${uid}?folder=${folder}`),
  send:     (to, subject, body)   => req('/api/mail/send', { method: 'POST', body: JSON.stringify({ to, subject, body }) }),
  markRead: (uid, folder, read)   => req(`/api/mail/messages/${uid}/read`, { method: 'PATCH', body: JSON.stringify({ folder, read }) }),
  delete:   (uid, folder)         => req(`/api/mail/messages/${uid}?folder=${folder}`, { method: 'DELETE' }),
}
