import React from 'react'
import { I, Icon } from '../components/icons.jsx'
import { Btn, Card, KPI, Field, Tabs, Stepper, Toggle, Modal, Avatar, Bar, Pill } from '../components/ui.jsx'
import { Sparkline, AreaChart, Gauge, Donut, fakeSeries } from '../components/charts.jsx'
import { StrataLogo, StrataWordmark } from '../components/brand.jsx'
import { dashboardApi, resourcesApi } from '../api/index.js'
import { Loading, EmptyState, usePolledData } from '../components/feedback.jsx'

// page-dashboard.jsx — main account overview (HIGH POLISH)

const REGIONS = [
  { id: "nyc3", city: "New York",   xy: [196, 168], capacity: 0.82, hot: true },
  { id: "sfo3", city: "San Francisco", xy: [108, 180], capacity: 0.64 },
  { id: "lhr1", city: "London",     xy: [438, 152], capacity: 0.71, hot: true },
  { id: "fra1", city: "Frankfurt",  xy: [468, 162], capacity: 0.78 },
  { id: "ams1", city: "Amsterdam",  xy: [452, 144], capacity: 0.42 },
  { id: "blr1", city: "Bangalore",  xy: [612, 232], capacity: 0.55 },
  { id: "sgp1", city: "Singapore",  xy: [680, 268], capacity: 0.61 },
  { id: "syd1", city: "Sydney",     xy: [760, 348], capacity: 0.38 },
  { id: "tor1", city: "Toronto",    xy: [186, 156], capacity: 0.49 },
  { id: "alg1", city: "Algiers",    xy: [428, 188], capacity: 0.31 },
  { id: "gru1", city: "São Paulo",  xy: [266, 318], capacity: 0.66 },
  { id: "nrt1", city: "Tokyo",      xy: [738, 200], capacity: 0.74 },
];

function RegionMap({ onSelect }) {
  // Simple world map silhouette via SVG paths (rough continents, not geographic)
  return (
    <svg viewBox="0 0 860 420" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <radialGradient id="map-g" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.1"/>
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="860" height="420" fill="url(#map-g)"/>
      {/* Dot-grid world map */}
      {Array.from({ length: 30 }).map((_, ry) =>
        Array.from({ length: 60 }).map((_, rx) => {
          const x = rx * 14 + 8, y = ry * 14 + 8;
          // Rough continent mask: cluster dots in continental regions
          const inLand =
            (x > 80 && x < 240 && y > 110 && y < 250) || // N. America
            (x > 240 && x < 320 && y > 240 && y < 360) || // S. America
            (x > 380 && x < 540 && y > 120 && y < 220) || // Europe
            (x > 380 && x < 540 && y > 180 && y < 320) || // Africa
            (x > 540 && x < 740 && y > 130 && y < 280) || // Asia
            (x > 700 && x < 800 && y > 300 && y < 380);   // Oceania
          if (!inLand) return null;
          return (
            <circle key={`${rx}-${ry}`} cx={x} cy={y} r="1.2" fill="var(--hairline-2)"/>
          );
        })
      )}
      {/* Region dots */}
      {REGIONS.map(r => (
        <g key={r.id} style={{ cursor: "pointer" }} onClick={() => onSelect && onSelect(r)}>
          <circle cx={r.xy[0]} cy={r.xy[1]} r="14" fill="var(--accent)" opacity="0.18"
                  style={{ animation: r.hot ? "pulse 2s ease-in-out infinite" : "none" }}/>
          <circle cx={r.xy[0]} cy={r.xy[1]} r="5" className={`region-dot ${r.hot ? "hot" : ""}`}/>
          <text x={r.xy[0]} y={r.xy[1] - 14} textAnchor="middle"
                fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--f-mono)">{r.id.toUpperCase()}</text>
        </g>
      ))}
    </svg>
  );
}

function ResourceRow({ icon, name, kind, region, status, plan, ip, onClick }) {
  const statusColor = { running: "good", deploying: "warn", stopped: "", failed: "bad" }[status] || "";
  return (
    <tr onClick={onClick} style={{ cursor: "pointer" }}>
      <td>
        <div className="row" style={{ gap: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "color-mix(in oklab, var(--accent) 12%, transparent)",
            color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>{icon}</div>
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div className="mute mono" style={{ fontSize: 11 }}>{ip}</div>
          </div>
        </div>
      </td>
      <td className="mono" style={{ fontSize: 12 }}>{kind}</td>
      <td>{region}</td>
      <td><Pill kind={statusColor} dot>{status}</Pill></td>
      <td className="mute" style={{ fontSize: 12.5 }}>{plan}</td>
      <td style={{ textAlign: "right" }}><I.chevR size={14} stroke="var(--text-mute)"/></td>
    </tr>
  );
}

const DEMO_RESOURCES = [
  { kind: "vm",   name: "web-prod-01",   id: 1, image: "Ubuntu 24.04", region: "NYC3",  status: "running",   plan: "Standard · 2vCPU · 4GB",  ip: "164.92.118.42" },
  { kind: "vm",   name: "db-primary",    id: 2, image: "Debian 12",    region: "FRA1",  status: "running",   plan: "Memory · 8vCPU · 64GB",   ip: "146.190.84.118" },
  { kind: "cnt",  name: "api-edge",      id: 3, image: "nginx:alpine", region: "LHR1",  status: "running",   plan: "0.5 vCPU · 512MB",        ip: "10.20.4.18" },
  { kind: "cnt",  name: "worker-queue",  id: 4, image: "node:20",      region: "NYC3",  status: "deploying", plan: "1 vCPU · 2GB",            ip: "10.20.4.22" },
  { kind: "vm",   name: "build-runner",  id: 5, image: "Windows 2022", region: "SFO3",  status: "stopped",   plan: "Perf · 4vCPU · 16GB",     ip: "—" },
];

function fmtMoney(n, dp = 2) { return '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp }) }
function dTimeAgo(iso) {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function PageDashboard({ onGo, user }) {
  const { data: dash } = usePolledData(() => dashboardApi.get(), {
    shouldPoll: (d) => d && d.recent?.some(r => r.status === "deploying" || r.status === "rebooting"),
    interval: 3500,
  });
  const { data: resources } = usePolledData(() => resourcesApi.list(), {
    shouldPoll: (d) => Array.isArray(d) && d.some(r => r.status === "deploying" || r.status === "rebooting"),
    interval: 3500,
  });

  if (!dash) return (
    <div>
      <div className="page-h"><div><h1>{greeting()}, {user?.name?.split(" ")[0] || "there"}.</h1><div className="sub">Loading your cloud…</div></div></div>
      <Loading/>
    </div>
  );

  const { counts, spend, capacity, regions, cpuSeries, netSeries } = dash;
  const creditPct = spend.credit > 0 ? Math.min(100, Math.round((spend.monthly / spend.credit) * 100)) : 0;
  const perSec = spend.hourly / 3600;
  const activeRes = (resources || []).filter(r => r.status !== "stopped");
  const maxRate = Math.max(...activeRes.map(r => r.hourly_rate), 0.0001);
  const hasResources = counts.total > 0;

  return (
    <div>
      {/* Greeting + CTA row */}
      <div className="page-h">
        <div>
          <h1>{greeting()}, {user?.name?.split(" ")[0] || "there"}.</h1>
          <div className="sub">
            {hasResources
              ? `${counts.running} running · ${counts.total} total · ${fmtMoney(spend.today)} spent today`
              : `Welcome to STRATA Cloud · ${fmtMoney(spend.credit, 0)} credit ready to use`}
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <Btn kind="primary" icon={<I.plus size={14}/>} onClick={() => onGo("portal-create-vps")}>
            Create resource
          </Btn>
        </div>
      </div>

      {!hasResources ? (
        <EmptyState
          icon={<I.bolt size={28}/>}
          title="Your cloud is ready — let's deploy something"
          body={`You have ${fmtMoney(spend.credit, 0)} in credit waiting. Spin up your first VM or container in under a minute. No card required.`}
          action="Deploy your first VM"
          onAction={() => onGo("portal-create-vps")}
        />
      ) : (
      <>
      {/* KPI row */}
      <div className="g cols-4" style={{ marginBottom: 18 }}>
        <Card>
          <KPI label="Resources" value={String(counts.total)} delta={`${counts.vms} VM · ${counts.containers} ctr`} icon={<I.server size={13}/>}/>
          <div style={{ marginTop: 12 }}>
            <Sparkline data={cpuSeries.slice(-20).map(v => v / 5)} width={220} height={36} stroke="var(--accent)"/>
          </div>
        </Card>
        <Card>
          <KPI label="Monthly spend" value={fmtMoney(spend.monthly)} delta={`of ${fmtMoney(spend.credit, 0)} credit`} icon={<I.cash size={13}/>}/>
          <div style={{ marginTop: 12 }}>
            <Bar pct={creditPct} kind={creditPct > 80 ? "warn" : ""}/>
          </div>
        </Card>
        <Card>
          <KPI label="Provisioned vCPU" value={String(capacity.vcpu)} delta={`${capacity.ram_gb} GB RAM`} icon={<I.cpu size={13}/>}/>
          <div style={{ marginTop: 12 }}>
            <Sparkline data={cpuSeries.slice(-20)} width={220} height={36} stroke="var(--accent-2)"/>
          </div>
        </Card>
        <Card>
          <KPI label="Running now" value={String(counts.running)} delta={`across ${regions.length} region${regions.length===1?"":"s"}`} icon={<I.signal size={13}/>}/>
          <div style={{ marginTop: 12 }}>
            <Sparkline data={netSeries.slice(-20)} width={220} height={36} stroke="var(--good)"/>
          </div>
        </Card>
      </div>

      {/* Usage chart + hourly billing meter */}
      <div className="g cols-12" style={{ marginBottom: 18 }}>
        <div style={{ gridColumn: "span 8" }}>
          <Card title="Usage · last 48 hours" action={<Pill kind="accent" dot>Live</Pill>}>
            <div className="row" style={{ gap: 32, marginBottom: 14 }}>
              <div>
                <div className="mute" style={{ fontSize: 11 }}>CPU UTILIZATION</div>
                <div className="row" style={{ gap: 6, marginTop: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--accent)" }}/>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{Math.round(cpuSeries.reduce((a,b)=>a+b,0)/cpuSeries.length)}% avg</span>
                </div>
              </div>
              <div>
                <div className="mute" style={{ fontSize: 11 }}>NETWORK OUT</div>
                <div className="row" style={{ gap: 6, marginTop: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--accent-2)" }}/>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{(netSeries[netSeries.length-1]/100).toFixed(1)} GB/h</span>
                </div>
              </div>
            </div>
            <AreaChart
              width={620} height={220}
              series={[
                { name: "cpu",     data: cpuSeries },
                { name: "network", data: netSeries.map(v => v / 4) },
              ]}
              colors={["var(--accent)", "var(--accent-2)"]}
              xLabels={["48h ago", "36h", "24h", "12h", "now"]}
            />
          </Card>
        </div>
        <div style={{ gridColumn: "span 4" }}>
          <Card title="Hourly billing meter" action={<Pill kind="good" dot>Metered</Pill>}>
            <div className="col" style={{ gap: 18 }}>
              <div>
                <div className="row" style={{ alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em" }}>{fmtMoney(perSec, 4)}</span>
                  <span className="mute" style={{ fontSize: 12 }}>/sec accruing</span>
                </div>
                <div className="mute" style={{ fontSize: 12, marginTop: 2 }}>Across {counts.running} running resource{counts.running===1?"":"s"}</div>
              </div>
              <div className="col" style={{ gap: 8 }}>
                {activeRes.slice(0, 5).map(r => (
                  <div key={r.id} className="col" style={{ gap: 4, cursor: "pointer" }}
                    onClick={() => onGo((r.kind === "vm" ? "portal-vps-detail-" : "portal-cnt-detail-") + r.id)}>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12.5 }} className="mono">{r.name}</span>
                      <span className="mute mono" style={{ fontSize: 11 }}>{fmtMoney(r.hourly_rate, 4)}/hr</span>
                    </div>
                    <Bar pct={Math.round((r.hourly_rate / maxRate) * 100)}/>
                  </div>
                ))}
                {activeRes.length === 0 && <span className="mute" style={{ fontSize: 12.5 }}>Nothing running — $0.00/hr.</span>}
              </div>
              <div className="banner" style={{ fontSize: 12 }}>
                <I.bolt size={14} stroke="var(--info)"/>
                <span>Charges accrue every second. No hourly rounding.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Resources table */}
      <Card
        title="Your fleet"
        action={<Btn kind="ghost sm" onClick={() => onGo("portal-vps-list")}>View all →</Btn>}
        pad={false}
      >
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ paddingLeft: 22 }}>Name</th>
                <th>Image</th>
                <th>Region</th>
                <th>Status</th>
                <th>Plan</th>
                <th style={{ paddingRight: 22 }}></th>
              </tr>
            </thead>
            <tbody>
              {(resources || []).slice(0, 8).map(r => (
                <ResourceRow
                  key={r.id}
                  icon={r.kind === "vm" ? <I.server size={15}/> : <I.cloud size={15}/>}
                  name={r.name}
                  kind={r.kind === "vm" ? r.os : r.image}
                  region={r.region?.toUpperCase()}
                  status={r.status}
                  plan={r.plan_id}
                  ip={r.ip}
                  onClick={() => onGo((r.kind === "vm" ? "portal-vps-detail-" : "portal-cnt-detail-") + r.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Compute breakdown + activity feed */}
      <div className="g cols-12" style={{ marginTop: 18 }}>
        <div style={{ gridColumn: "span 7" }}>
          <Card title="Compute breakdown" action={<Pill kind="accent">{counts.total} total</Pill>}>
            {counts.total === 0 ? (
              <div className="mute" style={{ fontSize: 13, padding: "30px 0", textAlign: "center" }}>No resources deployed yet.</div>
            ) : (
            <>
              {/* By type */}
              <div className="col" style={{ gap: 16 }}>
                {[
                  { label: "Virtual machines", count: counts.vms,        total: counts.total, color: "var(--accent)" },
                  { label: "Containers",       count: counts.containers, total: counts.total, color: "var(--accent-2)" },
                  { label: "Running",          count: counts.running,    total: counts.total, color: "var(--good)" },
                ].map(b => (
                  <div key={b.label}>
                    <div className="row" style={{ justifyContent: "space-between", marginBottom: 6, fontSize: 12.5 }}>
                      <span style={{ color: "var(--text-dim)" }}>{b.label}</span>
                      <span className="mono" style={{ fontWeight: 500 }}>{b.count} <span className="mute">/ {b.total}</span></span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${b.total ? (b.count/b.total)*100 : 0}%`, background: b.color, borderRadius: 999, transition: "width 0.6s ease" }}/>
                    </div>
                  </div>
                ))}
              </div>
              {/* Capacity totals */}
              <div className="divider"/>
              <div className="g cols-3" style={{ gap: 12 }}>
                {[
                  { label: "Total vCPU", value: capacity.vcpu, icon: <I.cpu size={14}/> },
                  { label: "Total RAM",  value: `${capacity.ram_gb} GB`, icon: <I.layers size={14}/> },
                  { label: "Storage",    value: `${capacity.storage_gb} GB`, icon: <I.database size={14}/> },
                ].map(c => (
                  <div key={c.label} style={{ background: "var(--surface-3)", borderRadius: 10, padding: "14px 16px" }}>
                    <div className="row" style={{ gap: 8, color: "var(--text-mute)", marginBottom: 6 }}>
                      {c.icon}<span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.label}</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>{c.value}</div>
                  </div>
                ))}
              </div>
            </>
            )}
          </Card>
        </div>
        <div style={{ gridColumn: "span 5" }}>
          <Card title="Activity">
            <div className="col" style={{ gap: 14 }}>
              {dash.recent.length === 0 && <span className="mute" style={{ fontSize: 13 }}>No activity yet.</span>}
              {dash.recent.map((a) => {
                const k = a.status === "running" ? "good" : a.status === "deploying" ? "warn" : a.status === "stopped" ? "" : "accent";
                return (
                <div key={a.id} className="row" style={{ gap: 12, alignItems: "flex-start", cursor: "pointer" }}
                  onClick={() => onGo((a.kind === "vm" ? "portal-vps-detail-" : "portal-cnt-detail-") + a.id)}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `color-mix(in oklab, var(--${k || "text-mute"}) 14%, transparent)`,
                    color: `var(--${k || "text-dim"})`,
                  }}>{a.kind === "vm" ? <I.server size={12}/> : <I.cloud size={12}/>}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ justifyContent: "space-between", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }} className="mono">{a.name}</span>
                      <span className="mute" style={{ fontSize: 11, whiteSpace: "nowrap" }}>{dTimeAgo(a.created_at)}</span>
                    </div>
                    <div className="mute" style={{ fontSize: 11.5, marginTop: 2 }}>{a.status} · {a.region?.toUpperCase()}</div>
                  </div>
                </div>
              )})}
            </div>
          </Card>
        </div>
      </div>
      </>
      )}

      {/* Quick actions — all real navigations */}
      <div className="g cols-3" style={{ marginTop: 18 }}>
        {[
          { ico: <I.server size={18}/>, h: "Deploy a VM",      p: "Pick an image and a plan — provisioned in under a minute.", cta: "Create VM",     action: () => onGo("portal-create-vps") },
          { ico: <I.cloud size={18}/>,  h: "Run a container",  p: "Pull any OCI image with auto-HTTPS and health checks.",      cta: "Run container", action: () => onGo("portal-create-container") },
          { ico: <I.grid size={18}/>,   h: "Browse the catalog", p: "Explore images, runtimes, and one-click stacks.",          cta: "Open catalog",  action: () => onGo("portal-catalog") },
        ].map((q, i) => (
          <Card key={i}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "color-mix(in oklab, var(--accent) 14%, transparent)",
              color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 12,
            }}>{q.ico}</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{q.h}</div>
            <div className="dim" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{q.p}</div>
            <Btn kind="ghost sm" icon={<I.arrowR size={12}/>} onClick={q.action} style={{ marginTop: 12, paddingLeft: 0 }}>
              {q.cta}
            </Btn>
          </Card>
        ))}
      </div>
    </div>
  );
}


export { PageDashboard, RegionMap, DEMO_RESOURCES }
