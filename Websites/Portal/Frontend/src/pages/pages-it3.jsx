import React from 'react'
import { I } from '../components/icons.jsx'
import { Card, Stat, Pill, SectionHeader, Avatar, TabBar, Progress, Sparkline, useLiveSeries } from '../components/ui.jsx'
import { BarChart, IncidentTimeline, SpineLeafDiagram } from '../components/charts.jsx'
import { clientsApi } from '../api/index.js'

// pages-it3.jsx — IT Cloud Platform pages: Fabric, Workloads

function ITFabric() {
  const ecmp = useLiveSeries([2.3, 2.5, 2.4, 2.6, 2.5, 2.4, 2.6, 2.5, 2.4, 2.6, 2.5], { interval: 2000, min: 1.8, max: 3.2, step: 0.05 });
  const [failed, setFailed] = React.useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Network Fabric" subtitle="Clos spine-leaf · ECMP load distribution · top-of-rack design."
        breadcrumbs={["IT Workspace", "Cloud Platform", "Fabric"]}
        actions={<>
          <button className="btn" onClick={() => setFailed(failed === 0 ? null : 0)}>
            <I.bolt size={14}/>{failed !== null ? "Restore spine-1" : "Simulate spine-1 fail"}
          </button>
          <button className="btn"><I.refresh size={14}/>Re-balance</button>
        </>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card><Stat label="Spines" value="2" delta={failed === null ? "both online" : "1 down"} deltaTone={failed === null ? "good" : "bad"}/></Card>
        <Card><Stat label="Leaves" value="3" delta="all online" deltaTone="good"/></Card>
        <Card>
          <Stat label="Avg ECMP paths" value={ecmp[ecmp.length-1].toFixed(2)} hint="per leaf-to-leaf flow"/>
          <Sparkline data={ecmp} color="var(--accent)" height={36}/>
        </Card>
        <Card><Stat label="Fabric throughput" value="38.4" suffix="Gbps" delta="peak 52.1" /></Card>
      </div>

      <Card title="Topology" subtitle={failed !== null ? "spine-1 simulated failure — traffic re-converged on remaining spine" : "All spine-leaf uplinks healthy · ECMP active"}>
        <SpineLeafDiagram spines={2} leaves={3} hostsPerLeaf={4} failedSpine={failed} height={300}/>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Uplinks · live utilization" subtitle="Each leaf has 2 uplinks (one per spine)">
          <table className="tbl">
            <thead><tr><th>Link</th><th>From</th><th>To</th><th>Capacity</th><th>Util</th><th>Status</th></tr></thead>
            <tbody>
              {[
                { id: "u-l1-s1", from: "leaf-1", to: "spine-1", cap: "100G", util: 42, s: failed === 0 ? "bad" : "good" },
                { id: "u-l1-s2", from: "leaf-1", to: "spine-2", cap: "100G", util: failed === 0 ? 78 : 41, s: "good" },
                { id: "u-l2-s1", from: "leaf-2", to: "spine-1", cap: "100G", util: 58, s: failed === 0 ? "bad" : "good" },
                { id: "u-l2-s2", from: "leaf-2", to: "spine-2", cap: "100G", util: failed === 0 ? 92 : 54, s: failed === 0 ? "warn" : "good" },
                { id: "u-l3-s1", from: "leaf-3", to: "spine-1", cap: "100G", util: 35, s: failed === 0 ? "bad" : "good" },
                { id: "u-l3-s2", from: "leaf-3", to: "spine-2", cap: "100G", util: failed === 0 ? 71 : 38, s: "good" },
              ].map(r => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{r.from}</td>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{r.to}</td>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{r.cap}</td>
                  <td style={{ width: 110 }}><Progress value={r.util} tone={r.s === "bad" ? "bad" : r.util > 80 ? "warn" : "accent"}/></td>
                  <td><Pill tone={r.s}>{r.s === "good" ? "up" : r.s === "warn" ? "saturating" : "down"}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Spine status">
          {[
            { n: "spine-1", model: "Mellanox SN5600", ports: 32, used: 6, s: failed === 0 ? "bad" : "good" },
            { n: "spine-2", model: "Mellanox SN5600", ports: 32, used: 6, s: "good" },
          ].map((sp, i) => (
            <div key={sp.n} style={{ padding: "14px 0", borderTop: i ? "0.5px solid var(--hairline)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }} className="mono">{sp.n}</span>
                <Pill tone={sp.s}>{sp.s === "good" ? "online" : "down"}</Pill>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginBottom: 8 }}>{sp.model} · {sp.used}/{sp.ports} ports used</div>
              {sp.s === "good" && <Sparkline data={[42,38,45,41,40,44,42,46,43,41,45,42,40,43,41]} color="var(--accent)" height={32}/>}
              {sp.s === "bad" && (
                <div style={{ padding: 10, borderRadius: 8, background: "color-mix(in oklab, var(--bad) 12%, transparent)", border: "0.5px solid color-mix(in oklab, var(--bad) 30%, transparent)", fontSize: 11, color: "var(--bad)" }}>
                  Down for 4m 12s · ECMP re-converged on spine-2 in 218ms · 0 packets dropped
                </div>
              )}
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Leaves · top-of-rack" subtitle="Each leaf is one rack of compute hosts">
          {[
            { n: "leaf-1", hosts: 4, vms: 84, ports: 24 },
            { n: "leaf-2", hosts: 4, vms: 92, ports: 24 },
            { n: "leaf-3", hosts: 4, vms: 76, ports: 24 },
          ].map((l, i) => (
            <div key={l.n} style={{ padding: "14px 0", borderTop: i ? "0.5px solid var(--hairline)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }} className="mono">{l.n}</span>
                <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-mute)" }}>
                  <span>{l.hosts} hosts</span><span>·</span>
                  <span>{l.vms} workloads</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${l.ports}, 1fr)`, gap: 3 }}>
                {Array.from({ length: l.ports }).map((_, p) => {
                  const used = p < l.hosts + 2; // uplinks + hosts
                  return <div key={p} style={{
                    aspectRatio: "1", borderRadius: 2,
                    background: used ? "var(--accent-2)" : "var(--surface-3)",
                    boxShadow: used ? "0 0 4px color-mix(in oklab, var(--accent-2) 50%, transparent)" : "none",
                  }} title={`port ${p+1}`}/>;
                })}
              </div>
            </div>
          ))}
        </Card>

        <Card title="Recent fabric events">
          <IncidentTimeline events={failed === null ? [
            { tone: "good", title: "ECMP convergence: stable",       desc: "All 6 uplinks healthy · 2 paths per leaf-to-leaf", time: "now" },
            { tone: "info", title: "Optic temp warning cleared",     desc: "leaf-2 port 18 · was 71°C · now 62°C",            time: "12m ago" },
            { tone: "good", title: "Maintenance complete",           desc: "spine-2 firmware upgrade · 0 packet loss",         time: "2h ago" },
            { tone: "info", title: "Capacity threshold",             desc: "Approaching 70% utilization in leaf-2",            time: "yesterday" },
          ] : [
            { tone: "bad",  title: "spine-1 unreachable",             desc: "All uplinks to spine-1 down · ECMP re-converged",  time: "now" },
            { tone: "warn", title: "Re-convergence triggered",        desc: "All leaves now ECMP via spine-2 only",              time: "now" },
            { tone: "info", title: "Customer impact: none observed",  desc: "0 packet loss measured · no SLA breach",            time: "now" },
          ]}/>
        </Card>
      </div>
    </div>
  );
}

function ITWorkloads() {
  const [tab, setTab] = React.useState("vms");
  const [filter, setFilter] = React.useState("all");
  const [clients, setClients] = React.useState(null);
  const [stats, setStats] = React.useState(null);
  React.useEffect(() => {
    clientsApi.list().then(setClients).catch(() => {})
    clientsApi.stats().then(setStats).catch(() => {})
  }, []);

  const vms = [
    { id: "vm-2841a", name: "atlas-web-01",     customer: "Atlas Cloud",      os: "Ubuntu 22.04",  ip: "10.42.18.4",  flavor: "c2-large (4·8)", host: "host-03", leaf: "leaf-2", st: "running",  age: "4d" },
    { id: "vm-2840b", name: "atlas-db-01",      customer: "Atlas Cloud",      os: "Debian 12",     ip: "10.42.18.5",  flavor: "m1-xlarge (8·32)", host: "host-04", leaf: "leaf-2", st: "running",  age: "4d" },
    { id: "vm-2837c", name: "helios-api-prod",  customer: "Helios Tech",      os: "Ubuntu 24.04",  ip: "10.42.22.8",  flavor: "c2-medium (2·4)", host: "host-07", leaf: "leaf-3", st: "running",  age: "11d" },
    { id: "vm-2830d", name: "nexion-runner",    customer: "Nexion SARL",      os: "Windows Server 2022", ip: "10.42.14.3", flavor: "g1-small (2·8)",   host: "host-02", leaf: "leaf-1", st: "running",  age: "2d" },
    { id: "vm-2828a", name: "maris-bastion",    customer: "Maris Logistics",  os: "Alma Linux 9",  ip: "10.42.16.21", flavor: "c1-small (1·2)",  host: "host-01", leaf: "leaf-1", st: "running",  age: "26d" },
    { id: "vm-2822e", name: "saharan-train-04", customer: "Saharan AI",       os: "Ubuntu 22.04",  ip: "10.42.30.41", flavor: "g2-xlarge (16·64 + GPU)", host: "host-06", leaf: "leaf-3", st: "running",  age: "1d" },
    { id: "vm-2814b", name: "riadh-erp",        customer: "Riadh Capital",    os: "Debian 12",     ip: "10.42.18.12", flavor: "m1-large (4·16)", host: "host-03", leaf: "leaf-2", st: "stopped",  age: "8d" },
    { id: "vm-2802c", name: "karkur-staging",   customer: "Karkur Studios",   os: "Ubuntu 22.04",  ip: "10.42.14.8",  flavor: "c1-small (1·2)",  host: "host-02", leaf: "leaf-1", st: "rebooting",age: "3d" },
    { id: "vm-2791d", name: "atlas-cache-01",   customer: "Atlas Cloud",      os: "Alma Linux 9",  ip: "10.42.22.14", flavor: "m1-medium (2·8)", host: "host-07", leaf: "leaf-3", st: "running",  age: "32d" },
    { id: "vm-2784a", name: "helios-worker-3",  customer: "Helios Tech",      os: "Ubuntu 24.04",  ip: "10.42.16.22", flavor: "c2-medium (2·4)", host: "host-01", leaf: "leaf-1", st: "error",    age: "14h" },
  ];

  const ctrs = [
    { id: "ct-8421",  name: "atlas/api-gw",         customer: "Atlas Cloud",  image: "nginx:1.27-alpine",  ports: "80,443", host: "host-05", st: "running", age: "4d" },
    { id: "ct-8419",  name: "atlas/redis-cache",    customer: "Atlas Cloud",  image: "redis:7.4",          ports: "6379",   host: "host-05", st: "running", age: "4d" },
    { id: "ct-8418",  name: "atlas/web-1",          customer: "Atlas Cloud",  image: "registry.atlas/web:v18", ports: "8080", host: "host-05", st: "running", age: "4d" },
    { id: "ct-8418b", name: "atlas/web-2",          customer: "Atlas Cloud",  image: "registry.atlas/web:v18", ports: "8080", host: "host-06", st: "running", age: "4d" },
    { id: "ct-8417",  name: "helios/ml-worker-1",   customer: "Helios Tech",  image: "python:3.12-slim",   ports: "—",      host: "host-06", st: "running", age: "11d" },
    { id: "ct-8417b", name: "helios/ml-worker-2",   customer: "Helios Tech",  image: "python:3.12-slim",   ports: "—",      host: "host-06", st: "running", age: "11d" },
    { id: "ct-8412",  name: "maris/scheduler",      customer: "Maris Logistics", image: "node:22-alpine",  ports: "3000",   host: "host-05", st: "running", age: "9d" },
    { id: "ct-8408",  name: "nexion/build-cache",   customer: "Nexion SARL",  image: "alpine:3.20",        ports: "—",      host: "host-06", st: "exited",  age: "2h" },
  ];

  const rows = tab === "vms" ? vms : ctrs;
  const filtered = filter === "all" ? rows : rows.filter(r => r.st === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Workloads" subtitle="Customer-provisioned VMs & containers · admins monitor, customers self-serve."
        breadcrumbs={["IT Workspace", "Cloud Platform", "Workloads"]}
        actions={<>
          <input className="input" placeholder="Search workload, IP, customer…" style={{ width: 280 }}/>
          <button className="btn"><I.download size={14}/>Export CSV</button>
        </>}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card><Stat label="VMs running" value={stats ? (stats.total_vms||0).toLocaleString() : '…'} deltaTone="good"/></Card>
        <Card><Stat label="Containers running" value={stats ? (stats.total_containers||0).toLocaleString() : '…'} deltaTone="good"/></Card>
        <Card><Stat label="Active customers" value={stats ? stats.active : '…'} deltaTone="good"/></Card>
        <Card><Stat label="At risk" value={stats ? stats.at_risk||0 : '…'} deltaTone="warn"/></Card>
      </div>

      <Card title={tab === "vms" ? "Virtual machines" : "Containers"} subtitle="Read-only inventory · provisioning happens through the customer portal"
            action={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <TabBar dense tabs={[
                  { id: "all",       label: "All" },
                  { id: "running",   label: "Running" },
                  { id: "stopped",   label: "Stopped" },
                  { id: "error",     label: "Error" },
                ]} active={filter} onChange={setFilter}/>
                <TabBar dense tabs={[{ id: "vms", label: "VMs" }, { id: "containers", label: "Containers" }]} active={tab === "vms" ? "vms" : "containers"} onChange={(v) => setTab(v === "vms" ? "vms" : "ctrs")}/>
              </div>
            }>
        {tab === "vms" ? (
          <table className="tbl">
            <thead><tr><th>ID</th><th>Name</th><th>Customer</th><th>OS</th><th>Flavor</th><th>IP</th><th>Host</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td className="mono">{v.id}</td>
                  <td><span className="mono" style={{ color: "var(--text)" }}>{v.name}</span></td>
                  <td style={{ color: "var(--text-dim)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={v.customer} size={22}/> <span>{v.customer}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-dim)", whiteSpace: "nowrap" }}>{v.os}</td>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{v.flavor}</td>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{v.ip}</td>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{v.host}</td>
                  <td><Pill tone={
                    v.st === "running" ? "good" : v.st === "error" ? "bad" : v.st === "stopped" ? undefined : "warn"
                  }>{v.st}</Pill></td>
                  <td style={{ textAlign: "right" }}><button className="btn ghost icon"><I.more size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="tbl">
            <thead><tr><th>ID</th><th>Name</th><th>Customer</th><th>Image</th><th>Ports</th><th>Host</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td className="mono">{c.id}</td>
                  <td><span className="mono" style={{ color: "var(--text)" }}>{c.name}</span></td>
                  <td style={{ color: "var(--text-dim)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={c.customer} size={22}/> <span>{c.customer}</span>
                    </div>
                  </td>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{c.image}</td>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{c.ports}</td>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{c.host}</td>
                  <td><Pill tone={c.st === "running" ? "good" : c.st === "exited" ? undefined : "warn"}>{c.st}</Pill></td>
                  <td style={{ textAlign: "right" }}><button className="btn ghost icon"><I.more size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="By customer (top 5)">
          {clients?.length
            ? <BarChart data={clients.slice().sort((a,b)=>(b.vm_count+b.container_count)-(a.vm_count+a.container_count)).slice(0,5).map(c=>({ label:c.name.split(' ')[0], value:(c.vm_count||0)+(c.container_count||0) }))} height={140}/>
            : <div style={{padding:24,textAlign:'center',color:'var(--text-mute)',fontSize:13}}>Loading…</div>}
        </Card>
        <Card title="By OS image">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { n: "Ubuntu 22.04", v: 38, c: "var(--accent)" },
              { n: "Ubuntu 24.04", v: 24, c: "var(--accent-2)" },
              { n: "Debian 12",    v: 14, c: "var(--info)" },
              { n: "Alma Linux 9", v: 10, c: "var(--good)" },
              { n: "Windows Srv 2022", v: 8, c: "var(--warn)" },
              { n: "Other",        v: 6,  c: "var(--text-mute)" },
            ].map(o => (
              <div key={o.n} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: o.c }}/>
                <span style={{ flex: 1, fontSize: 12, color: "var(--text-dim)" }}>{o.n}</span>
                <span className="mono" style={{ fontSize: 12 }}>{o.v}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Provisioning rate · 7d">
          <Sparkline data={[148, 162, 172, 158, 184, 196, 184]} color="var(--accent)" height={80}/>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12 }}>
            <span style={{ color: "var(--text-dim)" }}>Avg / day</span>
            <span className="mono">172 workloads</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "var(--text-dim)" }}>Median provision time</span>
            <span className="mono">38s</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

export { ITFabric, ITWorkloads };
