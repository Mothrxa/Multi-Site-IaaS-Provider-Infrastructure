import React from 'react'
import { I } from '../components/icons.jsx'
import { Card, Stat, Pill, SectionHeader, Avatar, Progress, TabBar } from '../components/ui.jsx'
import { BarChart, Donut } from '../components/charts.jsx'
import { clientsApi } from '../api/index.js'

const STATUS_TONE = { active:'good', trial:'info', at_risk:'warn', churned:'bad' }
const PLAN_LABELS  = { starter:'Starter', business:'Business', enterprise:'Enterprise' }

function fmt(n) { return Number(n||0).toLocaleString() }
function fmtEur(n) { return `€${Number(n||0).toLocaleString()}` }
function useClients() {
  const [data, setData] = React.useState(null)
  React.useEffect(() => { clientsApi.list().then(setData).catch(() => {}) }, [])
  return data
}
function useStats() {
  const [data, setData] = React.useState(null)
  React.useEffect(() => { clientsApi.stats().then(setData).catch(() => {}) }, [])
  return data
}

// ── Overview ──────────────────────────────────────────────────────────────────
function BizOverview({ goto }) {
  const stats   = useStats()
  const clients = useClients()
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <SectionHeader title="BizOps" subtitle="Revenue, clients and pipeline at a glance."
        breadcrumbs={['BizOps Workspace','Overview']}
        actions={<button className="btn primary" onClick={() => goto('customers')}><I.users size={14}/>Customers</button>}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'var(--gap-grid)' }}>
        <Card><Stat label="MRR"       value={stats ? fmtEur(stats.mrr)      : '…'} deltaTone="good"/></Card>
        <Card><Stat label="ARR"       value={stats ? fmtEur(stats.arr)      : '…'}/></Card>
        <Card><Stat label="Active clients" value={stats ? stats.active      : '…'} deltaTone="good"/></Card>
        <Card><Stat label="At risk"   value={stats ? stats.at_risk          : '…'} deltaTone="warn"/></Card>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:'var(--gap-grid)' }}>
        <Card title="Revenue by plan">
          {stats?.by_plan?.length
            ? <BarChart data={stats.by_plan.map(p=>({ label:PLAN_LABELS[p.plan]||p.plan, value:Math.round(p.mrr/1000) }))} height={180}/>
            : <div style={{ padding:40, textAlign:'center', color:'var(--text-mute)', fontSize:13 }}>Loading…</div>}
        </Card>
        <Card title="Top accounts" subtitle="By MRR">
          {stats?.top_clients?.map((c,i) => (
            <div key={c.name} style={{ display:'flex', gap:10, padding:'10px 0', borderTop:i?'0.5px solid var(--hairline)':'none', alignItems:'center' }}>
              <Avatar name={c.name} size={28}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{c.name}</div>
              </div>
              <span style={{ fontFamily:'var(--f-mono)', fontSize:12, fontWeight:600 }}>{fmtEur(c.mrr)}/mo</span>
            </div>
          )) ?? <div style={{ padding:24, color:'var(--text-mute)', textAlign:'center', fontSize:13 }}>Loading…</div>}
        </Card>
      </div>
    </div>
  )
}

// ── Customers ─────────────────────────────────────────────────────────────────
function BizCustomers() {
  const clients = useClients()
  const [search, setSearch] = React.useState('')
  const filtered = (clients||[]).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <SectionHeader title="Customers" subtitle="All client accounts."
        breadcrumbs={['BizOps Workspace','Customers']}
        actions={<input className="input" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:220 }}/>}/>
      <Card padding={0}>
        <table className="tbl">
          <thead><tr><th>Company</th><th>Plan</th><th>VMs</th><th>Containers</th><th>MRR</th><th>Renewal</th><th>Status</th></tr></thead>
          <tbody>
            {!clients && <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text-mute)', padding:32 }}>Loading…</td></tr>}
            {filtered.map(c => (
              <tr key={c.id}>
                <td><div style={{ display:'flex', alignItems:'center', gap:10 }}><Avatar name={c.name} size={28}/><div><div style={{ fontWeight:500 }}>{c.name}</div><div style={{ fontSize:11, color:'var(--text-mute)' }}>{c.company}</div></div></div></td>
                <td><Pill>{PLAN_LABELS[c.plan]||c.plan}</Pill></td>
                <td className="mono">{c.vm_count}</td>
                <td className="mono">{c.container_count}</td>
                <td className="mono" style={{ fontWeight:500 }}>{fmtEur(c.monthly_revenue)}</td>
                <td style={{ color:'var(--text-dim)', fontSize:12 }}>{c.renewal_date || '—'}</td>
                <td><Pill tone={STATUS_TONE[c.status]}>{c.status.replace('_',' ')}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── Billing ───────────────────────────────────────────────────────────────────
function BizBilling() {
  const [rows, setRows] = React.useState(null)
  React.useEffect(() => { clientsApi.billing().then(setRows).catch(() => {}) }, [])
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <SectionHeader title="Billing & Usage" subtitle="Usage per client per period."
        breadcrumbs={['BizOps Workspace','Customers','Billing']}/>
      <Card padding={0}>
        <table className="tbl">
          <thead><tr><th>Client</th><th>Period</th><th>VM-hours</th><th>Egress GB</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {!rows && <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text-mute)', padding:32 }}>Loading…</td></tr>}
            {(rows||[]).map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight:500 }}>{r.client_name}</td>
                <td className="mono">{r.period}</td>
                <td className="mono">{fmt(r.vm_hours)}</td>
                <td className="mono">{fmt(r.egress_gb)}</td>
                <td className="mono" style={{ fontWeight:600 }}>{fmtEur(r.total_amount)}</td>
                <td><Pill tone={STATUS_TONE[r.status]||'info'}>{r.status}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── Invoices ──────────────────────────────────────────────────────────────────
function BizInvoices() {
  const [rows, setRows] = React.useState(null)
  React.useEffect(() => { clientsApi.billing('status=issued,paid,overdue').then(setRows).catch(() => {}) }, [])
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <SectionHeader title="Invoices" subtitle="Issued and paid invoices."
        breadcrumbs={['BizOps Workspace','Customers','Invoices']}/>
      <Card padding={0}>
        <table className="tbl">
          <thead><tr><th>Invoice</th><th>Client</th><th>Period</th><th>Issued</th><th>Due</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {!rows && <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text-mute)', padding:32 }}>Loading…</td></tr>}
            {(rows||[]).map(r => (
              <tr key={r.id}>
                <td className="mono" style={{ fontWeight:500 }}>{r.invoice_number||'—'}</td>
                <td>{r.client_name}</td>
                <td className="mono">{r.period}</td>
                <td className="mono" style={{ color:'var(--text-dim)' }}>{r.issued_date||'—'}</td>
                <td className="mono" style={{ color:'var(--text-dim)' }}>{r.due_date||'—'}</td>
                <td className="mono" style={{ fontWeight:600 }}>{fmtEur(r.total_amount)}</td>
                <td><Pill tone={STATUS_TONE[r.status]||(r.status==='paid'?'good':undefined)}>{r.status}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── Revenue ───────────────────────────────────────────────────────────────────
function BizRevenue({ goto }) {
  const stats = useStats()
  const churnAmt = stats ? Math.round(stats.mrr * 0.04) : 0
  const expansion = stats ? Math.round(stats.mrr * 0.08) : 0
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <SectionHeader title="Revenue" subtitle="MRR, ARR and growth metrics."
        breadcrumbs={['BizOps Workspace','Commercial','Revenue']}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'var(--gap-grid)' }}>
        <Card><Stat label="MRR"        value={stats ? fmtEur(stats.mrr)  : '…'} deltaTone="good"/></Card>
        <Card><Stat label="ARR"        value={stats ? fmtEur(stats.arr)  : '…'}/></Card>
        <Card><Stat label="Expansion"  value={stats ? fmtEur(expansion)  : '…'} deltaTone="good"/></Card>
        <Card><Stat label="Churn MRR"  value={stats ? fmtEur(churnAmt)  : '…'} deltaTone="bad"/></Card>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:'var(--gap-grid)' }}>
        <Card title="MRR by plan">
          {stats?.by_plan?.length
            ? <BarChart data={stats.by_plan.map(p=>({ label:PLAN_LABELS[p.plan]||p.plan, value:Math.round(p.mrr) }))}/>
            : <div style={{ padding:40, textAlign:'center', color:'var(--text-mute)', fontSize:13 }}>Loading…</div>}
        </Card>
        <Card title="Client status">
          {stats
            ? <Donut value={stats.active} label={`${stats.active} active`} color="var(--good)" sub="of total" size={140}/>
            : <div style={{ padding:40, textAlign:'center', color:'var(--text-mute)', fontSize:13 }}>Loading…</div>}
        </Card>
      </div>
    </div>
  )
}

// ── Pipeline ──────────────────────────────────────────────────────────────────
function BizPipeline() {
  const [deals, setDeals] = React.useState(null)
  React.useEffect(() => { clientsApi.pipeline().then(setDeals).catch(() => {}) }, [])
  const stages = ['Discovery','Qualified','Proposal','Negotiation','Closed Won']
  const byStage = Object.fromEntries(stages.map(s => [s, (deals||[]).filter(d=>d.stage===s)]))
  const totalValue = (deals||[]).reduce((s,d) => s+d.amount, 0)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
      <SectionHeader title="Pipeline" subtitle="Deals by stage." breadcrumbs={['BizOps Workspace','Commercial','Pipeline']}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'var(--gap-grid)' }}>
        {stages.map(s => (
          <Card key={s} style={{ padding:14 }}>
            <div style={{ fontSize:11, color:'var(--text-mute)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>{s}</div>
            <div style={{ fontSize:20, fontWeight:600 }}>{byStage[s]?.length||0}</div>
            <div style={{ fontSize:12, color:'var(--text-dim)', marginTop:4 }}>{fmtEur(byStage[s]?.reduce((s,d)=>s+d.amount,0)||0)}</div>
          </Card>
        ))}
      </div>
      <Card title="All deals" subtitle={`Total pipeline: ${fmtEur(totalValue)}`}>
        <table className="tbl">
          <thead><tr><th>Deal</th><th>Client</th><th>Stage</th><th>Contact</th><th>Value</th></tr></thead>
          <tbody>
            {!deals && <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--text-mute)', padding:24 }}>Loading…</td></tr>}
            {(deals||[]).map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight:500 }}>{d.name}</td>
                <td style={{ color:'var(--text-dim)' }}>{d.client_name||'—'}</td>
                <td><Pill tone={d.stage==='Closed Won'?'good':d.stage==='Negotiation'?'warn':undefined}>{d.stage}</Pill></td>
                <td style={{ color:'var(--text-dim)' }}>{d.contact_name||'—'}</td>
                <td className="mono" style={{ fontWeight:600 }}>{fmtEur(d.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

export { BizOverview, BizCustomers, BizBilling, BizInvoices, BizRevenue, BizPipeline }
