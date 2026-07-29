const BASE = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL || ''

async function req(path, opts = {}) {
  const token = localStorage.getItem('strata_cloud_token')
  const headers = { 'Content-Type': 'application/json', ...opts.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const r = await fetch(BASE + path, { ...opts, headers })
  let data = null
  try { data = await r.json() } catch {}
  if (r.status === 401 && !path.includes('/auth/')) {
    // session expired — bounce to landing
    localStorage.removeItem('strata_cloud_token')
    localStorage.removeItem('strata_cloud_user')
    window.dispatchEvent(new CustomEvent('strata-logout'))
  }
  if (!r.ok) throw new Error(data?.error || 'Request failed')
  return data
}

export const api = {
  stats:  () => req('/api/stats'),
  health: () => req('/api/health'),
}

export const authApi = {
  login:  (email, password) => req('/api/auth/login',  { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (name, email, password) => req('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  me:     () => req('/api/auth/me'),
}

export const resourcesApi = {
  list:   (kind) => req(`/api/resources${kind ? `?kind=${kind}` : ''}`),
  get:    (id)   => req(`/api/resources/${id}`),
  create: (data) => req('/api/resources', { method: 'POST', body: JSON.stringify(data) }),
  action: (id, action) => req(`/api/resources/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) }),
  update: (id, data)   => req(`/api/resources/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id)   => req(`/api/resources/${id}`, { method: 'DELETE' }),
}

export const dashboardApi = { get: () => req('/api/dashboard') }

export const billingApi = {
  get:           () => req('/api/billing'),
  setModel:      (model) => req('/api/billing/model', { method: 'PATCH', body: JSON.stringify({ model }) }),
  setLimits:     (spendCap, alertThreshold) => req('/api/billing/limits', { method: 'PATCH', body: JSON.stringify({ spendCap, alertThreshold }) }),
  addMethod:     (data) => req('/api/billing/methods', { method: 'POST', body: JSON.stringify(data) }),
  makeDefault:   (id) => req(`/api/billing/methods/${id}/default`, { method: 'PATCH' }),
  removeMethod:  (id) => req(`/api/billing/methods/${id}`, { method: 'DELETE' }),
}

export const accountApi = {
  get:           () => req('/api/account'),
  update:        (data) => req('/api/account', { method: 'PATCH', body: JSON.stringify(data) }),
  password:      (current, next) => req('/api/account/password', { method: 'POST', body: JSON.stringify({ current, next }) }),
  set2fa:        (enabled) => req('/api/account/2fa', { method: 'POST', body: JSON.stringify({ enabled }) }),
  sessions:      () => req('/api/account/sessions'),
  revokeSession: (id) => req(`/api/account/sessions/${id}`, { method: 'DELETE' }),
  activity:      () => req('/api/account/activity'),
  tokens:        () => req('/api/account/tokens'),
  createToken:   (name, scope) => req('/api/account/tokens', { method: 'POST', body: JSON.stringify({ name, scope }) }),
  revokeToken:   (id) => req(`/api/account/tokens/${id}`, { method: 'DELETE' }),
  sshKeys:       () => req('/api/account/ssh-keys'),
  addSshKey:     (name, public_key) => req('/api/account/ssh-keys', { method: 'POST', body: JSON.stringify({ name, public_key }) }),
  removeSshKey:  (id) => req(`/api/account/ssh-keys/${id}`, { method: 'DELETE' }),
}

// Logout — kills the server-side session
export const logoutApi = () => req('/api/auth/logout', { method: 'POST' }).catch(() => {})

// ── Toast bus ──────────────────────────────────────────────────────────────
export function toast(message, kind = 'info') {
  window.dispatchEvent(new CustomEvent('strata-toast', { detail: { message, kind, id: Date.now() + Math.random() } }))
}
