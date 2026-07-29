import React from 'react'
import { I } from '../components/icons.jsx'
import { Card, Pill, Avatar, SectionHeader, TabBar } from '../components/ui.jsx'
import { StrataLogo } from '../components/brand.jsx'
import { authHeader } from '../api/auth.js'

const BASE = import.meta.env.VITE_API_URL || ''

async function apiReq(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...opts.headers },
    ...opts,
  })
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || `HTTP ${res.status}`) }
  return res.json()
}

const DEPTS = ['it', 'hr', 'biz']
const ROLES       = ['employee', 'it_admin', 'superadmin']
const ROLE_LABELS = { employee: 'Employee', it_admin: 'IT Admin', superadmin: 'Super Admin' }
const DEPT_LABELS = { it: 'IT', hr: 'HR', biz: 'BizOps' }
const ROLE_TONES  = { superadmin: 'bad', it_admin: 'info', employee: undefined }

export function AdminPanel({ user, onBack }) {
  const [tab,          setTab]          = React.useState('users')
  const [users,        setUsers]        = React.useState([])
  const [loading,      setLoading]      = React.useState(true)
  const [userFilter,   setUserFilter]   = React.useState('active')
  const [modal,        setModal]        = React.useState(null)
  const [auditLogs,    setAuditLogs]    = React.useState([])
  const [auditLoad,    setAuditLoad]    = React.useState(false)
  const [showArchived, setShowArchived] = React.useState(false)
  const [archiving,    setArchiving]    = React.useState(false)
  const [redoing,      setRedoing]      = React.useState({})

  React.useEffect(() => {
    apiReq('/api/users')
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function loadAudit(archived = showArchived) {
    setAuditLoad(true)
    apiReq(`/api/audit${archived ? '?archived=1' : ''}`)
      .then(setAuditLogs)
      .catch(() => {})
      .finally(() => setAuditLoad(false))
  }

  React.useEffect(() => { loadAudit() }, [])

  function handleRedo(entry) {
    setRedoing(r => ({ ...r, [entry.id]: true }))
    apiReq(`/api/audit/${entry.id}/redo`, { method: 'POST' })
      .then(() => loadAudit())
      .catch(() => loadAudit())
      .finally(() => setRedoing(r => { const n = { ...r }; delete n[entry.id]; return n }))
  }

  function handleArchiveEntry(entry) {
    apiReq(`/api/audit/${entry.id}/archive`, { method: 'POST' })
      .then(() => {
        if (showArchived) {
          setAuditLogs(prev => prev.map(e => e.id === entry.id ? { ...e, archived: 1 } : e))
        } else {
          setAuditLogs(prev => prev.filter(e => e.id !== entry.id))
        }
      })
      .catch(err => console.error('archive entry failed:', err.message))
  }

  function handleArchiveLogs() {
    setArchiving(true)
    apiReq('/api/audit/archive', { method: 'POST' })
      .then(() => { setShowArchived(false); loadAudit(false) })
      .catch(() => {})
      .finally(() => setArchiving(false))
  }

  function toggleShowArchived() {
    const next = !showArchived
    setShowArchived(next)
    loadAudit(next)
  }

  function handleToggleActive(u) {
    apiReq(`/api/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ active: u.active ? 0 : 1 }) })
      .then(updated => setUsers(prev => prev.map(x => x.id === updated.id ? updated : x)))
  }

  function handleDeleteUser(u) {
    if (!window.confirm(`Remove ${u.name} (${u.username})? This cannot be undone.`)) return
    apiReq(`/api/users/${u.id}`, { method: 'DELETE' })
      .then(() => setUsers(prev => prev.filter(x => x.id !== u.id)))
  }

  function handleSave(data) {
    const isEdit = !!data.id
    const path   = isEdit ? `/api/users/${data.id}` : '/api/users'
    apiReq(path, { method: isEdit ? 'PATCH' : 'POST', body: JSON.stringify(data) })
      .then(saved => {
        setUsers(prev => isEdit ? prev.map(x => x.id === saved.id ? saved : x) : [...prev, saved])
        setModal(null)
      })
      .catch(err => alert(err.message))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{
        height: 52, flex: '0 0 auto', display: 'flex', alignItems: 'center',
        padding: '0 22px', gap: 16,
        borderBottom: '0.5px solid var(--hairline)',
        background: 'color-mix(in oklab, var(--bg-1) 60%, transparent)',
        WebkitBackdropFilter: 'blur(28px)', backdropFilter: 'blur(28px)',
      }}>
        <button className="btn ghost" onClick={onBack} style={{ gap: 6 }}>
          <I.arrowR size={14} style={{ transform: 'rotate(180deg)' }}/>
          Back to Portal
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <StrataLogo size={20} variant="stack"/>
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Admin Panel</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={user.name} size={28}/>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{user.name}</span>
        </div>
      </header>

      <div style={{ flex: 1, padding: '28px 32px 60px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        <SectionHeader
          title="Admin Panel"
          subtitle="Manage portal users, roles and access."
          breadcrumbs={['STRATA', 'Admin']}
          actions={
            tab === 'users' && (
              <button className="btn primary" onClick={() => setModal('create')}>
                <I.plus size={14}/>New User
              </button>
            )
          }
        />

        <TabBar
          tabs={[{ id: 'users', label: 'Users' }, { id: 'audit', label: 'Audit Logs' }]}
          active={tab} onChange={setTab}
        />

        <div style={{ marginTop: 20 }}>
          {tab === 'users' && (() => {
            const filtered = users
            return (
            <Card padding={0}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>Loading…</div>
              ) : (
                <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
                <table className="tbl" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Username</th>
                      <th>Dept</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-mute)', padding: 32 }}>No users here.</td></tr>
                    )}
                    {filtered.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={u.name} size={30}/>
                            <span style={{ fontWeight: 500 }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-dim)', fontFamily: 'var(--f-mono)', fontSize: 12 }}>{u.username}</td>
                        <td><Pill>{DEPT_LABELS[u.dept ?? u.department] ?? (u.dept ?? u.department)}</Pill></td>
                        <td><Pill tone={ROLE_TONES[u.role]}>{ROLE_LABELS[u.role] ?? u.role}</Pill></td>
                        <td>
                          <Pill tone={u.active ? 'good' : undefined}>
                            <span className="dot"/>
                            {u.active ? 'Active' : 'Disabled'}
                          </Pill>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn ghost" style={{ height: 28, padding: '0 10px', fontSize: 12 }}
                              onClick={() => setModal(u)}>
                              <I.cog size={13}/>Edit
                            </button>
                            <button
                              className="btn ghost" style={{ height: 28, padding: '0 10px', fontSize: 12, color: 'var(--bad)' }}
                              onClick={() => handleDeleteUser(u)}
                              disabled={u.id === user.id}
                            >
                              <I.x size={13}/>Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </Card>
          )})()}

          {tab === 'audit' && (
            <Card padding={0}>
              <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Audit Logs</span>
                <span style={{ fontSize: 11, color: 'var(--text-mute)' }}>{auditLogs.length} entries</span>
                <div style={{ flex: 1 }}/>
                <button
                  className="btn ghost" style={{ height: 26, padding: '0 10px', fontSize: 12,
                    color: showArchived ? 'var(--accent)' : 'var(--text-dim)',
                    borderColor: showArchived ? 'color-mix(in oklab, var(--accent) 40%, transparent)' : undefined }}
                  onClick={toggleShowArchived}
                >
                  <I.archive size={12}/>{showArchived ? 'Hide archived' : 'Show archived'}
                </button>
                <button
                  className="btn ghost" style={{ height: 26, padding: '0 10px', fontSize: 12, color: 'var(--warn)' }}
                  onClick={handleArchiveLogs} disabled={archiving || auditLogs.filter(e => !e.archived).length === 0}
                >
                  <I.archive size={12}/>{archiving ? 'Archiving…' : 'Archive logs'}
                </button>
                <button className="btn ghost" style={{ height: 26, padding: '0 10px', fontSize: 12 }} onClick={() => loadAudit()} disabled={auditLoad}>
                  <I.refresh size={12}/>{auditLoad ? '…' : 'Refresh'}
                </button>
              </div>
              <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                {auditLogs.length === 0 && !auditLoad && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>No audit entries yet.</div>
                )}
                {auditLogs.map(entry => {
                  const isProvisionError = entry.action === 'dovecot_provision'      && entry.status === 'error'
                  const isRedoError      = entry.action === 'dovecot_provision_redo' && entry.status === 'error'
                  const showRedo         = (isProvisionError || isRedoError) && !entry.archived
                  const tone = entry.status === 'ok' ? 'good' : entry.status === 'resolved' ? 'info' : 'bad'
                  return (
                    <div key={entry.id} style={{
                      padding: '12px 16px', borderBottom: '0.5px solid var(--hairline)',
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      opacity: entry.archived ? 0.5 : 1,
                      background: !entry.archived && (isProvisionError || isRedoError)
                        ? 'color-mix(in oklab, var(--bad) 6%, transparent)' : 'transparent',
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', marginTop: 5, flex: '0 0 auto',
                        background: `var(--${tone})`,
                        boxShadow: `0 0 8px var(--${tone})`,
                      }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--f-mono)', color: 'var(--text)' }}>
                            {entry.action}
                          </span>
                          {entry.target && (
                            <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--f-mono)' }}>
                              → {entry.target}
                            </span>
                          )}
                          <Pill tone={tone} style={{ height: 16, padding: '0 7px', fontSize: 10 }}>
                            {entry.status}
                          </Pill>
                        </div>
                        {entry.message && (
                          <div style={{ fontSize: 11.5, color: 'var(--bad)', marginTop: 4, fontFamily: 'var(--f-mono)', wordBreak: 'break-all' }}>
                            {entry.message}
                          </div>
                        )}
                        <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 4 }}>
                          {new Date(entry.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
                        {showRedo && (
                          <button
                            className="btn"
                            style={{ height: 28, padding: '0 12px', fontSize: 12,
                              color: 'var(--warn)', borderColor: 'color-mix(in oklab, var(--warn) 30%, transparent)',
                              background: 'color-mix(in oklab, var(--warn) 10%, transparent)' }}
                            onClick={() => handleRedo(entry)}
                            disabled={!!redoing[entry.id]}
                          >
                            {redoing[entry.id] ? 'Retrying…' : '↻ Redo'}
                          </button>
                        )}
                        {!entry.archived && (
                          <button
                            className="btn ghost icon"
                            style={{ width: 28, height: 28, color: 'var(--text-mute)' }}
                            onClick={() => handleArchiveEntry(entry)}
                            title="Archive this entry"
                          >
                            <I.archive size={13}/>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {modal && (
        <UserModal
          initial={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function UserModal({ initial, onSave, onClose }) {
  const isEdit    = !!initial
  const nameParts = (initial?.name ?? '').split(' ')
  const [firstName, setFirstName] = React.useState(nameParts[0] ?? '')
  const [lastName,  setLastName]  = React.useState(nameParts.slice(1).join(' ') ?? '')
  const [username,  setUsername]  = React.useState(initial?.username ?? '')
  const [pass,      setPass]      = React.useState('')
  const [dept,      setDept]      = React.useState(initial?.dept ?? initial?.department ?? 'it')
  const [role,      setRole]      = React.useState(initial?.role ?? 'employee')

  function handleSubmit(e) {
    e.preventDefault()
    const payload = { firstName, lastName, username, department: dept, role }
    if (isEdit) { payload.id = initial.id; if (pass) payload.password = pass }
    else        { payload.password = pass }
    onSave(payload)
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(7, 9, 15, 0.6)',
      WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit} style={{
        width: 420, padding: '28px 28px 24px',
        background: 'var(--bg-2)', border: '0.5px solid var(--hairline-2)',
        borderRadius: 18, boxShadow: 'var(--shadow-pop)',
        display: 'flex', flexDirection: 'column', gap: 16,
      }} className="fadein">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{isEdit ? 'Edit User' : 'New User'}</span>
          <button type="button" className="btn ghost icon" onClick={onClose}><I.x size={15}/></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="First Name">
            <input className="input" style={{ width: '100%' }} value={firstName} onChange={e => setFirstName(e.target.value)} required/>
          </Field>
          <Field label="Last Name">
            <input className="input" style={{ width: '100%' }} value={lastName} onChange={e => setLastName(e.target.value)} required/>
          </Field>
        </div>

        <Field label="Username">
          <input className="input" style={{ width: '100%' }} value={username}
            onChange={e => setUsername(e.target.value.toLowerCase().replace(/[@\s]/g,''))}
            required disabled={isEdit}/>
        </Field>

        <Field label="Password">
          <input className="input" style={{ width: '100%' }} type="password" value={pass}
            onChange={e => setPass(e.target.value)} required={!isEdit} autoComplete="new-password"/>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Department">
            <select className="input" style={{ width: '100%' }} value={dept} onChange={e => setDept(e.target.value)}>
              {DEPTS.map(d => <option key={d} value={d}>{DEPT_LABELS[d]}</option>)}
            </select>
          </Field>
          <Field label="Role">
            <select className="input" style={{ width: '100%' }} value={role} onChange={e => setRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary">{isEdit ? 'Save changes' : 'Create user'}</button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}
