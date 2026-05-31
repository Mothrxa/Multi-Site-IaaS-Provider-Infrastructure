import React from 'react'
import { I } from '../components/icons.jsx'
import { Card, Stat, Pill, SectionHeader, Avatar, TabBar, Progress, KeyValue } from '../components/ui.jsx'
import { BarChart, Donut, IncidentTimeline } from '../components/charts.jsx'

// pages-it2.jsx — IT Dashboard pages (part 2: Incidents, Deployments, Tickets, Subscribers)

function ITIncidents() {
  const [open, setOpen] = React.useState(null);
  const incidents = [
    { id: "INC-1042", sev: "P2", tone: "bad",  status: "open",        title: "Gateway 04 — Unreachable",        team: "Network Ops",   started: "14:30 UTC", duration: "12m", commander: "S. Bouchareb" },
    { id: "INC-1041", sev: "P3", tone: "warn", status: "investigating", title: "API rate-limit triggered",        team: "Backend",       started: "14:14 UTC", duration: "28m", commander: "Y. Hamdi" },
    { id: "INC-1040", sev: "P3", tone: "warn", status: "monitoring",  title: "Cloud-api elevated 5xx",          team: "Backend",       started: "13:58 UTC", duration: "44m", commander: "M. Karim" },
    { id: "INC-1039", sev: "P4", tone: "info", status: "resolved",    title: "Slack OAuth token rotation",      team: "Support",       started: "11:02 UTC", duration: "1h 14m", commander: "Helpdesk" },
    { id: "INC-1038", sev: "P2", tone: "bad",  status: "resolved",    title: "Database failover · eu-west-2",  team: "DBA",           started: "08:18 UTC", duration: "32m", commander: "A. Bouzid" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Incident management" subtitle="Active and recently resolved incidents."
        breadcrumbs={["IT Workspace", "Operations", "Incidents"]}
        actions={<><button className="btn"><I.archive size={14}/>Postmortems</button><button className="btn primary"><I.bolt size={14}/>Declare incident</button></>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card><Stat label="Open" value="3" delta="2 high sev" deltaTone="warn"/></Card>
        <Card><Stat label="MTTR (30d)" value="42" suffix="min" delta="-8m" deltaTone="good"/></Card>
        <Card><Stat label="MTBF (30d)" value="48" suffix="h" delta="+6h" deltaTone="good"/></Card>
        <Card><Stat label="On-call rotations" value="3" hint="Backend · Network · DBA"/></Card>
      </div>

      <Card title="Incidents" subtitle={`${incidents.filter(i => i.status !== "resolved").length} active · ${incidents.filter(i => i.status === "resolved").length} resolved (24h)`}>
        <table className="tbl">
          <thead><tr><th>ID</th><th>Severity</th><th>Title</th><th>Team</th><th>Started</th><th>Duration</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {incidents.map(inc => (
              <tr key={inc.id} onClick={() => setOpen(inc)} style={{ cursor: "pointer" }}>
                <td className="mono">{inc.id}</td>
                <td><Pill tone={inc.tone}>{inc.sev}</Pill></td>
                <td style={{ fontWeight: 500 }}>{inc.title}</td>
                <td style={{ color: "var(--text-dim)" }}>{inc.team}</td>
                <td className="mono" style={{ color: "var(--text-dim)" }}>{inc.started}</td>
                <td className="mono" style={{ color: "var(--text-dim)" }}>{inc.duration}</td>
                <td><Pill tone={inc.status === "resolved" ? "good" : inc.status === "open" ? "bad" : "warn"} dot={inc.status !== "resolved"}>{inc.status}</Pill></td>
                <td style={{ textAlign: "right" }}><I.chevR size={14}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Severity distribution (30d)">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "10px 0" }}>
            <Donut value={2}  max={30} label="P1" color="var(--bad)"  sub="CRIT"/>
            <Donut value={8}  max={30} label="P2" color="var(--warn)" sub="HIGH"/>
            <Donut value={14} max={30} label="P3" color="var(--accent)" sub="MED"/>
            <Donut value={6}  max={30} label="P4" color="var(--info)" sub="LOW"/>
          </div>
        </Card>
        <Card title="Postmortems · pending">
          {[
            { id: "INC-1038", title: "Database failover", due: "in 1d", owner: "A. Bouzid" },
            { id: "INC-1035", title: "DNS resolution outage", due: "today", owner: "Y. Hamdi" },
            { id: "INC-1032", title: "Payment gateway timeout", due: "overdue", owner: "M. Karim" },
          ].map((p, i) => (
            <div key={p.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: i ? "0.5px solid var(--hairline)" : "none", alignItems: "center" }}>
              <Avatar name={p.owner} size={32}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }} className="mono">{p.id} · {p.owner}</div>
              </div>
              <Pill tone={p.due === "overdue" ? "bad" : p.due === "today" ? "warn" : "info"}>{p.due}</Pill>
            </div>
          ))}
        </Card>
      </div>

      {open && <IncidentDrawer inc={open} onClose={() => setOpen(null)}/>}
    </div>
  );
}

function IncidentDrawer({ inc, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,10,14,0.5)", zIndex: 150, WebkitBackdropFilter: "blur(6px)", backdropFilter: "blur(6px)" }} className="fadein">
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 480,
        background: "var(--bg-1)", borderLeft: "0.5px solid var(--hairline-2)",
        padding: 28, overflowY: "auto", boxShadow: "-30px 0 60px rgba(0,0,0,0.4)",
        animation: "slideup 0.3s cubic-bezier(0.16,1,0.3,1) both",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Pill tone={inc.tone}>{inc.sev}</Pill>
          <button className="btn ghost icon" onClick={onClose}><I.x size={16}/></button>
        </div>
        <h2 style={{ fontSize: 22, marginTop: 14, marginBottom: 6 }}>{inc.title}</h2>
        <div className="mono" style={{ color: "var(--text-mute)", fontSize: 12, marginBottom: 18 }}>{inc.id} · started {inc.started}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
          <KeyValue k="Status" v={<Pill tone={inc.status === "resolved" ? "good" : inc.status === "open" ? "bad" : "warn"}>{inc.status}</Pill>}/>
          <KeyValue k="Duration" v={inc.duration} mono/>
          <KeyValue k="Team" v={inc.team}/>
          <KeyValue k="Commander" v={inc.commander}/>
        </div>

        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Timeline</h3>
        <IncidentTimeline events={[
          { tone: "bad",  title: "Gateway 04 health-check failed",  desc: "Probe timed out after 3 retries · auto-failover initiated", time: "14:30" },
          { tone: "warn", title: "Traffic shifted to Gateway 02",   desc: "100% of EU-west traffic re-routed in 38s", time: "14:31" },
          { tone: "info", title: "Page sent: Network Ops",          desc: "S. Bouchareb acknowledged in 1m 12s", time: "14:32" },
          { tone: "info", title: "Customer status page updated",    desc: "Investigating: VPN connectivity in eu-west region", time: "14:34" },
          { tone: "info", title: "Initial findings",                desc: "Bridge interface flapped on srv-eu-w-021. Hardware diagnostics in progress.", time: "14:38" },
        ]}/>

        <div style={{ marginTop: 22, display: "flex", gap: 8 }}>
          <button className="btn primary" style={{ flex: 1 }}><I.check size={14}/>Mark resolved</button>
          <button className="btn"><I.send size={14}/>Update statuspage</button>
        </div>
      </div>
    </div>
  );
}

function ITDeployments() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Deployments" subtitle="Production rollouts across services."
        breadcrumbs={["IT Workspace", "Operations", "Deployments"]}
        actions={<><button className="btn"><I.cal size={14}/>Schedule</button><button className="btn primary"><I.refresh size={14}/>Trigger pipeline</button></>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card><Stat label="Deploys (7d)" value="42" delta="+12" deltaTone="good"/></Card>
        <Card><Stat label="Success rate" value="96.4" suffix="%" delta="+0.8 pp" deltaTone="good"/></Card>
        <Card><Stat label="Lead time" value="3.4" suffix="h" delta="-12m" deltaTone="good"/></Card>
        <Card><Stat label="Change failure" value="3.2" suffix="%" delta="-0.4 pp" deltaTone="good"/></Card>
      </div>

      <Card title="Active rollouts" subtitle="Live progress across services">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {[
            { name: "cloud-api",     v: "v4.19.2", env: "production", canary: 78, status: "deploying", t: "started 4m ago", tone: "info"  },
            { name: "portal-web",    v: "v1.9.0",  env: "staging",    canary: 100,status: "success",   t: "completed 2h ago", tone: "good" },
            { name: "billing-svc",   v: "v2.41.4", env: "production", canary: 42, status: "paused",    t: "awaiting QA sign-off · 18m", tone: "warn" },
            { name: "gateway-edge",  v: "v4.18.0", env: "production", canary: 100,status: "success",   t: "completed 6h ago", tone: "good" },
          ].map((d, i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "8px 0", borderBottom: i < 3 ? "0.5px solid var(--hairline)" : "none" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{d.name}</span>
                    <span className="mono" style={{ color: "var(--text-mute)", marginLeft: 8, fontSize: 12 }}>{d.v} → {d.env}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>{d.t}</span>
                    <Pill tone={d.tone}>{d.status}</Pill>
                  </div>
                </div>
                <Progress value={d.canary} tone={d.tone === "good" ? "good" : d.tone === "warn" ? "warn" : "accent"}/>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-mute)" }} className="mono">
                  <span>canary · {d.canary}%</span>
                  <span>error rate 0.{Math.floor(Math.random()*9)}% · p95 latency {30 + Math.floor(Math.random()*40)}ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Deploys per service (7d)">
          <BarChart data={[
            { label: "cloud-api", value: 14 }, { label: "portal-web", value: 9 },
            { label: "gateway", value: 6 }, { label: "billing", value: 5 },
            { label: "support", value: 4 }, { label: "infra", value: 4 },
          ]}/>
        </Card>
        <Card title="Pipeline status">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { stage: "Build",   ok: 38, fail: 2 },
              { stage: "Test",    ok: 35, fail: 1 },
              { stage: "Scan",    ok: 36, fail: 0 },
              { stage: "Stage",   ok: 34, fail: 1 },
              { stage: "Prod",    ok: 31, fail: 0 },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ width: 60, fontSize: 12, color: "var(--text-dim)" }}>{p.stage}</span>
                <div style={{ flex: 1, display: "flex", height: 14, borderRadius: 7, overflow: "hidden", gap: 2 }}>
                  <div style={{ flex: p.ok,   background: "var(--good)" }}/>
                  {p.fail > 0 && <div style={{ flex: p.fail, background: "var(--bad)" }}/>}
                </div>
                <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>{p.ok}<span style={{ color: "var(--text-mute)" }}>/{p.ok + p.fail}</span></span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ITTickets() {
  const [filter, setFilter] = React.useState("all");
  const tickets = [
    { id: "4821", sev: "P2", tone: "bad",  status: "new",         title: "Cannot SSH into Linux VM after reboot",        who: "Sami Bouchareb",  type: "Customer", age: "4m",  assignee: null },
    { id: "4818", sev: "P3", tone: "warn", status: "in progress", title: "Snapshot restore stuck at 'pending' for 2h",     who: "L. Marchetti",    type: "Customer", age: "22m", assignee: "Y. Hamdi" },
    { id: "4817", sev: "P3", tone: "warn", status: "in progress", title: "Container won't start: image pull error",       who: "P. Saadi",        type: "Customer", age: "47m", assignee: "M. Karim" },
    { id: "4814", sev: "P3", tone: "warn", status: "waiting",     title: "Slack notifications missing on macOS",         who: "Internal · M. K", type: "Internal", age: "1h",  assignee: "Helpdesk Bot" },
    { id: "4812", sev: "P4", tone: "info", status: "new",         title: "Onboarding · new dev laptop request",          who: "Internal · J. R", type: "Internal", age: "2h",  assignee: null },
    { id: "4809", sev: "P4", tone: "info", status: "in progress", title: "Increase container quota to 50",                who: "A. Chen",         type: "Customer", age: "3h",  assignee: "Y. Hamdi" },
    { id: "4803", sev: "P3", tone: "warn", status: "resolved",    title: "Reset 2FA — phone replaced",                    who: "Internal · L. B", type: "Internal", age: "5h",  assignee: "Helpdesk" },
    { id: "4795", sev: "P2", tone: "bad",  status: "resolved",    title: "Billing dispute — unprovisioned VM charged",   who: "K. Tanaka",       type: "Customer", age: "yesterday", assignee: "M. Karim" },
  ];
  const filtered = filter === "all" ? tickets : tickets.filter(t => t.type.toLowerCase() === filter || t.status === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Helpdesk Tickets" subtitle="Customer and internal issues routed to Support."
        breadcrumbs={["IT Workspace", "Support", "Tickets"]}
        actions={<><button className="btn"><I.filter size={14}/>Filters</button><button className="btn primary"><I.plus size={14}/>New ticket</button></>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card><Stat label="Open" value="12" delta="3 new today" deltaTone="info"/></Card>
        <Card><Stat label="In progress" value="6" hint="across 4 agents"/></Card>
        <Card><Stat label="Avg. first response" value="14" suffix="min" delta="-3m" deltaTone="good"/></Card>
        <Card><Stat label="CSAT (7d)" value="4.6" suffix="/ 5" delta="+0.2" deltaTone="good"/></Card>
      </div>

      <Card title="Ticket queue" subtitle="Click a row to open detail"
            action={<TabBar dense tabs={[
              { id: "all", label: "All" }, { id: "customer", label: "Customer" },
              { id: "internal", label: "Internal" }, { id: "resolved", label: "Resolved" },
            ]} active={filter} onChange={setFilter}/>}>
        <table className="tbl">
          <thead>
            <tr><th>ID</th><th>Pri.</th><th>Title</th><th>Requester</th><th>Type</th><th>Assignee</th><th>Age</th><th>Status</th></tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td className="mono">#{t.id}</td>
                <td><Pill tone={t.tone}>{t.sev}</Pill></td>
                <td style={{ fontWeight: 500, maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</td>
                <td style={{ color: "var(--text-dim)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar name={t.who} size={22}/> <span>{t.who}</span>
                  </div>
                </td>
                <td><Pill>{t.type}</Pill></td>
                <td style={{ color: "var(--text-dim)" }}>{t.assignee || <span style={{ color: "var(--text-mute)", fontStyle: "italic" }}>unassigned</span>}</td>
                <td className="mono" style={{ color: "var(--text-mute)" }}>{t.age}</td>
                <td><Pill tone={t.status === "new" ? "info" : t.status === "resolved" ? "good" : t.status === "waiting" ? "warn" : undefined}>{t.status}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Tickets by category">
          <BarChart data={[
            { label: "VM",       value: 38 },
            { label: "Container",value: 22 },
            { label: "Network",  value: 18 },
            { label: "Billing",  value: 16 },
            { label: "Account",  value: 12 },
            { label: "Other",    value: 6  },
          ]}/>
        </Card>
        <Card title="Top agents (7d)">
          {[
            { who: "Yacine Hamdi",   solved: 42, csat: 4.7 },
            { who: "Mounir Karim",   solved: 38, csat: 4.6 },
            { who: "Lina Bouzid",    solved: 33, csat: 4.8 },
            { who: "Helpdesk Bot",   solved: 21, csat: 4.4 },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: i ? "0.5px solid var(--hairline)" : "none", alignItems: "center" }}>
              <Avatar name={a.who} size={32}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.who}</div>
                <div style={{ fontSize: 11, color: "var(--text-mute)" }}>{a.solved} solved · CSAT {a.csat}</div>
              </div>
              <Progress value={a.solved} max={50}/>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function ITSubscribers() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Customers" subtitle="Active accounts using the Strata cloud platform."
        breadcrumbs={["IT Workspace", "Support", "Customers"]}
        actions={<><button className="btn"><I.download size={14}/>Export</button><button className="btn primary"><I.plus size={14}/>Add account</button></>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card><Stat label="Active customers" value="412" delta="+18 net new"/></Card>
        <Card><Stat label="Trial" value="38" delta="12 convert next week"/></Card>
        <Card><Stat label="Churn (30d)" value="1.4" suffix="%" delta="-0.2 pp" deltaTone="good"/></Card>
        <Card><Stat label="Provisioned workloads" value="3,182" delta="VMs 2,418 · ctrs 764"/></Card>
      </div>

      <Card title="Recent customer issues" subtitle="Threaded to a customer account"
            action={
              <input className="input" placeholder="Search VM ID or customer…" style={{ width: 260 }}/>
            }>
        <table className="tbl">
          <thead><tr><th>Account</th><th>Plan</th><th>Region</th><th>Last issue</th><th>Workloads</th><th>Health</th><th></th></tr></thead>
          <tbody>
            {[
              { co: "Nexion SARL",   plan: "Business",  reg: "DC-Alger", iss: "VM unreachable", w: 14, h: "warn" },
              { co: "Atlas Cloud",   plan: "Enterprise",reg: "DC-Alger", iss: "—",              w: 412, h: "good" },
              { co: "Riadh Capital", plan: "Business",  reg: "DC-Alger", iss: "Billing",        w: 8,  h: "good" },
              { co: "Saharan AI",    plan: "Starter",   reg: "DC-Alger", iss: "Onboarding",     w: 2,  h: "info" },
              { co: "Maris Logistics", plan: "Business",reg: "DC-Alger", iss: "Latency",       w: 142, h: "warn" },
              { co: "Helios Tech",   plan: "Enterprise",reg: "DC-Alger", iss: "—",              w: 218, h: "good" },
              { co: "Karkur Studios",plan: "Starter",   reg: "DC-Alger", iss: "API quota",      w: 4,  h: "info" },
            ].map(c => (
              <tr key={c.co}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={c.co} size={28}/>
                    <span style={{ fontWeight: 500 }}>{c.co}</span>
                  </div>
                </td>
                <td><Pill>{c.plan}</Pill></td>
                <td className="mono" style={{ color: "var(--text-dim)" }}>{c.reg}</td>
                <td style={{ color: "var(--text-dim)" }}>{c.iss}</td>
                <td className="mono">{c.w}</td>
                <td><Pill tone={c.h}>{c.h === "good" ? "healthy" : c.h === "warn" ? "needs attention" : "trial"}</Pill></td>
                <td style={{ textAlign: "right" }}><button className="btn ghost icon"><I.arrowR size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export { ITIncidents, ITDeployments, ITTickets, ITSubscribers };
