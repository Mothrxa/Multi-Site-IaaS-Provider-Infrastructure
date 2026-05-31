import { I } from '../components/icons.jsx'
import { Card, Stat, Pill, SectionHeader, Avatar, TabBar, Progress, KeyValue, Sparkline, useLiveSeries } from '../components/ui.jsx'
import { UptimeChart, Donut, BarChart, StackedBars, Heatmap, IncidentTimeline, SiteMap } from '../components/charts.jsx'

// pages-it.jsx — IT Dashboard pages

// === IT Overview ===
function ITOverview({ goto }) {
  const cpu = useLiveSeries([62,58,71,66,72,75,68,73,80,74,76,82,78,80,77,84,79,82,78,83,80], { interval: 1800, max: 100, step: 0.1 });
  const net = useLiveSeries([42,45,40,48,52,49,55,58,54,60,56,62,59,65,61,66,63,68,64,70,67], { interval: 1800, max: 100, step: 0.12 });
  const tickets = useLiveSeries([21,23,22,24,26,25,27,28,26,29,30,28,31,33,32,30,28,29,31,30,29], { interval: 2300, max: 50, step: 0.05 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader
        title="Good afternoon, Sarah"
        subtitle="Here's what's happening across the cloud platform today."
        breadcrumbs={["IT Workspace", "Overview"]}
        actions={
          <>
            <button className="btn"><I.download size={14}/>Export</button>
            <button className="btn primary" onClick={() => goto("tickets")}><I.ticket size={14}/>Open helpdesk</button>
          </>
        }
      />

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card>
          <Stat label="Platform Uptime" value="99.984" suffix="%" delta="+0.02 pp" hint="rolling 30d"/>
          <Sparkline data={[99.92,99.95,99.93,99.96,99.97,99.95,99.98,99.99,99.96,99.97,99.98,99.97,99.98,99.99]} color="var(--good)" height={42}/>
        </Card>
        <Card>
          <Stat label="Active workloads" value="3,182" delta="VMs 2,418 · ctrs 764"/>
          <Sparkline data={[2800,2840,2890,2920,2960,2990,3020,3070,3100,3130,3160,3182]} color="var(--accent)" height={42}/>
        </Card>
        <Card>
          <Stat label="Open tickets" value={Math.round(tickets[tickets.length-1])} delta="-3 today" deltaTone="good"/>
          <Sparkline data={tickets} color="var(--warn)" height={42}/>
        </Card>
        <Card>
          <Stat label="Active customers" value="412" delta="+18 net new" deltaTone="good"/>
          <Sparkline data={[360,368,374,381,388,392,398,402,406,409,411,412]} color="var(--accent-2)" height={42}/>
        </Card>
      </div>

      {/* Uptime chart + Map */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Service health · Live" subtitle="Last 60 minutes · refreshes every 1.8s"
              action={<TabBar tabs={[{id:"1h",label:"1h"},{id:"24h",label:"24h"},{id:"7d",label:"7d"}]} active="1h" onChange={()=>{}} dense/>}>
          <UptimeChart height={200} series={[
            { name: "Customer Portal", color: "var(--accent)",  data: cpu },
            { name: "Compute API",     color: "var(--accent-2)",data: net, unit: "ms" },
          ]}/>
        </Card>
        <Card title="Datacenter & HQ status" subtitle="Two sites · IPsec interconnect healthy">
          <SiteMap height={180}/>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: "var(--text-dim)" }}>
            <span><span className="mono" style={{ color: "var(--good)" }}>● 248</span> Hosts</span>
            <span><span className="mono" style={{ color: "var(--good)" }}>● 5</span> Switches</span>
            <span><span className="mono" style={{ color: "var(--good)" }}>● 2</span> Gateways</span>
          </div>
        </Card>
      </div>

      {/* Recent provisioning + Tickets */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Recently provisioned" subtitle="Customer self-service · via portal & API"
              action={<button className="btn ghost" style={{ height: 26, padding: "0 10px", fontSize: 11 }} onClick={() => goto("workloads")}>View all</button>}>
          <IncidentTimeline events={[
            { tone: "good", title: "VM provisioned · atlas-web-07",     desc: "Atlas Cloud · c2-large · Ubuntu 22.04 · host-03", time: "2m ago" },
            { tone: "good", title: "Container started · helios/ml-worker-3", desc: "Helios Tech · python:3.12-slim · host-06", time: "14m ago" },
            { tone: "info", title: "Snapshot created · maris-bastion",  desc: "Maris Logistics · 48 GB · scheduled", time: "38m ago" },
            { tone: "good", title: "VM provisioned · nexion-runner-2",   desc: "Nexion SARL · g1-small · Windows Server 2022", time: "1h ago" },
            { tone: "warn", title: "Quota raised · Saharan AI",          desc: "Container quota 20 → 50 · approved by support", time: "3h ago" },
          ]}/>
        </Card>

        <Card title="Helpdesk queue" subtitle="Tickets routed to my team"
              action={<button className="btn primary" style={{ height: 26, padding: "0 10px", fontSize: 11 }} onClick={() => goto("tickets")}>Open queue</button>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { id: "4821", pr: "P2", tone: "bad",  who: "S. Bouchareb", title: "Cannot SSH into Linux VM after reboot", age: "4m" },
              { id: "4818", pr: "P3", tone: "warn", who: "L. Marchetti",  title: "Snapshot restore stuck at 'pending' for 2h", age: "22m" },
              { id: "4814", pr: "P3", tone: "warn", who: "Internal · M. K.", title: "Slack notifications missing on macOS", age: "1h" },
              { id: "4809", pr: "P4", tone: "info", who: "A. Chen",         title: "Request: increase container quota to 50", age: "3h" },
            ].map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "0.5px solid var(--hairline)" }}>
                <Pill tone={t.tone}>{t.pr}</Pill>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>#{t.id} · {t.who}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-mute)", whiteSpace: "nowrap" }} className="mono">{t.age}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Resource use + Workloads by status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "var(--gap-grid)" }}>
        <Card title="Resource utilization" subtitle="Cloud datacenter fleet">
          <div style={{ display: "flex", justifyContent: "space-around", padding: "6px 0 14px" }}>
            <Donut value={cpu[cpu.length-1]} label="CPU" color="var(--accent)" sub="AVG"/>
            <Donut value={net[net.length-1]} label="Network" color="var(--accent-2)" sub="UTIL"/>
            <Donut value={64} label="Storage" color="var(--warn)" sub="USED"/>
            <Donut value={41} label="Memory" color="var(--good)" sub="ALLOC"/>
          </div>
        </Card>
        <Card title="Workloads by customer" subtitle="Top 5 by provisioned resources"
              action={<button className="btn ghost" style={{ height: 26, padding: "0 10px", fontSize: 11 }} onClick={() => goto("workloads")}>Inventory</button>}>
          <BarChart data={[
            { label: "Atlas", value: 412 },
            { label: "Helios", value: 218 },
            { label: "Maris", value: 142 },
            { label: "Nexion", value: 88 },
            { label: "Riadh", value: 62 },
          ]} height={150}/>
        </Card>
      </div>
    </div>
  );
}

// === Development ===
function ITDevelopment() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Development" subtitle="Code velocity, repository health, code reviews."
        breadcrumbs={["IT Workspace", "Engineering", "Development"]}
        actions={<><button className="btn"><I.github size={14}/>Open in GitLab</button><button className="btn primary"><I.plus size={14}/>New project</button></>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card><Stat label="Commits this week" value="318" delta="+12%"/></Card>
        <Card><Stat label="Open MRs" value="24" delta="6 ready" deltaTone="good"/></Card>
        <Card><Stat label="Build success" value="96.4" suffix="%" delta="+1.2 pp"/></Card>
        <Card><Stat label="Coverage" value="78.1" suffix="%" delta="-0.4 pp" deltaTone="warn"/></Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Active repositories" subtitle="Maintained by the Cloud Platform team">
          <table className="tbl">
            <thead><tr><th>Repository</th><th>Lang</th><th>Last commit</th><th>Pipelines</th><th>Open MR</th><th></th></tr></thead>
            <tbody>
              {[
                { name: "compute-api",      lang: "Go",          when: "12m ago",  pipe: "ok",    mr: 4 },
                { name: "control-plane",    lang: "Rust",        when: "1h ago",   pipe: "ok",    mr: 2 },
                { name: "portal-web",       lang: "TypeScript",  when: "44m ago",  pipe: "fail",  mr: 7 },
                { name: "billing-svc",      lang: "Go",          when: "3h ago",   pipe: "ok",    mr: 3 },
                { name: "terraform-infra",  lang: "HCL",         when: "yesterday",pipe: "warn",  mr: 5 },
                { name: "support-bot",      lang: "Python",      when: "2d ago",   pipe: "ok",    mr: 1 },
              ].map(r => (
                <tr key={r.name}>
                  <td><span className="mono" style={{ color: "var(--text)" }}>{r.name}</span></td>
                  <td><Pill>{r.lang}</Pill></td>
                  <td style={{ color: "var(--text-dim)" }}>{r.when}</td>
                  <td><Pill tone={r.pipe === "ok" ? "good" : r.pipe === "fail" ? "bad" : "warn"}>{r.pipe.toUpperCase()}</Pill></td>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{r.mr}</td>
                  <td style={{ textAlign: "right" }}><button className="btn ghost icon"><I.arrowR size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Contribution heatmap" subtitle="Past 14 weeks · all repos">
          <Heatmap weeks={14} days={7}/>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, fontSize: 11, color: "var(--text-mute)" }}>
            <span>Less</span>
            <div style={{ display: "flex", gap: 3 }}>
              {[0.15, 0.35, 0.55, 0.75].map(i => (
                <span key={i} style={{ width: 12, height: 12, borderRadius: 3, background: `color-mix(in oklab, var(--accent) ${i * 100}%, transparent)`, border: "0.5px solid var(--hairline)" }}/>
              ))}
            </div>
            <span>More</span>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Pending code review">
          {[
            { repo: "compute-api",    title: "feat: per-account rate-limit buckets",  who: "Y. Hamdi",     age: "2h" },
            { repo: "portal-web",     title: "fix(billing): handle deleted plan IDs",  who: "M. Karim",     age: "4h" },
            { repo: "control-plane",  title: "refactor: cache provisioning workflow",  who: "L. Marchetti", age: "yesterday" },
            { repo: "terraform-infra",title: "infra: add backup vault at HQ",          who: "A. Bouzid",    age: "yesterday" },
          ].map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: i ? "0.5px solid var(--hairline)" : "none" }}>
              <Avatar name={m.who} size={28}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13 }}>{m.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 3 }} className="mono">{m.repo} · {m.who} · {m.age}</div>
              </div>
              <button className="btn ghost" style={{ height: 26, padding: "0 10px", fontSize: 11 }}>Review</button>
            </div>
          ))}
        </Card>

        <Card title="Release calendar" subtitle="Upcoming production cuts">
          {[
            { d: "May 20", who: "compute-api",    ver: "v4.20.0", who2: "Backend"   },
            { d: "May 22", who: "portal-web",     ver: "v1.9.0",  who2: "Frontend"  },
            { d: "May 27", who: "control-plane",  ver: "v1.3.0",  who2: "Platform"  },
            { d: "Jun 03", who: "billing-svc",    ver: "v2.42.0", who2: "Backend"   },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0", borderTop: i ? "0.5px solid var(--hairline)" : "none", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 48 }}>
                <span style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{r.d.split(" ")[0]}</span>
                <span style={{ fontSize: 18, fontWeight: 600 }}>{r.d.split(" ")[1]}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.who} <span className="mono" style={{ color: "var(--text-mute)", fontWeight: 400 }}>{r.ver}</span></div>
                <div style={{ fontSize: 11, color: "var(--text-mute)" }}>{r.who2} team</div>
              </div>
              <Pill>scheduled</Pill>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// === Infrastructure (multi-site) ===
function ITInfrastructure() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Infrastructure" subtitle="Dual-site topology · HQ ↔ Cloud Datacenter · IPsec interconnect."
        breadcrumbs={["IT Workspace", "Engineering", "Infrastructure"]}
        actions={<><button className="btn"><I.refresh size={14}/>Sync inventory</button><button className="btn primary"><I.plus size={14}/>Add host</button></>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card><Stat label="Sites" value="2" hint="HQ Algiers · Cloud DC"/></Card>
        <Card><Stat label="Compute hosts" value="248" delta="+6 added" deltaTone="info"/></Card>
        <Card><Stat label="Switches" value="5" hint="2 spine · 3 leaf"/></Card>
        <Card><Stat label="Spend (MTD)" value="€42.8k" delta="+€2.1k" deltaTone="warn"/></Card>
      </div>

      <Card title="Two-site topology" subtitle="HQ corporate network and Cloud datacenter, interconnected via IPsec over the public ISP transit">
        <SiteMap height={220}/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16, fontSize: 12 }}>
          <div style={{ padding: 14, borderRadius: 10, background: "var(--surface-3)", border: "0.5px solid var(--hairline)" }}>
            <div style={{ fontSize: 11, color: "var(--text-mute)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>HQ · Algiers</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 6 }}>Corporate Network</div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, color: "var(--text-dim)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Perimeter gateway</span><span className="mono" style={{ color: "var(--good)" }}>● up</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Employee portal</span><span className="mono" style={{ color: "var(--good)" }}>● up</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Directory (LDAP)</span><span className="mono" style={{ color: "var(--good)" }}>● up</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Sensor 2 (inter-site)</span><span className="mono" style={{ color: "var(--good)" }}>● armed</span></div>
            </div>
          </div>
          <div style={{ padding: 14, borderRadius: 10, background: "var(--surface-3)", border: "0.5px solid var(--hairline)" }}>
            <div style={{ fontSize: 11, color: "var(--text-mute)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>Cloud DC</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 6 }}>Customer-facing IaaS</div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, color: "var(--text-dim)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Perimeter gateway</span><span className="mono" style={{ color: "var(--good)" }}>● up</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Customer portal (LB)</span><span className="mono" style={{ color: "var(--good)" }}>● 2/2 backends</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Spine-leaf fabric</span><span className="mono" style={{ color: "var(--good)" }}>● converged</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Sensor 1 (DMZ edge)</span><span className="mono" style={{ color: "var(--good)" }}>● armed</span></div>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Compute hosts" subtitle="Top-of-rack hypervisors running customer workloads"
              action={<><button className="btn ghost" style={{ height: 26, padding: "0 10px", fontSize: 11 }}><I.filter size={12}/>Filter</button></>}>
          <table className="tbl">
            <thead><tr><th>Host</th><th>Role</th><th>Leaf</th><th>VMs</th><th>CPU</th><th>Mem</th><th>Status</th></tr></thead>
            <tbody>
              {[
                { id: "host-01", role: "kvm",     leaf: "leaf-1", vms: 14, cpu: 41, mem: 62, s: "good" },
                { id: "host-02", role: "kvm",     leaf: "leaf-1", vms: 18, cpu: 68, mem: 71, s: "warn" },
                { id: "host-03", role: "kvm",     leaf: "leaf-2", vms: 22, cpu: 89, mem: 82, s: "warn" },
                { id: "host-04", role: "kvm",     leaf: "leaf-2", vms: 11, cpu: 32, mem: 48, s: "good" },
                { id: "host-05", role: "ctr-host",leaf: "leaf-2", vms: 84, cpu: 55, mem: 78, s: "good" },
                { id: "host-06", role: "ctr-host",leaf: "leaf-3", vms: 92, cpu: 62, mem: 74, s: "good" },
                { id: "host-07", role: "kvm",     leaf: "leaf-3", vms: 16, cpu: 49, mem: 64, s: "good" },
                { id: "host-08", role: "kvm",     leaf: "leaf-3", vms: 0,  cpu: 0,  mem: 0,  s: "bad"  },
              ].map(r => (
                <tr key={r.id}>
                  <td><span className="mono">{r.id}</span></td>
                  <td><Pill>{r.role}</Pill></td>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{r.leaf}</td>
                  <td className="mono">{r.vms}</td>
                  <td style={{ width: 90 }}><Progress value={r.cpu} tone={r.cpu > 80 ? "warn" : "accent"} height={4}/></td>
                  <td style={{ width: 90 }}><Progress value={r.mem} tone={r.mem > 80 ? "warn" : "accent"} height={4}/></td>
                  <td><Pill tone={r.s === "good" ? "good" : r.s === "warn" ? "warn" : "bad"}>{r.s === "good" ? "online" : r.s === "warn" ? "high load" : "offline"}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Capacity by tier" subtitle="Provisioned vs. consumed">
          <StackedBars rows={[
            { label: "CPU",      parts: [{ value: 64, color: "var(--accent)" }, { value: 36, color: "var(--surface-3)" }] },
            { label: "Memory",   parts: [{ value: 72, color: "var(--accent)" }, { value: 28, color: "var(--surface-3)" }] },
            { label: "Storage",  parts: [{ value: 58, color: "var(--accent)" }, { value: 42, color: "var(--surface-3)" }] },
            { label: "Network",  parts: [{ value: 41, color: "var(--accent)" }, { value: 59, color: "var(--surface-3)" }] },
            { label: "Container slots", parts: [{ value: 78, color: "var(--warn)" }, { value: 22, color: "var(--surface-3)" }] },
          ]} columns={[
            { label: "Used",   color: "var(--accent)" },
            { label: "Free",   color: "var(--surface-3)" },
            { label: "Tight (>75%)", color: "var(--warn)" },
          ]}/>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Gateway / firewall" subtitle="Per-zone default-deny stance">
          {[
            { z: "DMZ → Workload",  rules: "12 permitted", tone: "good" },
            { z: "DMZ → Backend",   rules: "deny-all",     tone: "bad"  },
            { z: "DMZ → HQ",        rules: "deny-all",     tone: "bad"  },
            { z: "Workload → Backend", rules: "3 permitted", tone: "info" },
            { z: "Mgmt → Hosts",    rules: "out-of-band",  tone: "good" },
            { z: "HQ → DC (IPsec)", rules: "4 permitted",  tone: "good" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i ? "0.5px solid var(--hairline)" : "none", fontSize: 13 }}>
              <span style={{ color: "var(--text)" }} className="mono">{r.z}</span>
              <Pill tone={r.tone}>{r.rules}</Pill>
            </div>
          ))}
        </Card>

        <Card title="Storage usage">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[{n:"Block (customer)",v:62},{n:"Object",v:78},{n:"Snapshots",v:41},{n:"Archive",v:22}].map((s,i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: "var(--text-dim)" }}>{s.n}</span>
                  <span className="mono">{s.v} TB / 100 TB</span>
                </div>
                <Progress value={s.v} tone={s.v > 70 ? "warn" : "accent"}/>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Site-to-site VPN · IPsec">
          <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
            <Donut value={100} label="Tunnel up" color="var(--good)" sub="HEALTHY" size={110}/>
          </div>
          <KeyValue k="Cipher"      v="AES-256-GCM" mono/>
          <KeyValue k="Re-key (PFS)" v="every 4h" mono/>
          <KeyValue k="Throughput"   v="184 Mbps" mono/>
          <KeyValue k="Tunnel age"   v="9d 14h" mono/>
        </Card>
      </div>
    </div>
  );
}

// === Automation ===
function ITAutomation() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Automation" subtitle="Runbooks, scheduled jobs, infra-as-code."
        breadcrumbs={["IT Workspace", "Engineering", "Automation"]}
        actions={<><button className="btn"><I.refresh size={14}/>Re-sync</button><button className="btn primary"><I.plus size={14}/>New runbook</button></>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card><Stat label="Active runbooks" value="42"/></Card>
        <Card><Stat label="Runs today" value="186" delta="98% success" deltaTone="good"/></Card>
        <Card><Stat label="Time saved (mo)" value="312" suffix="h" delta="+18%" deltaTone="good"/></Card>
        <Card><Stat label="Drift detected" value="3" delta="2 reverted" deltaTone="warn"/></Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Runbooks" subtitle="Triggered by schedule, event, or manual">
          <table className="tbl">
            <thead><tr><th>Runbook</th><th>Trigger</th><th>Last run</th><th>Avg. time</th><th>Status</th></tr></thead>
            <tbody>
              {[
                { n: "rotate-vpn-keys",       trig: "weekly", last: "2d ago",  t: "4m 18s", s: "good" },
                { n: "nightly-snapshot",      trig: "0 2 * *", last: "12h ago", t: "41m",   s: "good" },
                { n: "scale-edge-load",       trig: "event",  last: "1h ago",  t: "32s",    s: "good" },
                { n: "detect-drift",          trig: "hourly", last: "12m ago", t: "1m 4s",  s: "warn" },
                { n: "purge-expired-tokens",  trig: "daily",  last: "6h ago",  t: "8s",     s: "good" },
                { n: "renew-tls-certs",       trig: "monthly",last: "9d ago",  t: "2m 7s",  s: "good" },
              ].map(r => (
                <tr key={r.n}>
                  <td><span className="mono">{r.n}</span></td>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{r.trig}</td>
                  <td style={{ color: "var(--text-dim)" }}>{r.last}</td>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{r.t}</td>
                  <td><Pill tone={r.s}>{r.s === "good" ? "OK" : "drift"}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Run history (24h)" subtitle="Color-coded by status">
          <BarChart data={Array.from({length: 12}).map((_,i) => ({
            label: `${(i*2).toString().padStart(2,"0")}h`,
            value: 10 + Math.round(Math.random() * 20),
            color: Math.random() > 0.85 ? "var(--warn)" : "linear-gradient(180deg, var(--accent), color-mix(in oklab, var(--accent) 40%, transparent))",
          }))} height={160}/>
        </Card>
      </div>

      <Card title="Recent runs" subtitle="Live tail · 5 most recent">
        <div style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--text-dim)", display: "flex", flexDirection: "column", gap: 6, padding: "6px 4px" }}>
          <div><span style={{ color: "var(--text-mute)" }}>14:32:18</span> <span style={{ color: "var(--good)" }}>OK</span> rotate-vpn-keys completed in 4m 18s</div>
          <div><span style={{ color: "var(--text-mute)" }}>14:30:02</span> <span style={{ color: "var(--accent)" }}>RUN</span> detect-drift started (hourly)</div>
          <div><span style={{ color: "var(--text-mute)" }}>14:28:44</span> <span style={{ color: "var(--good)" }}>OK</span> scale-edge-load handled: +3 nodes in eu-west</div>
          <div><span style={{ color: "var(--text-mute)" }}>14:22:11</span> <span style={{ color: "var(--warn)" }}>WARN</span> drift detected: terraform-infra (1 resource)</div>
          <div><span style={{ color: "var(--text-mute)" }}>14:01:00</span> <span style={{ color: "var(--good)" }}>OK</span> purge-expired-tokens removed 1,284 tokens</div>
        </div>
      </Card>
    </div>
  );
}

// === Monitoring ===
function ITMonitoring() {
  const portal = useLiveSeries([99.95,99.96,99.94,99.97,99.96,99.98,99.97,99.99,99.95,99.96,99.97,99.98,99.99,99.98,99.97], { interval: 2000, max: 100, min: 99, step: 0.0008 });
  const api    = useLiveSeries([42,45,48,46,44,50,52,49,47,51,53,50,48,46,49], { interval: 1800, max: 80, step: 0.06 });
  const reqs   = useLiveSeries([8200,8400,8100,8500,8800,8700,9000,8900,9200,9100,9300,9500,9400,9600,9500], { interval: 2200, max: 12000, step: 0.04 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Monitoring" subtitle="Customer-facing services, fabric, and IDS alerts · live."
        breadcrumbs={["IT Workspace", "Cloud Platform", "Monitoring"]}
        actions={<>
          <Pill tone="good" style={{ height: 30, padding: "0 12px", fontSize: 12 }}>● Live · updated 1s ago</Pill>
          <button className="btn"><I.refresh size={14}/>Refresh</button>
        </>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card>
          <Stat label="Platform uptime (live)" value={portal[portal.length-1].toFixed(3)} suffix="%"/>
          <Sparkline data={portal} color="var(--good)" height={40}/>
        </Card>
        <Card>
          <Stat label="Compute API latency" value={api[api.length-1].toFixed(0)} suffix="ms"/>
          <Sparkline data={api} color="var(--accent)" height={40}/>
        </Card>
        <Card>
          <Stat label="Portal req/s" value={reqs[reqs.length-1].toLocaleString()}/>
          <Sparkline data={reqs} color="var(--accent-2)" height={40}/>
        </Card>
        <Card>
          <Stat label="Egress (DC perim.)" value="3.42" suffix="Gbps" delta="peak 4.81"/>
          <Sparkline data={[2.1,2.4,2.8,3.0,3.2,3.4,3.1,3.3,3.5,3.7,3.4,3.6,3.8,3.5,3.4]} color="var(--warn)" height={40}/>
        </Card>
      </div>

      <Card title="Customer-facing services · last 24h" subtitle="Per-minute availability · per service">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { n: "portal-web-1",   sla: 99.99 },
            { n: "portal-web-2",   sla: 99.99 },
            { n: "compute-api-1",  sla: 99.98 },
            { n: "compute-api-2",  sla: 99.99 },
            { n: "load-balancer",  sla: 99.99 },
            { n: "control-plane",  sla: 99.97 },
            { n: "database-primary",sla: 99.99 },
            { n: "database-replica",sla: 99.99 },
          ].map((g, gi) => (
            <div key={g.n} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 140, fontSize: 12, color: "var(--text-dim)" }} className="mono">{g.n}</div>
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(96, 1fr)", gap: 2, height: 22 }}>
                {Array.from({ length: 96 }).map((_, i) => {
                  const fail = gi === 2 && (i > 78 && i < 86);
                  const warn = (gi === 0 && (i > 40 && i < 44)) || (gi === 5 && i === 50);
                  return <div key={i} style={{
                    height: "100%", borderRadius: 2,
                    background: fail ? "var(--bad)" : warn ? "var(--warn)" : "color-mix(in oklab, var(--good) 60%, transparent)",
                    boxShadow: fail ? "0 0 6px var(--bad)" : "none",
                  }}/>;
                })}
              </div>
              <span className="mono" style={{ fontSize: 11, color: gi === 2 ? "var(--bad)" : "var(--good)", minWidth: 56, textAlign: "right" }}>
                {gi === 2 ? "98.91%" : g.sla + "%"}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="IDS · alerts (24h)" subtitle="Aggregated from both sensors">
          <BarChart data={[
            { label: "00", value: 8 },  { label: "03", value: 4 },  { label: "06", value: 11 },
            { label: "09", value: 18 }, { label: "12", value: 22 }, { label: "15", value: 28, color: "var(--warn)" },
            { label: "18", value: 19 }, { label: "21", value: 14 },
          ]} max={36}/>
          <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 11, color: "var(--text-dim)" }}>
            <span><span style={{ color: "var(--accent)" }}>●</span> Sensor 1 (DMZ edge)</span>
            <span><span style={{ color: "var(--warn)" }}>●</span> Sensor 2 (inter-site)</span>
          </div>
        </Card>
        <Card title="Top alerts firing">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { t: "bad",  n: "Brute-force on portal /login",  d: "243 attempts in 60s · src 45.142.x.x", v: "P2" },
              { t: "warn", n: "Port-scan from 195.x.x.x",      d: "Sensor 1 · top 20 DMZ ports",          v: "P3" },
              { t: "warn", n: "Unexpected SSH from DMZ → HQ",  d: "Sensor 2 · denied by gateway",         v: "P3" },
              { t: "info", n: "Cert expiring: api.strata.io", d: "in 12 days",                           v: "P4" },
            ].map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: i ? "0.5px solid var(--hairline)" : "none" }}>
                <Pill tone={a.t}>{a.v}</Pill>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>{a.n}</div>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>{a.d}</div>
                </div>
                <button className="btn ghost icon"><I.arrowR size={14}/></button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export { ITOverview, ITDevelopment, ITInfrastructure, ITAutomation, ITMonitoring };
