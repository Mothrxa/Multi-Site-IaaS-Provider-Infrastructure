import { authHeader } from './auth.js'  // eslint-disable-line import/no-duplicates

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...opts.headers },
    ...opts,
  })
  if (!res.ok) {
    const b = await res.json().catch(() => ({}))
    throw new Error(b.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const announcementsApi = {
  list:   ()              => req('/api/announcements'),
  create: (data)          => req('/api/announcements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data)      => req(`/api/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id)            => req(`/api/announcements/${id}`, { method: 'DELETE' }),
  react:  (id, emoji)     => req(`/api/announcements/${id}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }),
}

export const helpdeskApi = {
  list:       ()              => req('/api/helpdesk/tickets'),
  get:        (id)            => req(`/api/helpdesk/tickets/${id}`),
  submit:     (data)          => req('/api/helpdesk/tickets', { method: 'POST', body: JSON.stringify(data) }),
  update:     (id, data)      => req(`/api/helpdesk/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  reply:      (id, body)      => req(`/api/helpdesk/tickets/${id}/replies`, { method: 'POST', body: JSON.stringify({ body }) }),
}

export const selfServiceApi = {
  listLeave:      ()         => req('/api/self-service/leave'),
  leaveBalance:   ()         => req('/api/self-service/leave/balance'),
  submitLeave:    (data)     => req('/api/self-service/leave', { method: 'POST', body: JSON.stringify(data) }),
  updateLeave:    (id, data) => req(`/api/self-service/leave/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  listPayslips:   ()         => req('/api/self-service/payslips'),
  createPayslip:  (data)     => req('/api/self-service/payslips', { method: 'POST', body: JSON.stringify(data) }),

  getProfile:     ()         => req('/api/self-service/profile'),
  updateProfile:  (data)     => req('/api/self-service/profile', { method: 'PUT', body: JSON.stringify(data) }),

  listExpenses:   ()         => req('/api/self-service/expenses'),
  submitExpense:  (data)     => req('/api/self-service/expenses', { method: 'POST', body: JSON.stringify(data) }),

  listReferrals:  ()         => req('/api/self-service/referrals'),
  submitReferral: (data)     => req('/api/self-service/referrals', { method: 'POST', body: JSON.stringify(data) }),

  downloadFile: async (path, filename) => {
    const res = await fetch(`${BASE}${path}`, { headers: authHeader() })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b.error || `HTTP ${res.status}`)
    }
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  },
}

export const hrApi = {
  stats:                 ()              => req('/api/hr/stats'),
  employees:             ()              => req('/api/hr/employees'),
  referrals:             ()              => req('/api/hr/referrals'),
  payroll:               ()              => req('/api/hr/payroll'),
  approveLeave:          (id)            => req(`/api/self-service/leave/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'approved' }) }),
  rejectLeave:           (id)            => req(`/api/self-service/leave/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'rejected' }) }),
  createEmployee:        (data)          => req('/api/hr/employees', { method: 'POST', body: JSON.stringify(data) }),
  openRoles:             ()              => req('/api/hr/open-roles'),
  createRole:            (data)          => req('/api/hr/open-roles', { method: 'POST', body: JSON.stringify(data) }),
  updateRole:            (id, data)      => req(`/api/hr/open-roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateReferral:        (id, status)    => req(`/api/hr/referrals/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  runPayroll:            (period)        => req('/api/hr/payroll/run', { method: 'POST', body: JSON.stringify({ period }) }),
  updateSlip:            (id, data)      => req(`/api/hr/payroll/slips/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  exportPayroll:         (period)        => `${BASE}/api/hr/payroll/export${period ? '?period=' + encodeURIComponent(period) : ''}`,
  // Expense claims
  expenses:              ()              => req('/api/hr/expenses'),
  updateExpense:         (id, status)    => req(`/api/hr/expenses/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  // Employee profile (HR can view/edit any employee's profile)
  getEmployeeProfile:    (id)            => req(`/api/hr/employees/${id}/profile`),
  updateEmployeeProfile: (id, data)      => req(`/api/hr/employees/${id}/profile`, { method: 'PUT', body: JSON.stringify(data) }),

  uploadDocument:   (formData)  => documentsApi.upload(formData),
  downloadDocument: (id, name)  => documentsApi.download(id, name),
}

async function _downloadDoc(id, name) {
  const res = await fetch(`${BASE}/api/documents/${id}/download`, { headers: authHeader() })
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || `HTTP ${res.status}`) }
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}

export const documentsApi = {
  list:     (archived = false) => req(`/api/documents${archived ? '?archived=1' : ''}`),
  upload:   (formData)         => fetch(`${BASE}/api/documents/upload`, { method: 'POST', headers: authHeader(), body: formData })
                                    .then(r => r.ok ? r.json() : r.json().then(b => Promise.reject(new Error(b.error || `HTTP ${r.status}`)))),
  update:   (id, data)         => req(`/api/documents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  archive:  (id, archived = true) => req(`/api/documents/${id}/archive`, { method: 'PATCH', body: JSON.stringify({ archived }) }),
  delete:   (id)               => req(`/api/documents/${id}`, { method: 'DELETE' }),
  download: (id, name)         => _downloadDoc(id, name),
}
