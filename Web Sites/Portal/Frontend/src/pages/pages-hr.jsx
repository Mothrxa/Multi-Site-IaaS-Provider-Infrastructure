import React from 'react'
import { I } from '../components/icons.jsx'
import { Card, Stat, Pill, SectionHeader, Avatar, Progress, TabBar } from '../components/ui.jsx'
import { BarChart, Donut } from '../components/charts.jsx'
import { hrApi, selfServiceApi, documentsApi } from '../api/index.js'

const DEPT_LABELS = { it: 'IT', hr: 'HR', biz: 'BizOps' }
const LEAVE_TONE  = { pending: 'warn', approved: 'good', rejected: 'bad', cancelled: undefined }
const ROLE_LABELS = { employee: 'Employee', it_admin: 'IT Admin', superadmin: 'Super Admin' }

// ── Shared modal shell ────────────────────────────────────────────────────────

function Modal({ title, onClose, children, width = 500 }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(7,9,15,0.6)', WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="fadein">
      <div onClick={e => e.stopPropagation()} style={{ width, background: 'var(--bg-2)', border: '0.5px solid var(--hairline-2)', borderRadius: 18, boxShadow: 'var(--shadow-pop)', padding: 26, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
          <button className="btn ghost icon" onClick={onClose}><I.x size={15}/></button>
        </div>
        {children}
      </div>
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

function Actions({ onSubmit, onCancel, submitting, disabled, label = 'Save' }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
      <button className="btn" onClick={onCancel}>Cancel</button>
      <button className="btn primary" onClick={onSubmit} disabled={submitting || disabled}>
        {submitting ? 'Saving…' : label}
      </button>
    </div>
  )
}

// ── New Employee modal (shared by Overview + Directory) ───────────────────────

function NewEmployeeModal({ onClose, onCreated }) {
  const [form,       setForm]       = React.useState({ name: '', email: '', password: '', department: 'hr', role: 'employee' })
  const [submitting, setSubmitting] = React.useState(false)
  const [error,      setError]      = React.useState('')

  function handleSubmit() {
    if (!form.name || !form.email || !form.password) return
    setSubmitting(true); setError('')
    hrApi.createEmployee(form)
      .then(u => { onCreated(u); onClose() })
      .catch(err => { setError(err.message); setSubmitting(false) })
  }

  return (
    <Modal title="New Employee" onClose={onClose}>
      <Field label="Full name"><input className="input" style={{ width: '100%' }} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus/></Field>
      <Field label="Email"><input className="input" type="email" style={{ width: '100%' }} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}/></Field>
      <Field label="Temporary password"><input className="input" type="password" style={{ width: '100%' }} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}/></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Department">
          <select className="input" style={{ width: '100%' }} value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
            <option value="it">IT</option><option value="hr">HR</option><option value="biz">BizOps</option>
          </select>
        </Field>
        <Field label="Role">
          <select className="input" style={{ width: '100%' }} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="employee">Employee</option><option value="it_admin">IT Admin</option><option value="superadmin">Super Admin</option>
          </select>
        </Field>
      </div>
      {error && <div style={{ fontSize: 12, color: 'var(--bad)', padding: '8px 12px', background: 'color-mix(in oklab, var(--bad) 12%, transparent)', borderRadius: 8 }}>{error}</div>}
      <Actions onSubmit={handleSubmit} onCancel={onClose} submitting={submitting} disabled={!form.name || !form.email || !form.password} label="Create employee"/>
    </Modal>
  )
}

// ── Overview ─────────────────────────────────────────────────────────────────

function HROverview({ goto }) {
  const [stats, setStats] = React.useState(null)

  React.useEffect(() => { hrApi.stats().then(setStats).catch(() => {}) }, [])

  function handleLeaveAction(id, action) {
    const fn = action === 'approved' ? hrApi.approveLeave : hrApi.rejectLeave
    fn(id).then(() => hrApi.stats().then(setStats))
  }

  const pending = stats?.pending_list ?? []
  const byDept  = stats?.by_dept     ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionHeader title="People Operations" subtitle="Headcount, recruiting and pending requests."
        breadcrumbs={['HR Workspace', 'Overview']}
        />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--gap-grid)' }}>
        <Card><Stat label="Headcount"     value={stats?.headcount     ?? '…'}/></Card>
        <Card><Stat label="Departments"   value={byDept.length        || '…'}/></Card>
        <Card><Stat label="Pending leave" value={stats?.pending_leave ?? '…'} deltaTone="warn"/></Card>
        <Card><Stat label="Portal users"  value={stats?.headcount     ?? '…'} hint="active accounts"/></Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--gap-grid)' }}>
        <Card title="Headcount by department" subtitle={`Total: ${stats?.headcount ?? '…'} employees`}>
          {byDept.length > 0
            ? <BarChart data={byDept.map(d => ({ label: DEPT_LABELS[d.department] ?? d.department, value: d.n }))} height={200}/>
            : <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>Loading…</div>}
        </Card>

        <Card title="Pending leave requests" subtitle="Awaiting approval"
          action={<button className="btn ghost" style={{ height: 26, padding: '0 10px', fontSize: 11 }} onClick={() => goto('leave')}>View all</button>}>
          {pending.length === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-mute)', fontSize: 12 }}>No pending requests.</div>
            : pending.map((l, i) => (
              <div key={l.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: i ? '0.5px solid var(--hairline)' : 'none', alignItems: 'center' }}>
                <Avatar name={l.employee_name} size={28}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.employee_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{l.type} · {l.start_date} → {l.end_date}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn ghost icon" style={{ width: 26, height: 26, color: 'var(--good)' }} onClick={() => handleLeaveAction(l.id, 'approved')}><I.check size={13}/></button>
                  <button className="btn ghost icon" style={{ width: 26, height: 26, color: 'var(--bad)'  }} onClick={() => handleLeaveAction(l.id, 'rejected')}><I.x size={13}/></button>
                </div>
              </div>
            ))}
        </Card>
      </div>

    </div>
  )
}

// ── Directory ─────────────────────────────────────────────────────────────────

function HRDirectory({ onOpenShared, onComposeMailTo }) {
  const [employees, setEmployees] = React.useState([])
  const [search,    setSearch]    = React.useState('')
  const [modal,     setModal]     = React.useState(null) // null | 'new' | employee object

  React.useEffect(() => { hrApi.employees().then(setEmployees).catch(() => {}) }, [])

  const filtered = search
    ? employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase()))
    : employees

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionHeader title="Employee Directory"
        subtitle={`${employees.length} employees · ${new Set(employees.map(e => e.department)).size} departments`}
        breadcrumbs={['HR Workspace', 'People', 'Directory']}
        actions={<>
          <input className="input" placeholder="Search name" style={{ width: 240 }} value={search} onChange={e => setSearch(e.target.value)}/>
          <button className="btn primary" onClick={() => setModal('new')}><I.plus size={14}/>Add Employee</button>
        </>}/>

      {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>No employees found.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--gap-grid)' }}>
        {filtered.map(p => (
          <Card key={p.id} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Avatar name={p.name} size={48}/>
              <Pill style={{ height: 22 }}>{DEPT_LABELS[p.department] ?? p.department}</Pill>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{ROLE_LABELS[p.role] ?? p.role}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-dim)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Email</span>
                <span style={{ color: 'var(--text)', fontFamily: 'var(--f-mono)', fontSize: 11 }}>{p.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Joined</span>
                <span style={{ color: 'var(--text)' }}>{new Date(p.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}</span>
              </div>
              {p.phone && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Phone</span><span style={{ color: 'var(--text)' }}>{p.phone}</span></div>}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button className="btn ghost" style={{ flex: 1, height: 28, fontSize: 11 }} onClick={() => onComposeMailTo?.(p.email)}>
                <I.envelope size={12}/>Mail
              </button>
              <button className="btn ghost" style={{ flex: 1, height: 28, fontSize: 11 }} onClick={() => setModal(p)}>
                <I.user size={12}/>Profile
              </button>
            </div>
          </Card>
        ))}
      </div>

      {modal === 'new' && (
        <NewEmployeeModal onClose={() => setModal(null)} onCreated={u => { setEmployees(prev => [...prev, u]); setModal(null) }}/>
      )}
      {modal && modal !== 'new' && (
        <ProfileModal employee={modal} onClose={() => setModal(null)}/>
      )}
    </div>
  )
}

function ProfileModal({ employee, onClose }) {
  const [form,       setForm]       = React.useState({ phone: '', address: '', emergency_name: '', emergency_phone: '', iban: '', personal_email: '' })
  const [loading,    setLoading]    = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [saved,      setSaved]      = React.useState(false)

  // Fetch THIS employee's profile (not the current HR user's)
  React.useEffect(() => {
    hrApi.getEmployeeProfile(employee.id)
      .then(d => { if (d.profile) setForm(f => ({ ...f, ...d.profile })); setLoading(false) })
      .catch(() => setLoading(false))
  }, [employee.id])

  function handleSave() {
    setSubmitting(true)
    hrApi.updateEmployeeProfile(employee.id, form)
      .then(() => { setSaved(true); setTimeout(() => { setSaved(false); onClose() }, 1000) })
      .catch(() => setSubmitting(false))
      .finally(() => setSubmitting(false))
  }

  return (
    <Modal title={`${employee.name} — Profile`} onClose={onClose} width={540}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 0 12px' }}>
        <Avatar name={employee.name} size={52}/>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{employee.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{DEPT_LABELS[employee.department]} · {ROLE_LABELS[employee.role] ?? employee.role}</div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', fontFamily: 'var(--f-mono)', marginTop: 2 }}>{employee.email}</div>
        </div>
      </div>
      {loading ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>Loading…</div> : (<>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Phone"><input className="input" style={{ width: '100%' }} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+213 …"/></Field>
          <Field label="Personal email"><input className="input" type="email" style={{ width: '100%' }} value={form.personal_email} onChange={e => setForm(f => ({ ...f, personal_email: e.target.value }))}/></Field>
        </div>
        <Field label="Address"><textarea className="input" style={{ width: '100%', height: 60, resize: 'none', padding: '8px 12px' }} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}/></Field>
        <Field label="IBAN"><input className="input" style={{ width: '100%', fontFamily: 'var(--f-mono)', fontSize: 12 }} value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} placeholder="DZ…"/></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Emergency contact name"><input className="input" style={{ width: '100%' }} value={form.emergency_name} onChange={e => setForm(f => ({ ...f, emergency_name: e.target.value }))}/></Field>
          <Field label="Emergency phone"><input className="input" style={{ width: '100%' }} value={form.emergency_phone} onChange={e => setForm(f => ({ ...f, emergency_phone: e.target.value }))}/></Field>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="btn" onClick={onClose}>Close</button>
          <button className="btn primary" onClick={handleSave} disabled={submitting}>
            {saved ? '✓ Saved' : submitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </>)}
    </Modal>
  )
}

// ── Recruitment ───────────────────────────────────────────────────────────────

function HRRecruitment({ onOpenShared }) {
  const [referrals,  setReferrals]  = React.useState([])
  const [openRoles,  setOpenRoles]  = React.useState([])
  const [showModal,  setShowModal]  = React.useState(false)
  const [roleForm,   setRoleForm]   = React.useState({ title: '', team: '', type: 'Full-time' })
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    hrApi.referrals().then(setReferrals).catch(() => {})
    hrApi.openRoles().then(setOpenRoles).catch(() => {})
  }, [])

  function handleCreateRole() {
    if (!roleForm.title || !roleForm.team) return
    setSubmitting(true)
    hrApi.createRole(roleForm)
      .then(r => { setOpenRoles(prev => [r, ...prev]); setShowModal(false); setRoleForm({ title: '', team: '', type: 'Full-time' }) })
      .catch(() => {})
      .finally(() => setSubmitting(false))
  }

  function handleRoleStatus(id, status) {
    hrApi.updateRole(id, { status })
      .then(r => setOpenRoles(prev => prev.map(x => x.id === id ? r : x)))
  }

  function handleReferralStatus(id, status) {
    hrApi.updateReferral(id, status)
      .then(r => setReferrals(prev => prev.map(x => x.id === id ? { ...x, ...r } : x)))
  }

  const STAGE_TONE   = { submitted: 'info', reviewing: 'warn', hired: 'good', rejected: 'bad' }
  const ROLE_STATUS  = { open: 'good', on_hold: 'warn', closed: undefined }
  const stageCounts  = ['submitted', 'reviewing', 'hired', 'rejected'].map(s => ({ stage: s.charAt(0).toUpperCase() + s.slice(1), n: referrals.filter(r => r.status === s).length }))
  const maxStage     = Math.max(...stageCounts.map(s => s.n), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionHeader title="Recruitment" subtitle="Open positions and referral pipeline."
        breadcrumbs={['HR Workspace', 'People', 'Recruitment']}
        actions={<button className="btn primary" onClick={() => setShowModal(true)}><I.plus size={14}/>Open role</button>}/>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--gap-grid)' }}>
        <Card><Stat label="Open roles"    value={openRoles.filter(r => r.status === 'open').length}/></Card>
        <Card><Stat label="Total referrals" value={referrals.length}/></Card>
        <Card><Stat label="Under review"  value={referrals.filter(r => r.status === 'reviewing').length}/></Card>
        <Card><Stat label="Hired"         value={referrals.filter(r => r.status === 'hired').length} deltaTone="good"/></Card>
      </div>

      {openRoles.length > 0 && (
        <Card title="Open roles" subtitle="Click status to update">
          <table className="tbl">
            <thead><tr><th>Role</th><th>Team</th><th>Type</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
            <tbody>
              {openRoles.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.title}</td>
                  <td style={{ color: 'var(--text-dim)' }}>{r.team}</td>
                  <td><Pill>{r.type}</Pill></td>
                  <td><Pill tone={ROLE_STATUS[r.status]}>{r.status}</Pill></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      {r.status === 'open' && <button className="btn ghost" style={{ height: 26, padding: '0 10px', fontSize: 11 }} onClick={() => handleRoleStatus(r.id, 'on_hold')}>Hold</button>}
                      {r.status !== 'closed' && <button className="btn ghost" style={{ height: 26, padding: '0 10px', fontSize: 11, color: 'var(--bad)' }} onClick={() => handleRoleStatus(r.id, 'closed')}>Close</button>}
                      {r.status !== 'open'   && <button className="btn ghost" style={{ height: 26, padding: '0 10px', fontSize: 11, color: 'var(--good)' }} onClick={() => handleRoleStatus(r.id, 'open')}>Reopen</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--gap-grid)' }}>
        <Card title="Referral pipeline" subtitle="Submitted via HR Self-Service">
          {referrals.length === 0
            ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>No referrals yet.</div>
            : (
              <table className="tbl">
                <thead><tr><th>Candidate</th><th>Role</th><th>Referred by</th><th>Status</th><th style={{ textAlign: 'right' }}>Move to</th></tr></thead>
                <tbody>
                  {referrals.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{r.candidate_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-mute)', fontFamily: 'var(--f-mono)' }}>{r.candidate_email}</div>
                      </td>
                      <td style={{ color: 'var(--text-dim)' }}>{r.role_applied}</td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={r.referrer_name} size={22}/><span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{r.referrer_name}</span></div></td>
                      <td><Pill tone={STAGE_TONE[r.status]}>{r.status}</Pill></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {r.status !== 'reviewing' && <button className="btn ghost" style={{ height: 24, padding: '0 8px', fontSize: 11 }} onClick={() => handleReferralStatus(r.id, 'reviewing')}>Review</button>}
                          {r.status !== 'hired'     && <button className="btn ghost" style={{ height: 24, padding: '0 8px', fontSize: 11, color: 'var(--good)' }} onClick={() => handleReferralStatus(r.id, 'hired')}>Hire</button>}
                          {r.status !== 'rejected'  && <button className="btn ghost" style={{ height: 24, padding: '0 8px', fontSize: 11, color: 'var(--bad)'  }} onClick={() => handleReferralStatus(r.id, 'rejected')}>Reject</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </Card>
        <Card title="Pipeline funnel">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
            {stageCounts.map(s => (
              <div key={s.stage} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ width: 80, fontSize: 12, color: 'var(--text-dim)' }}>{s.stage}</span>
                <Progress value={s.n} max={maxStage} tone="accent"/>
                <span className="mono" style={{ fontSize: 11, width: 20, textAlign: 'right' }}>{s.n}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {showModal && (
        <Modal title="Open new role" onClose={() => setShowModal(false)}>
          <Field label="Job title"><input className="input" style={{ width: '100%' }} value={roleForm.title} onChange={e => setRoleForm(f => ({ ...f, title: e.target.value }))} autoFocus placeholder="e.g. Senior Backend Engineer"/></Field>
          <Field label="Team"><input className="input" style={{ width: '100%' }} value={roleForm.team} onChange={e => setRoleForm(f => ({ ...f, team: e.target.value }))} placeholder="e.g. Engineering"/></Field>
          <Field label="Type">
            <select className="input" style={{ width: '100%' }} value={roleForm.type} onChange={e => setRoleForm(f => ({ ...f, type: e.target.value }))}>
              <option>Full-time</option><option>Part-time</option><option>Internship</option><option>Contract</option>
            </select>
          </Field>
          <Actions onSubmit={handleCreateRole} onCancel={() => setShowModal(false)} submitting={submitting} disabled={!roleForm.title || !roleForm.team} label="Open role"/>
        </Modal>
      )}
    </div>
  )
}

// ── Leave ─────────────────────────────────────────────────────────────────────

function HRLeave({ goto }) {
  const [requests, setRequests] = React.useState([])

  React.useEffect(() => { selfServiceApi.listLeave().then(setRequests).catch(() => {}) }, [])

  function handleAction(id, status) {
    const fn = status === 'approved' ? hrApi.approveLeave : hrApi.rejectLeave
    fn(id).then(updated => setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r)))
  }

  const pending  = requests.filter(r => r.status === 'pending').length
  const approved = requests.filter(r => r.status === 'approved').length

  // ── dynamic calendar: current month ──
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName   = now.toLocaleString([], { month: 'long', year: 'numeric' })

  // employees who have leave requests this month
  const calEmployees = [...new Map(requests.map(r => [r.employee_id, r])).values()]
    .map(r => ({ id: r.employee_id, name: r.employee_name }))

  function isOnLeave(employeeId, day) {
    return requests.some(r => {
      if (r.employee_id !== employeeId) return false
      if (!['approved', 'pending'].includes(r.status)) return false
      const start = new Date(r.start_date)
      const end   = new Date(r.end_date)
      const d     = new Date(year, month, day)
      return d >= start && d <= end
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionHeader title="Leave Requests" subtitle="Approve, decline or comment on requests."
        breadcrumbs={['HR Workspace', 'People', 'Leave']}/>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--gap-grid)' }}>
        <Card><Stat label="Pending"    value={pending}            deltaTone="warn"/></Card>
        <Card><Stat label="Approved"   value={approved}           deltaTone="good"/></Card>
        <Card><Stat label="Total"      value={requests.length}/></Card>
        <Card><Stat label="Employees with requests" value={new Set(requests.map(r => r.employee_id)).size}/></Card>
      </div>

      <Card title="All requests">
        <table className="tbl">
          <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Reason</th><th>Reviewed by</th><th>Status</th><th/></tr></thead>
          <tbody>
            {requests.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-mute)', padding: 32 }}>No leave requests yet.</td></tr>}
            {requests.map(l => (
              <tr key={l.id}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={l.employee_name} size={28}/><div><div style={{ fontWeight: 500 }}>{l.employee_name}</div><div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{DEPT_LABELS[l.employee_dept] ?? l.employee_dept}</div></div></div></td>
                <td><Pill>{l.type}</Pill></td>
                <td className="mono" style={{ color: 'var(--text-dim)', fontSize: 12 }}>{l.start_date} → {l.end_date}</td>
                <td style={{ color: 'var(--text-dim)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason || '—'}</td>
                <td style={{ color: 'var(--text-dim)' }}>{l.reviewer_name || '—'}</td>
                <td><Pill tone={LEAVE_TONE[l.status]}>{l.status}</Pill></td>
                <td style={{ textAlign: 'right' }}>
                  {l.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn ghost icon" style={{ width: 26, height: 26, color: 'var(--good)' }} onClick={() => handleAction(l.id, 'approved')}><I.check size={13}/></button>
                      <button className="btn ghost icon" style={{ width: 26, height: 26, color: 'var(--bad)'  }} onClick={() => handleAction(l.id, 'rejected')}><I.x size={13}/></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title={`Team calendar · ${monthName}`} subtitle="Approved and pending leave">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${daysInMonth}, 1fr)`, gap: 2 }}>
            <div/>
            {Array.from({ length: daysInMonth }).map((_, i) => (
              <div key={i} style={{ fontSize: 9, color: 'var(--text-mute)', textAlign: 'center' }} className="mono">{i + 1}</div>
            ))}
          </div>
          {calEmployees.length === 0
            ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-mute)', fontSize: 12 }}>No leave requests this month.</div>
            : calEmployees.map(emp => (
              <div key={emp.id} style={{ display: 'grid', gridTemplateColumns: `120px repeat(${daysInMonth}, 1fr)`, gap: 2, alignItems: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const d   = new Date(year, month, day)
                  const sat = d.getDay() === 6, sun = d.getDay() === 0
                  const leave = isOnLeave(emp.id, day)
                  return (
                    <div key={i} style={{
                      height: 16, borderRadius: 2,
                      background: leave   ? 'color-mix(in oklab, var(--hr-accent) 70%, transparent)'
                                : (sat || sun) ? 'var(--surface-3)'
                                : 'color-mix(in oklab, var(--good) 30%, transparent)',
                    }}/>
                  )
                })}
              </div>
            ))}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 14, fontSize: 11, color: 'var(--text-dim)' }}>
          {[
            { label: 'Working',  bg: 'color-mix(in oklab, var(--good) 30%, transparent)' },
            { label: 'On leave', bg: 'color-mix(in oklab, var(--hr-accent) 70%, transparent)' },
            { label: 'Weekend',  bg: 'var(--surface-3)' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: l.bg }}/>
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Payroll ───────────────────────────────────────────────────────────────────

function HRPayroll({ goto }) {
  const [data,       setData]       = React.useState(null)
  const [showRun,    setShowRun]    = React.useState(false)
  const [runPeriod,  setRunPeriod]  = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [runError,   setRunError]   = React.useState('')
  const [editSlip,   setEditSlip]   = React.useState(null)

  const refresh = () => hrApi.payroll().then(setData).catch(() => {})
  React.useEffect(() => { refresh() }, [])

  function handleRunPayroll() {
    if (!runPeriod.trim()) return
    setSubmitting(true); setRunError('')
    hrApi.runPayroll(runPeriod.trim())
      .then(() => { refresh(); setShowRun(false); setRunPeriod('') })
      .catch(err => { setRunError(err.message); setSubmitting(false) })
  }

  function handleExport() {
    const period = data?.current_period
    const url    = hrApi.exportPayroll(period)
    const a      = document.createElement('a'); a.href = url; a.click()
  }

  const cycles = data?.cycles ?? []
  const slips  = data?.slips  ?? []
  const current = cycles[0]

  const byDept = slips.reduce((acc, s) => {
    const k = DEPT_LABELS[s.department] ?? s.department
    acc[k] = (acc[k] || 0) + s.gross
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionHeader title="Payroll"
        subtitle={current ? `${current.period} · ${current.employee_count} employees` : 'No payroll cycles yet.'}
        breadcrumbs={['HR Workspace', 'Admin', 'Payroll']}
        actions={<>
          <button className="btn" onClick={handleExport} disabled={!current}><I.download size={14}/>Export CSV</button>
          <button className="btn primary" onClick={() => setShowRun(true)}><I.send size={14}/>Run payroll</button>
        </>}/>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--gap-grid)' }}>
        <Card><Stat label="Gross payroll" value={current ? `DZD ${(current.total_gross / 1000).toFixed(0)}k` : '—'}/></Card>
        <Card><Stat label="Net payroll"   value={current ? `DZD ${(current.total_net  / 1000).toFixed(0)}k` : '—'}/></Card>
        <Card><Stat label="Employees"     value={current?.employee_count ?? '—'} deltaTone="good"/></Card>
        <Card><Stat label="Cycle status"  value={current?.status ?? '—'}/></Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--gap-grid)' }}>
        <Card title={`Payroll by department${current ? ' · ' + current.period : ''}`}>
          {Object.keys(byDept).length > 0
            ? <BarChart data={Object.entries(byDept).map(([label, value]) => ({ label, value: Math.round(value / 1000) }))}/>
            : <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>No payslips for current period.</div>}
        </Card>
        <Card title="Cycle history">
          {cycles.length === 0
            ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>No cycles yet.</div>
            : cycles.map((c, i) => (
              <div key={c.period} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i ? '0.5px solid var(--hairline)' : 'none', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.period}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }} className="mono">{c.employee_count} employees · DZD {(c.total_net / 1000).toFixed(0)}k net</div>
                </div>
                <Pill tone={c.status === 'paid' ? 'good' : 'info'}>{c.status}</Pill>
                <button className="btn ghost icon" style={{ width: 26, height: 26 }} onClick={() => { const a = document.createElement('a'); a.href = hrApi.exportPayroll(c.period); a.click() }}>
                  <I.download size={13}/>
                </button>
              </div>
            ))}
        </Card>
      </div>

      <Card title={`Payroll slips${current ? ' · ' + current.period : ''}`} subtitle="Click a row to edit amounts">
        <table className="tbl">
          <thead><tr><th>Employee</th><th>Dept</th><th>Gross</th><th>Net</th><th>Status</th><th/></tr></thead>
          <tbody>
            {slips.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-mute)', padding: 24 }}>No slips for this period.</td></tr>}
            {slips.map(s => (
              <tr key={s.id}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={s.employee_name} size={26}/><span style={{ fontWeight: 500 }}>{s.employee_name}</span></div></td>
                <td><Pill>{DEPT_LABELS[s.department] ?? s.department}</Pill></td>
                <td className="mono">{s.gross.toLocaleString()}</td>
                <td className="mono">{s.net.toLocaleString()}</td>
                <td><Pill tone={s.status === 'paid' ? 'good' : 'info'}>{s.status}</Pill></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn ghost" style={{ height: 26, padding: '0 10px', fontSize: 11 }} onClick={() => setEditSlip(s)}>
                    <I.cog size={12}/>Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showRun && (
        <Modal title="Run payroll" onClose={() => setShowRun(false)}>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0 }}>This creates draft payslips (gross/net = 0) for all active employees. Edit individual amounts after.</p>
          <Field label="Period (e.g. June 2026)">
            <input className="input" style={{ width: '100%' }} value={runPeriod} onChange={e => setRunPeriod(e.target.value)} autoFocus placeholder="June 2026"/>
          </Field>
          {runError && <div style={{ fontSize: 12, color: 'var(--bad)' }}>{runError}</div>}
          <Actions onSubmit={handleRunPayroll} onCancel={() => setShowRun(false)} submitting={submitting} disabled={!runPeriod.trim()} label="Create cycle"/>
        </Modal>
      )}

      {editSlip && (
        <SlipEditModal slip={editSlip} onClose={() => setEditSlip(null)} onSaved={updated => {
          setData(d => ({ ...d, slips: d.slips.map(s => s.id === updated.id ? { ...s, ...updated } : s) }))
          setEditSlip(null)
        }}/>
      )}
    </div>
  )
}

function SlipEditModal({ slip, onClose, onSaved }) {
  const [gross,      setGross]      = React.useState(String(slip.gross))
  const [net,        setNet]        = React.useState(String(slip.net))
  const [status,     setStatus]     = React.useState(slip.status)
  const [submitting, setSubmitting] = React.useState(false)

  function handleSave() {
    setSubmitting(true)
    hrApi.updateSlip(slip.id, { gross: parseFloat(gross), net: parseFloat(net), status })
      .then(onSaved)
      .catch(() => setSubmitting(false))
  }

  return (
    <Modal title={`Edit payslip · ${slip.employee_name}`} onClose={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Gross (DZD)"><input className="input" type="number" style={{ width: '100%' }} value={gross} onChange={e => setGross(e.target.value)}/></Field>
        <Field label="Net (DZD)">  <input className="input" type="number" style={{ width: '100%' }} value={net}   onChange={e => setNet(e.target.value)}/></Field>
      </div>
      <Field label="Status">
        <select className="input" style={{ width: '100%' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="draft">Draft</option><option value="ready">Ready</option><option value="paid">Paid</option>
        </select>
      </Field>
      <Actions onSubmit={handleSave} onCancel={onClose} submitting={submitting}/>
    </Modal>
  )
}

// ── Documents ─────────────────────────────────────────────────────────────────

function HRDocuments() {
  const [docs,         setDocs]         = React.useState([])
  const [showArchived, setShowArchived] = React.useState(false)
  const [showUpload,   setShowUpload]   = React.useState(false)
  const [uploading,    setUploading]    = React.useState(false)
  const [upForm,       setUpForm]       = React.useState({ name: '', description: '', dept: 'hr' })
  const [file,         setFile]         = React.useState(null)
  const [upError,      setUpError]      = React.useState('')
  const [actionError,  setActionError]  = React.useState('')

  function refresh(archived = showArchived) {
    documentsApi.list(archived)
      .then(all => setDocs(all.filter(d => d.dept === 'hr' || d.dept === 'company')))
      .catch(() => {})
  }

  React.useEffect(() => { refresh() }, [])

  function toggleArchived() {
    const next = !showArchived
    setShowArchived(next)
    refresh(next)
  }

  function handleUpload() {
    if (!file) return
    setUploading(true); setUpError('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', upForm.name || file.name)
    fd.append('description', upForm.description)
    fd.append('dept', upForm.dept)
    fd.append('acl', 'dept_only')
    documentsApi.upload(fd)
      .then(d => { setDocs(prev => [d, ...prev]); setShowUpload(false); setFile(null); setUpForm({ name: '', description: '', dept: 'hr' }) })
      .catch(err => { setUpError(err.message) })
      .finally(() => setUploading(false))
  }

  function handleDownload(doc) {
    setActionError('')
    documentsApi.download(doc.id, doc.name).catch(err => setActionError(err.message))
  }

  function handleArchive(doc) {
    setActionError('')
    const archiving = !doc.archived
    documentsApi.archive(doc.id, archiving)
      .then(() => {
        if (showArchived) {
          setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, archived: archiving ? 1 : 0 } : d))
        } else {
          setDocs(prev => prev.filter(d => d.id !== doc.id))
        }
      })
      .catch(err => setActionError(err.message))
  }

  function handleDelete(doc) {
    if (!window.confirm(`Permanently delete "${doc.name}"? This cannot be undone.`)) return
    setActionError('')
    documentsApi.delete(doc.id)
      .then(() => setDocs(prev => prev.filter(d => d.id !== doc.id)))
      .catch(err => setActionError(err.message))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionHeader title="Documents" subtitle="HR and company-wide documents."
        breadcrumbs={['HR Workspace', 'Admin', 'Documents']}
        actions={<>
          <button className="btn ghost" onClick={toggleArchived}
            style={{ color: showArchived ? 'var(--accent)' : 'var(--text-dim)', borderColor: showArchived ? 'color-mix(in oklab, var(--accent) 40%, transparent)' : undefined }}>
            <I.archive size={14}/>{showArchived ? 'Hide archived' : 'Show archived'}
          </button>
          <button className="btn primary" onClick={() => setShowUpload(true)}><I.plus size={14}/>Upload</button>
        </>}/>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--gap-grid)' }}>
        {[
          { label: 'Total',        value: docs.length },
          { label: 'HR docs',      value: docs.filter(d => d.dept === 'hr').length },
          { label: 'Company-wide', value: docs.filter(d => d.dept === 'company').length },
          { label: 'Archived',     value: docs.filter(d => d.archived).length },
        ].map((s, i) => <Card key={i}><Stat label={s.label} value={s.value}/></Card>)}
      </div>

      {actionError && (
        <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: 'color-mix(in oklab, var(--bad) 12%, transparent)', border: '0.5px solid color-mix(in oklab, var(--bad) 30%, transparent)', color: 'var(--bad)', display: 'flex', justifyContent: 'space-between' }}>
          <span>{actionError}</span>
          <button className="btn ghost icon" onClick={() => setActionError('')} style={{ width: 24, height: 24 }}><I.x size={12}/></button>
        </div>
      )}

      <Card title="Documents">
        {docs.length === 0
          ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>No documents{showArchived ? '' : ' — upload one or show archived'}.</div>
          : (
            <table className="tbl">
              <thead><tr><th>Name</th><th>Scope</th><th>Uploaded by</th><th>Date</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id} style={{ opacity: d.archived ? 0.5 : 1 }}>
                    <td>
                      <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
                        <I.doc size={14}/>
                        <span style={{ fontWeight: 500 }}>{d.name}</span>
                        {!!d.archived && <Pill style={{ fontSize: 9, height: 16, padding: '0 6px' }}>archived</Pill>}
                      </span>
                    </td>
                    <td><Pill>{d.dept}</Pill></td>
                    <td style={{ color: 'var(--text-dim)' }}>{d.owner_name}</td>
                    <td className="mono" style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                      {new Date(d.uploaded_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button className="btn ghost icon" style={{ width: 28, height: 28 }} onClick={() => handleDownload(d)} title="Download"><I.download size={13}/></button>
                        <button className="btn ghost icon" style={{ width: 28, height: 28, color: d.archived ? 'var(--good)' : 'var(--text-mute)' }} onClick={() => handleArchive(d)} title={d.archived ? 'Restore' : 'Archive'}>
                          <I.archive size={13}/>
                        </button>
                        <button className="btn ghost icon" style={{ width: 28, height: 28, color: 'var(--bad)' }} onClick={() => handleDelete(d)} title="Delete permanently"><I.x size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </Card>

      {showUpload && (
        <Modal title="Upload document" onClose={() => setShowUpload(false)}>
          <Field label="File">
            <input type="file" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 13, color: 'var(--text)' }}/>
          </Field>
          <Field label="Display name (optional)">
            <input className="input" style={{ width: '100%' }} value={upForm.name} onChange={e => setUpForm(f => ({ ...f, name: e.target.value }))} placeholder="Leave blank to use filename"/>
          </Field>
          <Field label="Description">
            <input className="input" style={{ width: '100%' }} value={upForm.description} onChange={e => setUpForm(f => ({ ...f, description: e.target.value }))}/>
          </Field>
          <Field label="Scope">
            <select className="input" style={{ width: '100%' }} value={upForm.dept} onChange={e => setUpForm(f => ({ ...f, dept: e.target.value }))}>
              <option value="hr">HR</option><option value="company">Company</option>
            </select>
          </Field>
          {upError && <div style={{ fontSize: 12, color: 'var(--bad)' }}>{upError}</div>}
          <Actions onSubmit={handleUpload} onCancel={() => setShowUpload(false)} submitting={uploading} disabled={!file} label="Upload"/>
        </Modal>
      )}
    </div>
  )
}

// ── Static pages (OKRs removed from sidebar, kept for completeness) ───────────

function HROKRs() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionHeader title="Company OKRs · Q2 2026" subtitle="3 objectives · owned by department leads." breadcrumbs={['HR', 'Management', 'OKRs']}/>
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>OKR management coming in next iteration.</div>
    </div>
  )
}

function HRPolicies() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionHeader title="Policies" subtitle="Active company policies." breadcrumbs={['HR Workspace', 'Admin', 'Policies']}/>
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>Policy management coming in next iteration.</div>
    </div>
  )
}

export { HROverview, HRDirectory, HRRecruitment, HRLeave, HRPayroll, HRExpenses, HRDocuments, HRPolicies, HROKRs }

// ── Expenses ──────────────────────────────────────────────────────────────────

function HRExpenses() {
  const [expenses, setExpenses] = React.useState([])
  const [loading,  setLoading]  = React.useState(true)

  const refresh = () => hrApi.expenses().then(setExpenses).catch(() => {}).finally(() => setLoading(false))
  React.useEffect(() => { refresh() }, [])

  function handleAction(id, status) {
    hrApi.updateExpense(id, status)
      .then(updated => setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e)))
  }

  const STATUS_TONE = { pending: 'warn', approved: 'good', rejected: 'bad' }
  const pending  = expenses.filter(e => e.status === 'pending')
  const approved = expenses.filter(e => e.status === 'approved')
  const totalApproved = approved.reduce((s, e) => s + e.amount, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SectionHeader title="Expense Claims" subtitle="Employee reimbursement requests."
        breadcrumbs={['HR Workspace', 'Administration', 'Expenses']}/>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--gap-grid)' }}>
        <Card><Stat label="Pending"       value={pending.length}          deltaTone="warn"/></Card>
        <Card><Stat label="Total claims"  value={expenses.length}/></Card>
        <Card><Stat label="Approved amount" value={`DZD ${totalApproved.toLocaleString()}`}/></Card>
        <Card><Stat label="Approved"      value={approved.length}         deltaTone="good"/></Card>
      </div>

      <Card title="All expense claims">
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>Loading…</div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-mute)', fontSize: 13 }}>No expense claims yet.</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Employee</th><th>Description</th><th>Category</th><th>Amount</th><th>Date</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={e.employee_name} size={26}/>
                      <div>
                        <div style={{ fontWeight: 500 }}>{e.employee_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>{DEPT_LABELS[e.employee_dept] ?? e.employee_dept}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-dim)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</td>
                  <td><Pill>{e.category}</Pill></td>
                  <td className="mono" style={{ fontWeight: 500 }}>{e.currency} {Number(e.amount).toLocaleString()}</td>
                  <td className="mono" style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                    {new Date(e.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </td>
                  <td><Pill tone={STATUS_TONE[e.status]}>{e.status}</Pill></td>
                  <td style={{ textAlign: 'right' }}>
                    {e.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button className="btn ghost icon" style={{ width: 26, height: 26, color: 'var(--good)' }} onClick={() => handleAction(e.id, 'approved')}><I.check size={13}/></button>
                        <button className="btn ghost icon" style={{ width: 26, height: 26, color: 'var(--bad)'  }} onClick={() => handleAction(e.id, 'rejected')}><I.x size={13}/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
