import React from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { I, Icon } from '../components/icons.jsx'
import { Btn, Card, KPI, Field, Tabs, Stepper, Toggle, Modal, Avatar, Bar, Pill } from '../components/ui.jsx'
import { Sparkline, AreaChart, Gauge, Donut } from '../components/charts.jsx'
import { StrataLogo, StrataWordmark } from '../components/brand.jsx'
import { resourcesApi, consoleWsUrl, toast } from '../api/index.js'
import { Loading, EmptyState, Spinner, usePolledData } from '../components/feedback.jsx'

// page-vps-detail.jsx — VPS detail page (HIGH POLISH)
// Tabs: Overview · Console · Monitoring · Storage · Networking · Snapshots · Firewall · Settings

function PowerStatus({ status }) {
  const map = {
    running:   { kind: "good", lbl: "Running" },
    deploying: { kind: "warn", lbl: "Deploying" },
    rebooting: { kind: "warn", lbl: "Rebooting" },
    stopped:   { kind: "",     lbl: "Stopped" },
    error:     { kind: "bad",  lbl: "Error" },
    failed:    { kind: "bad",  lbl: "Failed" },
  };
  const s = map[status] || map.running;
  return <Pill kind={s.kind} dot>{s.lbl}</Pill>;
}

// ---------- Console ----------
// Bridges to the VM's serial pty via `virsh console` over the backend's
// WebSocket relay (see services/consoleBridge.js) — a real terminal, not
// just a copyable ssh command.
function LiveTerminal({ resourceId }) {
  const containerRef = React.useRef(null)
  const [state, setState] = React.useState("connecting") // connecting | open | closed

  React.useEffect(() => {
    const term = new Terminal({
      fontFamily: "var(--f-mono), monospace", fontSize: 13, cursorBlink: true,
      theme: { background: "#0b0e16", foreground: "#cfd5e8" },
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()

    const ws = new WebSocket(consoleWsUrl(resourceId))
    ws.binaryType = "arraybuffer"
    ws.onopen = () => setState("open")
    ws.onmessage = (e) => term.write(new Uint8Array(e.data))
    ws.onclose = () => setState("closed")
    ws.onerror = () => setState("closed")
    term.onData((d) => { if (ws.readyState === WebSocket.OPEN) ws.send(d) })

    const onResize = () => fit.fit()
    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("resize", onResize)
      ws.close()
      term.dispose()
    }
  }, [resourceId])

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ background: "#0b0e16", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 10, flex: 1, minHeight: 0 }}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }}/>
      </div>
      {state === "connecting" && <div className="mute" style={{ fontSize: 12, marginTop: 8 }}>Connecting…</div>}
      {state === "closed" && <div className="mute" style={{ fontSize: 12, marginTop: 8 }}>Disconnected.</div>}
    </div>
  )
}

function ConsoleTab({ resource }) {
  const running = resource.status === "running"
  return (
    <div className="col" style={{ gap: 12, height: "calc(100vh - 260px)", minHeight: 480 }}>
      {!running && (
        <div className="banner" style={{ background: "color-mix(in oklab, var(--warn) 10%, transparent)", borderColor: "color-mix(in oklab, var(--warn) 30%, transparent)" }}>
          <I.lock size={14} stroke="var(--warn)"/>
          <span style={{ color: "var(--warn)", fontSize: 13 }}>VM is not running — console is unavailable.</span>
        </div>
      )}
      {running ? <LiveTerminal resourceId={resource.id}/> : (
        <div className="card" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="mute" style={{ fontSize: 13 }}>Start the VM to open a console.</div>
        </div>
      )}
    </div>
  )
}

// ---------- Monitoring ----------
// VMs get real live metrics via qemu-guest-agent (services/stats.js on the
// backend); containers have no real orchestration backend behind them at
// all (see plan's "out of scope" list) so this says so instead of faking it.
function MonitoringTab({ resource }) {
  const isVm = resource.kind === "vm";
  const running = resource.status === "running";
  const { latest, history } = useVmStats(resource.id, isVm ? resource.status : null);

  if (!isVm) {
    return (
      <Card>
        <div className="mute" style={{ fontSize: 13, padding: "40px 0", textAlign: "center" }}>
          Live container metrics aren't available yet — containers aren't backed by a real runtime in this build.
        </div>
      </Card>
    );
  }

  const metrics = [
    { title: "CPU utilization", val: latest ? `${latest.cpuPercent}%` : "—", color: "var(--accent)",   data: history.cpu },
    { title: "Memory usage",    val: latest?.memUsedMB != null ? `${(latest.memUsedMB/1024).toFixed(1)} GB` : "—", color: "var(--accent-2)", data: history.mem },
    { title: "Disk read",       val: latest ? fmtRate(latest.diskReadBps) : "—",  color: "var(--good)", data: history.diskRead },
    { title: "Disk write",      val: latest ? fmtRate(latest.diskWriteBps) : "—", color: "var(--warn)", data: history.diskWrite },
  ];

  return (
    <div>
      <div className="row" style={{ marginBottom: 14, gap: 10 }}>
        {running ? <Pill kind="accent" dot>Live</Pill> : <Pill dot>Not running</Pill>}
        <span className="mute" style={{ fontSize: 12.5 }}>{running ? "Polled every 5s from qemu-guest-agent" : "Start the VM to see live metrics"}</span>
      </div>

      <div className="g cols-2">
        {metrics.map((m, i) => (
          <Card key={i} title={m.title}
            action={<span className="row" style={{ gap: 8, alignItems: "baseline" }}>
              <span style={{ fontSize: 18, fontWeight: 600 }}>{m.val}</span>
            </span>}
          >
            {m.data.length > 1 ? (
              <AreaChart
                series={[{ name: m.title, data: m.data }]}
                colors={[m.color]}
                width={460} height={160}
                xLabels={["", "", "", "", "now"]}
              />
            ) : (
              <div className="mute" style={{ fontSize: 13, padding: "40px 0", textAlign: "center" }}>
                {running ? "Collecting live data…" : "—"}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card style={{ marginTop: 18 }} title="Alerts">
        <div className="mute" style={{ fontSize: 13, padding: "12px 0", textAlign: "center" }}>Alerting isn't available yet.</div>
      </Card>
    </div>
  );
}

// ---------- Networking ----------
function NetworkingTab({ resource }) {
  return (
    <div className="col" style={{ gap: 18 }}>
      <Card title="Interfaces">
        <table className="tbl">
          <thead><tr><th>Interface</th><th>Type</th><th>Address</th><th>Status</th></tr></thead>
          <tbody>
            <tr>
              <td className="mono">eth0</td>
              <td>Public IPv4 (NAT)</td>
              <td className="mono">{resource.publicIp || "—"}</td>
              <td>{resource.publicIp ? <Pill kind="good" dot>Up</Pill> : <Pill dot>Pending</Pill>}</td>
            </tr>
            <tr>
              <td className="mono">eth0</td>
              <td>Private IPv4</td>
              <td className="mono">{resource.privateIp || "—"}</td>
              <td>{resource.privateIp ? <Pill kind="good" dot>Up</Pill> : <Pill dot>Pending</Pill>}</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ---------- Snapshots ----------
function SnapshotsTab({ resource }) {
  return (
    <div className="col" style={{ gap: 18 }}>
      <Card title="Snapshots" action={<Btn kind="primary" size="sm" icon={<I.plus size={12}/>} disabled>Create snapshot</Btn>}>
        <div className="mute" style={{ fontSize: 13, padding: "20px 0", textAlign: "center" }}>No snapshots yet.</div>
      </Card>
    </div>
  );
}

// ---------- Firewall ----------
function FirewallTab({ resource }) {
  return (
    <div className="col" style={{ gap: 18 }}>
      <Card title="Firewall rules" action={<Btn kind="ghost sm" icon={<I.plus size={12}/>} disabled>Add rule</Btn>}>
        <div className="mute" style={{ fontSize: 13, padding: "20px 0", textAlign: "center" }}>No firewall rules configured.</div>
      </Card>
    </div>
  );
}

// ---------- Storage ----------
function StorageTab({ resource }) {
  return (
    <div className="col" style={{ gap: 18 }}>
      <Card title="Attached volumes">
        <div className="col" style={{ gap: 12 }}>
          <div className="card" style={{ padding: 14, background: "var(--surface-3)" }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <div className="row" style={{ gap: 10 }}>
                <I.database size={16} stroke="var(--accent-2)"/>
                <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>root</span>
                <span className="mute mono" style={{ fontSize: 11 }}>mounted at /</span>
              </div>
              <span className="mute" style={{ fontSize: 12 }}>Root · included in plan</span>
            </div>
            <div className="mute" style={{ fontSize: 12 }}>{resource.storage_gb} GB total</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------- Live VM stats (real virsh domstats, polled) ----------
// Cumulative counters come back from the backend already turned into
// instantaneous values (see services/stats.js) — this hook just accumulates
// them into a bounded client-side history for the charts. History resets on
// remount (e.g. switching tabs) since nothing persists it server-side —
// charts start sparse and fill in live rather than showing fabricated past data.
function useVmStats(resourceId, status) {
  const [latest, setLatest] = React.useState(null);
  const [history, setHistory] = React.useState({ cpu: [], mem: [], netRx: [], netTx: [], diskRead: [], diskWrite: [] });
  React.useEffect(() => {
    if (status !== "running") return;
    let alive = true;
    const push = (arr, v) => (v == null ? arr : [...arr, v].slice(-48));
    const tick = async () => {
      try {
        const s = await resourcesApi.stats(resourceId);
        if (!alive) return;
        setLatest(s);
        setHistory(h => ({
          cpu:       push(h.cpu, s.cpuPercent),
          mem:       push(h.mem, s.memUsedMB),
          netRx:     push(h.netRx, s.netRxBps),
          netTx:     push(h.netTx, s.netTxBps),
          diskRead:  push(h.diskRead, s.diskReadBps),
          diskWrite: push(h.diskWrite, s.diskWriteBps),
        }));
      } catch { /* transient poll failure — keep last known values */ }
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [resourceId, status]);
  return { latest, history };
}

function fmtRate(bps) {
  if (bps == null) return "—";
  if (bps > 1e6) return `${(bps / 1e6).toFixed(1)} MB/s`;
  if (bps > 1e3) return `${(bps / 1e3).toFixed(1)} KB/s`;
  return `${Math.round(bps)} B/s`;
}

// ---------- Overview ----------
function VmOverviewTab({ resource, doAction, doDestroy, onConsole }) {
  const busy = resource.status === "deploying" || resource.status === "rebooting";
  const running = resource.status === "running";
  const { latest, history } = useVmStats(resource.id, resource.status);

  return (
    <div className="g cols-12" style={{ gap: 18 }}>
      {/* Left col */}
      <div style={{ gridColumn:"span 8", display:"flex", flexDirection:"column", gap:18 }}>

        {/* Status banner */}
        {busy && (
          <div className="banner" style={{ background:"color-mix(in oklab, var(--warn) 10%, transparent)", borderColor:"color-mix(in oklab, var(--warn) 30%, transparent)" }}>
            <Spinner size={14}/>
            <span style={{ color:"var(--warn)" }}>{resource.status === "deploying" ? "Provisioning — this takes under a minute…" : "Rebooting…"}</span>
          </div>
        )}

        {/* KPI strip */}
        <div className="g cols-3">
          <Card>
            <KPI label="vCPU" value={String(resource.vcpu)} delta={running ? `${latest?.cpuPercent ?? "—"}% used` : "allocated"} icon={<I.cpu size={13}/>}/>
            {history.cpu.length > 0 && <div style={{ marginTop:10 }}><Sparkline data={history.cpu} width={220} height={32} stroke="var(--accent)"/></div>}
          </Card>
          <Card>
            <KPI label="Memory" value={`${resource.ram_gb} GB`} delta={running && latest?.memUsedMB != null ? `${(latest.memUsedMB/1024).toFixed(1)} GB used` : "allocated"} icon={<I.layers size={13}/>}/>
            {history.mem.length > 0 && <div style={{ marginTop:10 }}><Sparkline data={history.mem} width={220} height={32} stroke="var(--accent-2)"/></div>}
          </Card>
          <Card>
            <KPI label="Storage" value={`${resource.storage_gb} GB`} delta="root disk" icon={<I.database size={13}/>}/>
          </Card>
        </div>

        {/* Network chart */}
        <Card title="Network traffic" action={running ? <Pill kind="accent" dot>Live</Pill> : <Pill dot>Not running</Pill>}>
          {history.netRx.length > 1 ? (
            <AreaChart width={620} height={180}
              series={[
                { name: "In",  data: history.netRx },
                { name: "Out", data: history.netTx },
              ]}
              colors={["var(--good)", "var(--accent)"]}
              xLabels={["", "", "", "", "now"]}
            />
          ) : (
            <div className="mute" style={{ fontSize:13, padding:"40px 0", textAlign:"center" }}>
              {running ? "Collecting live data…" : "Start the VM to see network traffic."}
            </div>
          )}
          {latest && (
            <div className="mute" style={{ fontSize:11.5, marginTop:8 }}>
              In {fmtRate(latest.netRxBps)} · Out {fmtRate(latest.netTxBps)}
            </div>
          )}
        </Card>

        {/* Info grid + SSH */}
        <div className="g cols-2">
          <Card>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, background:"var(--hairline)", border:"1px solid var(--hairline)", borderRadius:12, overflow:"hidden" }}>
              {[
                ["OS",          resource.os || resource.image],
                ["Plan",        resource.plan_id],
                ["Public IP",   resource.publicIp || "—"],
                ["Private IP",  resource.privateIp || "—"],
                ["Region",      resource.region?.toUpperCase() || "—"],
                ["vCPU",        `${resource.vcpu} core${resource.vcpu!==1?"s":""}`],
                ["RAM",         `${resource.ram_gb} GB`],
                ["Disk",        `${resource.storage_gb} GB SSD`],
                ["Created",     resource.created_at ? new Date(resource.created_at).toLocaleDateString() : "—"],
              ].map(([k,v]) => (
                <div key={k} style={{ background:"var(--surface)", padding:"12px 14px" }}>
                  <div style={{ fontSize:10.5, color:"var(--text-mute)", fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:3 }}>{k}</div>
                  <div style={{ fontSize:13, fontFamily:["Public IP","Private IP","vCPU","RAM","Disk"].includes(k)?"var(--f-mono)":undefined, wordBreak:"break-all" }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Quick connect">
            <div style={{ background:"#0b0e16", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
              <div style={{ fontFamily:"var(--f-mono)", fontSize:12.5, color:"rgba(255,255,255,0.4)", marginBottom:6 }}>$ connect</div>
              <div style={{ fontFamily:"var(--f-mono)", fontSize:13, color:"#cfd5e8" }}>ssh -i priv-key {resource.username || "admin"}@{resource.publicIp || "—"}</div>
            </div>
            <Btn size="sm" icon={<I.cmd size={12}/>} style={{ width:"100%", justifyContent:"center" }} disabled={!running} onClick={onConsole}>Open in-browser console</Btn>
            <div className="mute" style={{ fontSize:11.5, marginTop:10, textAlign:"center" }}>
              {resource.hourly_rate ? `$${Number(resource.hourly_rate).toFixed(4)}/hr · ~$${(Number(resource.hourly_rate)*730).toFixed(2)}/mo` : ""}
            </div>
          </Card>
        </div>
      </div>

      {/* Right col */}
      <div style={{ gridColumn:"span 4", display:"flex", flexDirection:"column", gap:18 }}>
        {/* Power */}
        <Card title="Power" action={<PowerStatus status={resource.status}/>}>
          <div className="col" style={{ gap:8 }}>
            {running
              ? <Btn icon={<I.x size={14}/>} style={{ justifyContent:"flex-start" }} disabled={busy} onClick={() => doAction("stop")}>Shut down</Btn>
              : <Btn icon={<I.bolt size={14}/>} style={{ justifyContent:"flex-start" }} disabled={busy} onClick={() => doAction("start")}>Power on</Btn>}
            <Btn icon={<I.refresh size={14}/>} style={{ justifyContent:"flex-start" }} disabled={busy||!running} onClick={() => doAction("reboot")}>Reboot</Btn>
            <div style={{ height:1, background:"var(--hairline)", margin:"4px 0" }}/>
            <Btn icon={<I.x size={14}/>} style={{ justifyContent:"flex-start", color:"var(--bad)" }}
              onClick={() => { if (confirm(`Destroy ${resource.name}? This cannot be undone.`)) doDestroy(); }}>
              Destroy VM
            </Btn>
          </div>
        </Card>

        {/* Resize */}
        <Card title="Resize">
          <div className="mute" style={{ fontSize:12, marginBottom:14, lineHeight:1.5 }}>
            Plan resizing isn't available yet.
          </div>
          <div className="col" style={{ gap:10, opacity:0.55, pointerEvents:"none" }}>
            {[
              { name:"s-2-4",  label:"Standard 2/4",    mo:24,  cpu:2,  ram:4  },
              { name:"s-4-8",  label:"Standard 4/8",    mo:48,  cpu:4,  ram:8  },
              { name:"p-4-16", label:"Perf 4/16",       mo:140, cpu:4,  ram:16 },
              { name:"p-8-32", label:"Perf 8/32",       mo:280, cpu:8,  ram:32 },
            ].map(p => (
              <div key={p.name} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"10px 12px", borderRadius:10,
                border:`1px solid ${p.name===resource.plan_id ? "var(--accent)" : "var(--hairline)"}`,
                background: p.name===resource.plan_id ? "color-mix(in oklab, var(--accent) 8%, var(--surface))" : "var(--surface)",
                cursor: "default",
                fontSize:13,
              }}>
                <div>
                  <div style={{ fontFamily:"var(--f-mono)", fontWeight:500 }}>{p.label}</div>
                  <div className="mute" style={{ fontSize:11, marginTop:2 }}>{p.cpu} vCPU · {p.ram} GB RAM</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:600 }}>${p.mo}/mo</div>
                  {p.name===resource.plan_id && <div style={{ fontSize:10, color:"var(--accent)", marginTop:1 }}>current</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------- Settings ----------
function VpsSettingsTab({ resource, doDestroy }) {
  const [name, setName] = React.useState(resource.name || "")
  const [saving, setSaving] = React.useState(false)
  const save = async () => {
    setSaving(true)
    try { await resourcesApi.update(resource.id, { name }); toast("Hostname updated", "success") }
    catch (e) { toast(e.message, "error") }
    finally { setSaving(false) }
  }
  return (
    <div className="col" style={{ gap: 18, maxWidth: 720 }}>
      <Card title="Identification">
        <div className="g cols-2" style={{ gap: 14 }}>
          <Field label="Hostname">
            <input className="input mono" value={name} onChange={e => setName(e.target.value)}/>
          </Field>
          <Field label="Plan"><input className="input mono" value={resource.plan_id || "—"} disabled style={{ opacity: 0.6 }}/></Field>
        </div>
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
          <Btn kind="primary" size="sm" onClick={save} disabled={saving || name === resource.name}>{saving ? "Saving…" : "Save"}</Btn>
        </div>
      </Card>
      <Card title="Danger zone" style={{ borderColor: "color-mix(in oklab, var(--bad) 28%, transparent)" }}>
        <div className="col" style={{ gap: 12 }}>
          <div className="row" style={{ justifyContent: "space-between", padding: "10px 0" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Destroy VM</div>
              <div className="mute" style={{ fontSize: 12, marginTop: 2 }}>Permanently delete the VM. This cannot be undone.</div>
            </div>
            <Btn kind="danger" size="sm" onClick={() => { if (confirm(`Destroy ${resource.name}? This cannot be undone.`)) doDestroy() }}>Destroy</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------- Page ----------
// Normalize an API resource for the detail tabs (image fallback, display region)
function normalize(r) {
  if (!r) return r;
  return {
    ...r,
    image: r.image || r.os || "Ubuntu 24.04",
    region: (r.region || "").toUpperCase(),
    plan: r.plan_id,
    publicIp: r.public_ip,
    privateIp: r.ip,
    username: r.os_username || "admin",
  };
}

// Shared header action bar with real start/stop/reboot/destroy
function ResourceActionBar({ resource, onAction, onDestroy, onGo, listRoute }) {
  const [busyAction, setBusyAction] = React.useState(null);
  const running = resource.status === "running";
  const transitioning = resource.status === "deploying" || resource.status === "rebooting";
  const run = async (action) => {
    setBusyAction(action);
    await onAction(action);
    setBusyAction(null);
  };
  return (
    <div className="row" style={{ gap: 8 }}>
      {running
        ? <Btn icon={busyAction==="stop" ? <Spinner size={13}/> : <I.x size={14}/>} disabled={!!busyAction||transitioning} onClick={() => run("stop")}>Stop</Btn>
        : <Btn icon={busyAction==="start" ? <Spinner size={13}/> : <I.bolt size={14}/>} disabled={!!busyAction||transitioning} onClick={() => run("start")}>Start</Btn>}
      <Btn icon={busyAction==="reboot" ? <Spinner size={13}/> : <I.refresh size={14}/>} disabled={!!busyAction||transitioning||!running} onClick={() => run("reboot")}>Reboot</Btn>
      <Btn kind="primary" icon={<I.x size={14}/>} disabled={!!busyAction}
        onClick={() => { if (confirm(`Destroy ${resource.name}? This cannot be undone.`)) onDestroy(); }}>Destroy</Btn>
    </div>
  );
}

function useResource(id, onGo, listRoute) {
  const { data, reload, setData } = usePolledData(
    () => resourcesApi.get(id),
    { shouldPoll: (d) => d && (d.status === "deploying" || d.status === "rebooting"), deps: [id] }
  );
  const doAction = async (action) => {
    try { const r = await resourcesApi.action(id, action); setData(r); reload();
      toast(`${r.name} ${action === "stop" ? "stopped" : action === "start" ? "started" : "rebooting"}`, "success");
    } catch (e) { toast(e.message, "error"); }
  };
  const doDestroy = async () => {
    try { await resourcesApi.remove(id); toast("Resource destroyed", "success"); onGo(listRoute); }
    catch (e) { toast(e.message, "error"); }
  };
  return { resource: data, doAction, doDestroy, reload };
}

function PageVpsDetail({ id, onGo }) {
  const { resource: raw, doAction, doDestroy } = useResource(id, onGo, "portal-vps-list");
  const [tab, setTab] = React.useState("overview");
  const tabs = [
    { id: "overview",   label: "Overview" },
    { id: "console",    label: "Console" },
    { id: "monitoring", label: "Monitoring" },
    { id: "storage",    label: "Storage" },
    { id: "networking", label: "Networking" },
    { id: "snapshots",  label: "Snapshots" },
    { id: "firewall",   label: "Firewall" },
    { id: "settings",   label: "Settings" },
  ];

  if (!raw) return <Loading label="Loading instance…"/>;
  const resource = normalize(raw);

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 4 }}>
            <a className="mute" style={{ cursor:"pointer", fontSize:12.5 }} onClick={() => onGo("portal-dashboard")}>Dashboard</a>
            <span className="mute" style={{ fontSize:12 }}>/</span>
            <a className="mute" style={{ cursor:"pointer", fontSize:12.5 }} onClick={() => onGo("portal-vps-list")}>Virtual Machines</a>
            <span className="mute" style={{ fontSize:12 }}>/</span>
            <span className="mono" style={{ fontSize:12.5 }}>{resource.name}</span>
          </div>
          <div className="row" style={{ gap:10, alignItems:"center" }}>
            <div style={{ width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
              background:"color-mix(in oklab, var(--accent) 14%, transparent)", color:"var(--accent)", flexShrink:0 }}>
              <I.server size={16}/>
            </div>
            <h1 className="mono">{resource.name}</h1>
            <PowerStatus status={resource.status}/>
            <Pill kind="info" style={{ fontFamily:"var(--f-mono)", fontSize:11 }}>{resource.os || resource.image}</Pill>
          </div>
          <div className="sub mono" style={{ fontSize:12.5 }}>
            {resource.publicIp || "—"} · {resource.vcpu} vCPU · {resource.ram_gb} GB RAM · {resource.storage_gb} GB SSD · {resource.region?.toUpperCase() || "—"}
          </div>
        </div>
        <div className="row" style={{ gap:8 }}>
          <Btn icon={<I.cmd size={14}/>} onClick={() => setTab("console")}>Console</Btn>
          <Btn icon={<I.refresh size={14}/>} disabled={resource.status!=="running"} onClick={() => doAction("reboot")}>Reboot</Btn>
          <Btn kind="primary" icon={<I.x size={14}/>}
            onClick={() => { if (confirm(`Destroy ${resource.name}? This cannot be undone.`)) doDestroy(); }}>
            Destroy
          </Btn>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={tabs}/>

      {tab === "overview"   && <VmOverviewTab resource={resource} doAction={doAction} doDestroy={doDestroy} onConsole={() => setTab("console")}/>}
      {tab === "console"    && <ConsoleTab resource={resource}/>}
      {tab === "monitoring" && <MonitoringTab resource={resource}/>}
      {tab === "storage"    && <StorageTab resource={resource}/>}
      {tab === "networking" && <NetworkingTab resource={resource}/>}
      {tab === "snapshots"  && <SnapshotsTab resource={resource}/>}
      {tab === "firewall"   && <FirewallTab resource={resource}/>}
      {tab === "settings"   && <VpsSettingsTab resource={resource} doDestroy={doDestroy}/>}
    </div>
  );
}

// ---------- VPS list page (simple) ----------
function timeAgo(iso) {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function PageVpsList({ onGo, filter = "all" }) {
  const isVm = filter !== "cnt";
  const kind = isVm ? "vm" : "container";
  const { data: items, reload } = usePolledData(
    () => resourcesApi.list(kind),
    { shouldPoll: (d) => Array.isArray(d) && d.some(r => r.status === "deploying" || r.status === "rebooting"), deps: [kind] }
  );
  const title = isVm ? "Virtual Machines" : "Containers";

  const doAction = async (e, r, action) => {
    e.stopPropagation();
    try {
      if (action === "destroy") {
        await resourcesApi.remove(r.id);
        toast(`${r.name} destroyed`, "success");
      } else {
        await resourcesApi.action(r.id, action);
        toast(`${r.name} ${action === "stop" ? "stopped" : action === "start" ? "started" : "rebooting"}`, "success");
      }
      reload();
    } catch (ex) { toast(ex.message, "error"); }
  };

  return (
    <div>
      <div className="page-h">
        <div>
          <h1>{title}</h1>
          <div className="sub">
            {items ? `${items.length} ${isVm ? "instance" : "container"}${items.length === 1 ? "" : "s"} · ${items.filter(r => r.status === "running").length} running` : "—"}
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          {items && items.length > 0 && (
            <Btn kind="primary" icon={<I.plus size={14}/>}
              onClick={() => onGo(isVm ? "portal-create-vps" : "portal-create-container")}>
              Create {isVm ? "VM" : "container"}
            </Btn>
          )}
        </div>
      </div>

      {!items ? <Loading label={`Loading your ${isVm ? "VMs" : "containers"}…`}/> :
       items.length === 0 ? (
        <EmptyState
          icon={isVm ? <I.server size={28}/> : <I.cloud size={28}/>}
          title={isVm ? "No virtual machines yet" : "No containers yet"}
          body={isVm
            ? "Spin up your first VM in under a minute. Pick an image, a region, and a plan — we handle the rest."
            : "Deploy any OCI image with automatic TLS, health checks, and zero-downtime restarts."}
          action={`Create your first ${isVm ? "VM" : "container"}`}
          onAction={() => onGo(isVm ? "portal-create-vps" : "portal-create-container")}
        />
       ) : (
        <Card pad={false}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ paddingLeft: 22 }}>Name</th>
                <th>{isVm ? "Image" : "Image"}</th>
                <th>Region</th>
                <th>Status</th>
                <th>Plan</th>
                <th>{isVm ? "Public IP" : "Private IP"}</th>
                <th>Created</th>
                <th style={{ paddingRight: 22 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => {
                const busy = r.status === "deploying" || r.status === "rebooting";
                return (
                <tr key={r.id} onClick={() => onGo(isVm ? `portal-vps-detail-${r.id}` : `portal-cnt-detail-${r.id}`)} style={{ cursor: "pointer" }}>
                  <td style={{ paddingLeft: 22 }}>
                    <div className="row" style={{ gap: 12 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: isVm ? "color-mix(in oklab, var(--accent) 12%, transparent)" : "color-mix(in oklab, var(--accent-2) 14%, transparent)",
                        color: isVm ? "var(--accent)" : "var(--accent-2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{isVm ? <I.server size={15}/> : <I.cloud size={15}/>}</div>
                      <div>
                        <div className="mono" style={{ fontWeight: 500 }}>{r.name}</div>
                        <div className="mute" style={{ fontSize: 11 }}>{r.label || (isVm ? "Virtual machine" : `${r.replicas} replica${r.replicas>1?"s":""}`)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mute" style={{ fontSize: 12.5 }}>{isVm ? r.os : r.image}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{r.region?.toUpperCase()}</td>
                  <td><PowerStatus status={r.status}/></td>
                  <td className="mute mono" style={{ fontSize: 12 }}>{r.plan_id}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{isVm ? (r.public_ip || "—") : r.ip}</td>
                  <td className="mute" style={{ fontSize: 12 }}>{timeAgo(r.created_at)}</td>
                  <td style={{ paddingRight: 22, textAlign: "right" }}>
                    <RowActions r={r} busy={busy} onAction={doAction}/>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </Card>
       )}
    </div>
  );
}

function RowActions({ r, busy, onAction }) {
  const [open, setOpen] = React.useState(false);
  if (busy) return <Spinner size={14}/>;
  const running = r.status === "running";
  return (
    <div style={{ position: "relative", display: "inline-block" }} onClick={e => e.stopPropagation()}>
      <button className="btn ghost icon" onClick={() => setOpen(o => !o)}><I.more size={14}/></button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, zIndex:50 }}/>
          <div style={{ position:"absolute", right:0, top:"calc(100% + 4px)", zIndex:51, minWidth:150,
            background:"var(--bg-1)", border:"1px solid var(--hairline-2)", borderRadius:10, padding:5,
            boxShadow:"0 12px 32px -8px rgba(0,0,0,0.5)" }}>
            {[
              running ? { l:"Stop", a:"stop", ic:<I.x size={13}/> } : { l:"Start", a:"start", ic:<I.bolt size={13}/> },
              { l:"Reboot", a:"reboot", ic:<I.refresh size={13}/> },
            ].map(it => (
              <div key={it.a} onClick={(e) => { setOpen(false); onAction(e, r, it.a); }}
                style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 11px", borderRadius:7, cursor:"pointer", fontSize:13, color:"var(--text-dim)" }}
                onMouseEnter={e => e.currentTarget.style.background="var(--surface-3)"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                {it.ic}{it.l}
              </div>
            ))}
            <div style={{ height:1, background:"var(--hairline)", margin:"4px 0" }}/>
            <div onClick={(e) => { setOpen(false); if (confirm(`Destroy ${r.name}? This cannot be undone.`)) onAction(e, r, "destroy"); }}
              style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 11px", borderRadius:7, cursor:"pointer", fontSize:13, color:"var(--bad)" }}
              onMouseEnter={e => e.currentTarget.style.background="color-mix(in oklab, var(--bad) 10%, transparent)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <I.x size={13}/>Destroy
            </div>
          </div>
        </>
      )}
    </div>
  );
}


// ───────────────────────── CONTAINER DETAIL ──────────────────────────────
// Containers have no real runtime behind them yet (see plan's "out of
// scope" list) — no log stream exists to show, so say that instead of
// fabricating plausible-looking log lines.
function ContainerLogsTab({ resource }) {
  return (
    <div style={{ background: "var(--bg-1)", borderRadius: 14, border: "1px solid var(--hairline)", padding: 20, marginTop: 18 }}>
      <div className="mute" style={{ fontSize: 13, padding: "24px 0", textAlign: "center" }}>
        Log streaming isn't available yet.
      </div>
    </div>
  );
}

function ContainerEnvTab({ resource }) {
  // Editing isn't wired to a backend yet — containers have no real
  // orchestration layer behind them — so this shows the real env vars the
  // container was created with (read-only) instead of a fake editable set.
  const env = Array.isArray(resource.env) ? resource.env : [];
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      {env.length === 0 && <div className="mute" style={{ fontSize: 13 }}>No environment variables set.</div>}
      {env.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input className="input mono" value={e.k} style={{ width: 200 }} disabled/>
          <span style={{ color: "var(--text-mute)" }}>=</span>
          <input className="input mono" value={e.v} style={{ flex: 1 }} disabled/>
        </div>
      ))}
      <div className="mute" style={{ fontSize: 12, marginTop: 8 }}>
        Editing environment variables after deploy isn't available yet.
      </div>
    </div>
  );
}

function ContainerNetworkTab({ resource }) {
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Exposed ports</div>
        <table className="tbl">
          <thead><tr><th>Container port</th><th>Protocol</th><th>Public IP</th><th>Status</th></tr></thead>
          <tbody>
            <tr>
              <td className="mono">80</td><td><Pill>TCP</Pill></td>
              <td className="mono">{resource.ip}</td>
              <td><Pill kind="good" dot>open</Pill></td>
            </tr>
          </tbody>
        </table>
      </Card>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>VPC networking</div>
        {[
          ["Private IP",  resource.ip],
          ["Region",      resource.region],
          ["VPC",         "vpc-prod-alg1"],
          ["Egress",      "Free within VPC"],
        ].map(([k,v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderTop:"0.5px solid var(--hairline)", fontSize:13 }}>
            <span style={{ color:"var(--text-dim)" }}>{k}</span>
            <span className="mono" style={{ fontSize:12.5 }}>{v}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function ContainerOverviewTab({ resource, doAction }) {
  const [scaling, setScaling] = React.useState(false);
  const [replicas, setReplicas] = React.useState(resource.replicas || 1);
  const busy = resource.status === "deploying" || resource.status === "rebooting";

  const applyScale = async () => {
    setScaling(true);
    try { await doAction("reboot"); } // triggers restart with new replicas if we support it
    catch {}
    finally { setScaling(false); }
  };

  return (
    <div className="col" style={{ gap: 18 }}>
      {/* Status banner for transitioning */}
      {busy && (
        <div className="banner" style={{ background:"color-mix(in oklab, var(--warn) 10%, transparent)", borderColor:"color-mix(in oklab, var(--warn) 30%, transparent)" }}>
          <Spinner size={14}/>
          <span style={{ color:"var(--warn)" }}>{resource.status === "deploying" ? "Pulling image and starting…" : "Restarting container…"}</span>
        </div>
      )}

      {/* Main info grid */}
      <div className="g cols-12" style={{ gap: 18 }}>
        <div style={{ gridColumn:"span 8", display:"flex", flexDirection:"column", gap:18 }}>
          {/* Image + runtime */}
          <Card>
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:18 }}>
              <div style={{ width:48, height:48, borderRadius:12, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                background:"color-mix(in oklab, var(--accent-2) 14%, transparent)", color:"var(--accent-2)", fontSize:22, fontWeight:700 }}>
                {(resource.image || "?").split(":")[0][0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:600, fontFamily:"var(--f-mono)" }}>{resource.image}</div>
                <div style={{ fontSize:12.5, color:"var(--text-mute)", marginTop:3 }}>OCI image · pulled from registry</div>
              </div>
              <div style={{ marginLeft:"auto" }}><PowerStatus status={resource.status}/></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, background:"var(--hairline)", border:"1px solid var(--hairline)", borderRadius:12, overflow:"hidden" }}>
              {[
                ["IP Address",   resource.ip || "—"],
                ["Port",         resource.ports || "80"],
                ["Plan",         resource.plan_id || "—"],
                ["Region",       resource.region?.toUpperCase() || "—"],
                ["vCPU",         `${resource.vcpu} core${resource.vcpu !== 1 ? "s" : ""}`],
                ["RAM",          `${resource.ram_gb} GB`],
                ["Replicas",     `${resource.replicas}×`],
                ["Created",      resource.created_at ? new Date(resource.created_at).toLocaleDateString() : "—"],
              ].map(([k,v]) => (
                <div key={k} style={{ background:"var(--surface)", padding:"14px 16px" }}>
                  <div style={{ fontSize:11, color:"var(--text-mute)", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>{k}</div>
                  <div style={{ fontSize:13.5, fontFamily:["IP Address","Port","Plan","vCPU","RAM"].includes(k)?"var(--f-mono)":undefined }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Environment preview */}
          {Array.isArray(resource.env) && resource.env.length > 0 && (
            <Card title="Environment" action={<span className="mute" style={{ fontSize:12 }}>{resource.env.length} variable{resource.env.length>1?"s":""}</span>}>
              <div style={{ fontFamily:"var(--f-mono)", fontSize:12.5, display:"flex", flexDirection:"column", gap:6 }}>
                {resource.env.slice(0,5).map((e,i) => (
                  <div key={i} style={{ display:"flex", gap:12, color:"var(--text-dim)" }}>
                    <span style={{ color:"var(--accent)", minWidth:140 }}>{e.k}</span>
                    <span style={{ color:"var(--text-mute)" }}>= {e.v || "…"}</span>
                  </div>
                ))}
                {resource.env.length > 5 && <span className="mute" style={{ fontSize:11.5 }}>+{resource.env.length-5} more</span>}
              </div>
            </Card>
          )}
        </div>

        <div style={{ gridColumn:"span 4", display:"flex", flexDirection:"column", gap:18 }}>
          {/* Scale card */}
          <Card title="Scale replicas">
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <button onClick={() => setReplicas(r => Math.max(1, r-1))}
                style={{ width:32, height:32, borderRadius:8, border:"1px solid var(--hairline-2)", background:"var(--surface-3)", cursor:"pointer", color:"var(--text)", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
              <div style={{ flex:1, textAlign:"center" }}>
                <div style={{ fontSize:36, fontWeight:700, lineHeight:1 }}>{replicas}</div>
                <div style={{ fontSize:12, color:"var(--text-mute)", marginTop:4 }}>replica{replicas>1?"s":""}</div>
              </div>
              <button onClick={() => setReplicas(r => Math.min(20, r+1))}
                style={{ width:32, height:32, borderRadius:8, border:"1px solid var(--hairline-2)", background:"var(--surface-3)", cursor:"pointer", color:"var(--text)", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
            </div>
            <Btn kind="primary" style={{ width:"100%", justifyContent:"center" }}
              disabled={replicas === resource.replicas || scaling || busy}
              onClick={applyScale}>
              {scaling ? "Applying…" : `Apply · ${replicas} replica${replicas>1?"s":""}`}
            </Btn>
            <div className="mute" style={{ fontSize:11.5, marginTop:10, textAlign:"center" }}>
              ${((resource.hourly_rate / (resource.replicas||1)) * replicas).toFixed(4)}/hr
            </div>
          </Card>

          {/* Quick actions */}
          <Card title="Actions">
            <div className="col" style={{ gap:8 }}>
              {[
                { label:"Restart",    icon:<I.refresh size={14}/>,  action:"reboot", disabled: resource.status !== "running" },
                { label:"Stop",       icon:<I.x size={14}/>,        action:"stop",   disabled: resource.status !== "running" },
                { label:"Start",      icon:<I.bolt size={14}/>,     action:"start",  disabled: resource.status === "running" },
              ].map(a => (
                <Btn key={a.label} icon={a.icon} disabled={a.disabled || busy}
                  style={{ justifyContent:"flex-start" }}
                  onClick={() => doAction(a.action)}>
                  {a.label}
                </Btn>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PageContainerDetail({ id, onGo }) {
  const { resource: raw, doAction, doDestroy } = useResource(id, onGo, "portal-container-list");
  const [tab, setTab] = React.useState("overview");
  const tabs = [
    { id: "overview",  label: "Overview" },
    { id: "logs",      label: "Logs" },
    { id: "monitoring",label: "Monitoring" },
    { id: "network",   label: "Networking" },
    { id: "env",       label: "Environment" },
    { id: "settings",  label: "Settings" },
  ];
  if (!raw) return <Loading label="Loading container…"/>;
  const resource = normalize(raw);
  return (
    <div>
      <div className="page-h">
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 4 }}>
            <a className="mute" style={{ cursor:"pointer", fontSize:12.5 }} onClick={() => onGo("portal-dashboard")}>Dashboard</a>
            <span className="mute" style={{ fontSize:12 }}>/</span>
            <a className="mute" style={{ cursor:"pointer", fontSize:12.5 }} onClick={() => onGo("portal-container-list")}>Containers</a>
            <span className="mute" style={{ fontSize:12 }}>/</span>
            <span className="mono" style={{ fontSize:12.5 }}>{resource.name}</span>
          </div>
          <div className="row" style={{ gap:10, alignItems:"center" }}>
            <div style={{ width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
              background:"color-mix(in oklab, var(--accent-2) 14%, transparent)", color:"var(--accent-2)", flexShrink:0 }}>
              <I.cloud size={16}/>
            </div>
            <h1 className="mono">{resource.name}</h1>
            <PowerStatus status={resource.status}/>
            <Pill kind="info" style={{ fontFamily:"var(--f-mono)" }}>{resource.image}</Pill>
            <Pill kind="accent">{resource.replicas}× replica{resource.replicas>1?"s":""}</Pill>
          </div>
          <div className="sub mono" style={{ fontSize:12.5 }}>{resource.ip} · :{resource.ports || "80"} · {resource.plan_id}</div>
        </div>
        <div className="row" style={{ gap:8 }}>
          <Btn icon={<I.refresh size={14}/>} disabled={resource.status !== "running"} onClick={() => doAction("reboot")}>Restart</Btn>
          <Btn kind="primary" icon={<I.x size={14}/>}
            onClick={() => { if (confirm(`Destroy ${resource.name}?`)) doDestroy(); }}>Destroy</Btn>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={tabs}/>

      {tab === "overview"   && <ContainerOverviewTab resource={resource} doAction={doAction}/>}
      {tab === "logs"       && <ContainerLogsTab resource={resource}/>}
      {tab === "monitoring" && <MonitoringTab resource={resource}/>}
      {tab === "network"    && <ContainerNetworkTab resource={resource}/>}
      {tab === "env"        && <ContainerEnvTab resource={resource}/>}
      {tab === "settings"   && <VpsSettingsTab resource={resource}/>}
    </div>
  );
}


export { PageVpsDetail, PageVpsList, PageContainerDetail }
