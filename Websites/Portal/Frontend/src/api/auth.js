const BASE = import.meta.env.VITE_API_URL || ''

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

function getToken() { return localStorage.getItem('strata_token') }

export const authApi = {
  login: (email, password) =>
    req('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      .then(data => {
        localStorage.setItem('strata_token', data.token)
        localStorage.setItem('strata_user', JSON.stringify(data.user))
        return data
      }),

  logout: () => {
    const token = getToken()
    localStorage.removeItem('strata_token')
    localStorage.removeItem('strata_user')
    if (token) req('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
  },

  me: () =>
    req('/api/auth/me', { headers: { Authorization: `Bearer ${getToken()}` } }),

  token: getToken,
}

export function authHeader() {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}
