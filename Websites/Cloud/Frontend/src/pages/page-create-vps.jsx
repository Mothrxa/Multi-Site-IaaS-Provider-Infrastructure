import React from 'react'
import { I, Icon } from '../components/icons.jsx'
import { Btn, Card, KPI, Field, Tabs, Stepper, Toggle, Modal, Avatar, Bar, Pill } from '../components/ui.jsx'
import { Sparkline, AreaChart, Gauge, Donut } from '../components/charts.jsx'
import { StrataLogo, StrataWordmark } from '../components/brand.jsx'
import { resourcesApi, accountApi, toast } from '../api/index.js'
import ubuntuLogo from '../assets/distros/ubuntu.svg'
import debianLogo from '../assets/distros/debian.svg'
import fedoraLogo from '../assets/distros/fedora.svg'
import almalinuxLogo from '../assets/distros/almalinux.svg'
import rockyLogo from '../assets/distros/rocky.svg'

// page-create-vps.jsx — Create-a-VPS wizard, 3 layout variants
// Layouts: "stepper" (multi-step), "single" (long form), "preview" (left-panel live preview)

const VPS_OS_OPTIONS = [
  { id: "ubuntu-24.04",  name: "Ubuntu",       ver: "24.04 LTS",   color: "#E95420", logo: ubuntuLogo, popular: true },
  { id: "debian-12",     name: "Debian",        ver: "12 Bookworm", color: "#A80030", logo: debianLogo },
  { id: "fedora-44",     name: "Fedora",        ver: "44",          color: "#3C6EB4", logo: fedoraLogo },
  { id: "almalinux-9",   name: "AlmaLinux",     ver: "9",           color: "#00B9E4", logo: almalinuxLogo },
  { id: "rocky-9",       name: "Rocky Linux",   ver: "9",           color: "#10B981", logo: rockyLogo },
  { id: "custom",        name: "Custom image",  ver: "bring your own", color: "#6B7280" },
];

const VPS_PLANS = [
  { tier: "Shared", items: [
    { name: "s-1-1",   cpu: 1, ram: 1,  disk: 25,  xfer: 1, hr: 0.0089, mo: 6 },
    { name: "s-2-2",   cpu: 2, ram: 2,  disk: 60,  xfer: 3, hr: 0.0179, mo: 12 },
    { name: "s-2-4",   cpu: 2, ram: 4,  disk: 80,  xfer: 4, hr: 0.0357, mo: 24, popular: true },
    { name: "s-4-8",   cpu: 4, ram: 8,  disk: 160, xfer: 5, hr: 0.0714, mo: 48 },
  ]},
  { tier: "Performance · dedicated", items: [
    { name: "p-2-8",   cpu: 2, ram: 8,  disk: 100, xfer: 5, hr: 0.1042, mo: 70 },
    { name: "p-4-16",  cpu: 4, ram: 16, disk: 200, xfer: 6, hr: 0.2083, mo: 140 },
    { name: "p-8-32",  cpu: 8, ram: 32, disk: 400, xfer: 7, hr: 0.4167, mo: 280 },
  ]},
  { tier: "Memory-optimized", items: [
    { name: "m-2-16",  cpu: 2, ram: 16, disk: 50,  xfer: 4, hr: 0.1339, mo: 90 },
    { name: "m-4-32",  cpu: 4, ram: 32, disk: 100, xfer: 5, hr: 0.2679, mo: 180 },
    { name: "m-8-64",  cpu: 8, ram: 64, disk: 200, xfer: 6, hr: 0.5357, mo: 360 },
  ]},
];

const ALL_PLANS = VPS_PLANS.flatMap(g => g.items);

// ===== shared section components (used by all 3 layouts) =====

function OsIcon({ os }) {
  if (os.id === 'custom') {
    return (
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: "var(--surface-3)", border: "0.5px dashed var(--hairline-2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-mute)",
      }}>
        <I.download size={16}/>
      </div>
    );
  }
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
      background: "#fff", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 6,
      boxShadow: `0 4px 12px ${os.color}55`,
    }}>
      <img src={os.logo} alt={os.name} style={{ width: "100%", height: "100%", objectFit: "contain" }}/>
    </div>
  );
}

function SectionOS({ state, setState }) {
  return (
    <div>
      <div className="os-grid">
        {VPS_OS_OPTIONS.map(o => {
          const isSel = state.os === o.id;
          return (
            <div key={o.id} className={`os-tile ${isSel ? "sel" : ""}`}
              onClick={() => setState({ ...state, os: o.id })}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <OsIcon os={o}/>
                {o.popular && <Pill kind="accent" style={{ fontSize: 9, padding: "2px 6px" }}>Popular</Pill>}
              </div>
              <span className="name" style={{ marginTop: 8 }}>{o.name}</span>
              <span className="ver mono">{o.ver}</span>
            </div>
          );
        })}
      </div>
      {state.os === 'custom' && (
        <div style={{ marginTop: 12 }}>
          <Field label="Image URL" hint="Direct URL to a .qcow2 cloud image.">
            <input className="input mono" placeholder="https://example.com/my-image.qcow2"
              value={state.customImageUrl || ''}
              onChange={e => setState({ ...state, customImageUrl: e.target.value })}/>
          </Field>
        </div>
      )}
    </div>
  );
}

function SectionPlan({ state, setState }) {
  return (
    <div className="col" style={{ gap: 16 }}>
      {VPS_PLANS.map(group => (
        <div key={group.tier}>
          <div className="mute" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            {group.tier}
          </div>
          <div className="plan-grid">
            {group.items.map(p => (
              <div key={p.name}
                className={`plan-tile ${state.plan === p.name ? "sel" : ""}`}
                onClick={() => setState({ ...state, plan: p.name })}
              >
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="name mono">{p.name}</span>
                  {p.popular && <Pill kind="accent" style={{ fontSize: 9, padding: "2px 6px" }}>Popular</Pill>}
                </div>
                <div className="specs">
                  {p.cpu} vCPU · {p.ram} GB RAM · {p.disk} GB SSD · {p.xfer} TB transfer
                </div>
                <div className="price">
                  ${p.mo}<small>/mo · ${p.hr.toFixed(4)}/hr</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionAuth({ sshKeys, onGo, state, setState }) {
  const userAccount = (
    <div className="g cols-2" style={{ gap: 14, marginTop: 18 }}>
      <Field label="Username" hint="The sudo-enabled account created on first boot.">
        <input className="input mono" placeholder="admin"
          value={state.username ?? "admin"}
          onChange={e => setState({ ...state, username: e.target.value.toLowerCase() })}/>
      </Field>
      <Field label="Console password" hint="Optional. Lets you log in from the in-browser console (SSH still requires your key).">
        <input className="input mono" type="password" placeholder="Leave blank to disable password login"
          value={state.password || ""}
          onChange={e => setState({ ...state, password: e.target.value })}/>
      </Field>
    </div>
  );

  if (!sshKeys) {
    return <div className="mute" style={{ fontSize: 13 }}>Loading SSH keys…</div>;
  }
  if (sshKeys.length === 0) {
    return (
      <div className="col" style={{ gap: 8 }}>
        <div className="banner" style={{ background: "color-mix(in oklab, var(--warn) 10%, transparent)", borderColor: "color-mix(in oklab, var(--warn) 30%, transparent)" }}>
          <I.lock size={15} stroke="var(--warn)"/>
          <span style={{ color: "var(--warn)", fontSize: 13 }}>
            No SSH keys on your account. <a style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => onGo("portal-settings")}>Add one in Account → SSH Keys</a> before deploying.
          </span>
        </div>
        {userAccount}
      </div>
    );
  }
  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="mute" style={{ fontSize: 11.5, fontWeight: 500, marginBottom: 4 }}>SSH KEYS — injected at boot</div>
      {sshKeys.map(k => (
        <div key={k.id} className="row card"
          style={{ gap: 10, padding: 12, background: "color-mix(in oklab, var(--accent) 6%, var(--surface-3))", borderColor: "var(--accent)" }}>
          <I.lock size={14} stroke="var(--accent)"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{k.name}</div>
            <div className="mute mono" style={{ fontSize: 11 }}>{k.key_type} · {k.fingerprint}</div>
          </div>
        </div>
      ))}
      <div className="mute" style={{ fontSize: 11.5, marginTop: 4 }}>
        All keys on your account are injected. Manage keys in <a style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => onGo("portal-settings")}>Account → SSH Keys</a>.
      </div>
      {userAccount}
    </div>
  );
}

function SectionMeta({ state, setState }) {
  return (
    <div className="g cols-2" style={{ gap: 14 }}>
      <Field label="Hostname" hint="Lowercase, alphanumeric, dashes. Used as the VM hostname.">
        <input className="input mono" placeholder="my-vm"
          value={state.hostname || ""}
          onChange={e => setState({ ...state, hostname: e.target.value })}/>
      </Field>
      <Field label="Label" hint="Optional human-friendly name shown in lists.">
        <input className="input" placeholder="Optional description"
          value={state.label || ""}
          onChange={e => setState({ ...state, label: e.target.value })}/>
      </Field>
    </div>
  );
}

function SectionStorage({ state, setState }) {
  const vols = state.volumes || [];
  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="mute" style={{ fontSize: 12.5 }}>
        Additional block-storage volumes are attached at boot. You can resize or detach them later.
      </div>
      {vols.length === 0 && (
        <div className="card" style={{ padding: 20, textAlign: "center", border: "0.5px dashed var(--hairline-2)" }}>
          <div className="mute" style={{ fontSize: 13 }}>No extra volumes. The root disk is already included in your plan.</div>
        </div>
      )}
      {vols.map((v, i) => (
        <div key={i} className="card row" style={{ gap: 12, padding: 14 }}>
          <I.database size={16} stroke="var(--accent-2)"/>
          <input className="input" placeholder="volume-name" value={v.name} style={{ flex: 1 }}
            onChange={e => { const a = [...vols]; a[i] = { ...v, name: e.target.value }; setState({ ...state, volumes: a }); }}/>
          <input className="input mono" placeholder="100" style={{ width: 80 }} value={v.size}
            onChange={e => { const a = [...vols]; a[i] = { ...v, size: e.target.value }; setState({ ...state, volumes: a }); }}/>
          <span className="mute" style={{ fontSize: 12 }}>GB</span>
          <Btn kind="ghost icon sm" icon={<I.x size={13}/>}
            onClick={() => setState({ ...state, volumes: vols.filter((_, x) => x !== i) })}/>
        </div>
      ))}
      <Btn kind="ghost sm" icon={<I.plus size={12}/>} style={{ alignSelf: "flex-start" }}
        onClick={() => setState({ ...state, volumes: [...vols, { name: `vol-${vols.length + 1}`, size: "100" }] })}>
        Add volume
      </Btn>
    </div>
  );
}

// Sticky summary panel
function SummaryPanel({ state, onDeploy }) {
  const plan = ALL_PLANS.find(p => p.name === state.plan);
  const osMeta = VPS_OS_OPTIONS.find(o => o.id === state.os);
  const os = osMeta ? `${osMeta.name} ${osMeta.ver}` : <span className="mute">Not selected</span>;
  return (
    <div className="card" style={{ position: "sticky", top: 20 }}>
      <div className="card-title" style={{ marginBottom: 14 }}>Summary</div>
      <div className="col" style={{ gap: 10 }}>
        {[
          { lbl: "Hostname", val: state.hostname || <span className="mute">—</span>, mono: true },
          { lbl: "Image", val: os },
          { lbl: "Plan", val: plan ? plan.name.toUpperCase() : <span className="mute">Not selected</span>, mono: true },
          ...(plan ? [{ lbl: "Resources", val: `${plan.cpu} vCPU · ${plan.ram} GB · ${plan.disk} GB SSD` }] : []),
          { lbl: "Volumes", val: (state.volumes || []).length === 0 ? <span className="mute">None</span> : `${state.volumes.length} attached` },
        ].map((r, i) => (
          <div key={i} className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="mute" style={{ fontSize: 12 }}>{r.lbl}</span>
            <span className={r.mono ? "mono" : ""} style={{ fontSize: 12.5, textAlign: "right", maxWidth: 200 }}>{r.val}</span>
          </div>
        ))}
      </div>

      <div className="divider"/>

      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="mute" style={{ fontSize: 12 }}>Estimated monthly</span>
        <span style={{ fontSize: 22, fontWeight: 600 }}>${plan ? plan.mo : "—"}</span>
      </div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="mute" style={{ fontSize: 11 }}>Per-second rate</span>
        <span className="mono mute" style={{ fontSize: 11 }}>${plan ? plan.hr.toFixed(4) : "—"}/hr</span>
      </div>

      <Btn kind="primary" style={{ width: "100%", marginTop: 18, height: 42, justifyContent: "center" }}
        icon={<I.bolt size={14}/>}
        onClick={onDeploy}
        disabled={!plan || !state.os}
      >
        Deploy now
      </Btn>
    </div>
  );
}

// ===== STEPPER LAYOUT =====
function CreateVpsStepper({ state, setState, sshKeys, onGo, onDeploy, onCancel }) {
  const [step, setStep] = React.useState(0);
  const steps = ["Image", "Plan", "Authentication", "Details", "Storage"];
  const stepIndex = step;
  const currentSection = [
    <SectionOS state={state} setState={setState}/>,
    <SectionPlan state={state} setState={setState}/>,
    <SectionAuth sshKeys={sshKeys} onGo={onGo} state={state} setState={setState}/>,
    <SectionMeta state={state} setState={setState}/>,
    <SectionStorage state={state} setState={setState}/>,
  ][stepIndex];
  return (
    <div className="g cols-12">
      <div style={{ gridColumn: "span 8" }}>
        <Card>
          <Stepper steps={steps} current={stepIndex}/>
          <div className="divider"/>
          <div style={{ minHeight: 320 }}>{currentSection}</div>
          <div className="divider"/>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <Btn onClick={() => step === 0 ? onCancel() : setStep(s => s - 1)}>
              {step === 0 ? "Cancel" : "← Back"}
            </Btn>
            {step < steps.length - 1
              ? <Btn kind="primary" icon={<I.arrowR size={14}/>} onClick={() => setStep(s => s + 1)}>Continue</Btn>
              : <Btn kind="primary" icon={<I.bolt size={14}/>} onClick={onDeploy}>Deploy now</Btn>
            }
          </div>
        </Card>
      </div>
      <div style={{ gridColumn: "span 4" }}>
        <SummaryPanel state={state} onDeploy={onDeploy}/>
      </div>
    </div>
  );
}

// ===== SINGLE LONG FORM =====
function CreateVpsSingle({ state, setState, sshKeys, onGo, onDeploy, onCancel }) {
  const sec = (title, n, body) => (
    <Card key={title} style={{ marginBottom: 16 }}>
      <div className="row" style={{ gap: 10, marginBottom: 14, alignItems: "center" }}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "color-mix(in oklab, var(--accent) 14%, transparent)",
          color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 600,
        }}>{n}</div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{title}</div>
      </div>
      {body}
    </Card>
  );
  return (
    <div className="g cols-12">
      <div style={{ gridColumn: "span 8" }}>
        {sec("Choose an image", 1, <SectionOS state={state} setState={setState}/>)}
        {sec("Select a plan", 2, <SectionPlan state={state} setState={setState}/>)}
        {sec("Authentication", 3, <SectionAuth sshKeys={sshKeys} onGo={onGo} state={state} setState={setState}/>)}
        {sec("Hostname & tags", 4, <SectionMeta state={state} setState={setState}/>)}
        {sec("Storage volumes", 5, <SectionStorage state={state} setState={setState}/>)}

        <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
          <Btn onClick={onCancel}>Cancel</Btn>
          <Btn kind="primary" size="lg" icon={<I.bolt size={14}/>} onClick={onDeploy}>Deploy now</Btn>
        </div>
      </div>
      <div style={{ gridColumn: "span 4" }}>
        <SummaryPanel state={state} onDeploy={onDeploy}/>
      </div>
    </div>
  );
}

// ===== LEFT-PANEL LIVE PREVIEW =====
function CreateVpsPreview({ state, setState, sshKeys, onGo, onDeploy, onCancel }) {
  const plan = ALL_PLANS.find(p => p.name === state.plan);
  const osMeta = VPS_OS_OPTIONS.find(o => o.id === state.os);
  return (
    <div className="g cols-12">
      {/* Left: live preview card */}
      <div style={{ gridColumn: "span 5" }}>
        <div style={{ position: "sticky", top: 20 }}>
          <Card>
            <div className="card-title" style={{ marginBottom: 12 }}>Live preview</div>
            <div className="card" style={{ background: "var(--surface-3)", padding: 18 }}>
              <div className="row" style={{ gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: "color-mix(in oklab, var(--accent) 18%, transparent)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <I.server size={20}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{state.hostname || "your-vm-hostname"}</div>
                  <div className="mute" style={{ fontSize: 12 }}>{state.label || "Untitled VM"}</div>
                </div>
                <Pill kind="warn" dot>Pending</Pill>
              </div>
              <div className="divider"/>
              <div className="g cols-2" style={{ gap: 12, fontSize: 12 }}>
                <div>
                  <div className="mute" style={{ fontSize: 11 }}>Image</div>
                  <div style={{ marginTop: 2 }}>{osMeta ? `${osMeta.name} ${osMeta.ver}` : <span className="mute">—</span>}</div>
                </div>
                <div>
                  <div className="mute" style={{ fontSize: 11 }}>CPU / RAM</div>
                  <div style={{ marginTop: 2 }}>{plan ? `${plan.cpu} vCPU · ${plan.ram} GB` : <span className="mute">—</span>}</div>
                </div>
                <div>
                  <div className="mute" style={{ fontSize: 11 }}>Disk</div>
                  <div style={{ marginTop: 2 }}>{plan ? `${plan.disk} GB SSD` : <span className="mute">—</span>}</div>
                </div>
              </div>
            </div>

            {/* Cost meter */}
            <div className="card" style={{ background: "var(--surface-3)", padding: 18, marginTop: 12 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="mute" style={{ fontSize: 12 }}>Estimated monthly</span>
                <span style={{ fontSize: 26, fontWeight: 600 }}>${plan ? plan.mo : "—"}</span>
              </div>
              <Bar pct={plan ? Math.min(100, (plan.mo / 360) * 100) : 0}/>
              <div className="row mute" style={{ justifyContent: "space-between", fontSize: 11, marginTop: 4 }}>
                <span>$0/mo</span>
                <span>$360/mo</span>
              </div>
              <div className="mute mono" style={{ fontSize: 11, marginTop: 8 }}>
                ${plan ? plan.hr.toFixed(4) : "—"}/hr · pay per second
              </div>
            </div>

            <Btn kind="primary" style={{ width: "100%", marginTop: 14, height: 44, justifyContent: "center" }}
              icon={<I.bolt size={15}/>}
              onClick={onDeploy}
              disabled={!plan || !state.os}>
              Deploy now
            </Btn>
            <Btn style={{ width: "100%", marginTop: 8, justifyContent: "center" }} onClick={onCancel}>Cancel</Btn>
          </Card>
        </div>
      </div>

      {/* Right: collapsible form sections */}
      <div style={{ gridColumn: "span 7" }} className="col">
        <div className="col" style={{ gap: 16 }}>
        {[
          { title: "Image", body: <SectionOS state={state} setState={setState}/> },
          { title: "Plan", body: <SectionPlan state={state} setState={setState}/> },
          { title: "Hostname & tags", body: <SectionMeta state={state} setState={setState}/> },
          { title: "Authentication", body: <SectionAuth sshKeys={sshKeys} onGo={onGo} state={state} setState={setState}/> },
          { title: "Storage volumes", body: <SectionStorage state={state} setState={setState}/> },
        ].map(s => (
          <Card key={s.title} title={s.title}>{s.body}</Card>
        ))}
        </div>
      </div>
    </div>
  );
}

// VM stages are driven by real backend state (resources.stage / status),
// set by services/terraform.js as it runs `terraform init` / `apply` / reads output.
const VM_STAGE_ORDER = ["queued", "initializing", "provisioning", "finalizing", "done"];
const VM_PHASES = [
  { t: "Queued",       d: "Waiting to start provisioning" },
  { t: "Initializing", d: "Setting up the provisioning workspace" },
  { t: "Provisioning", d: "Creating your VM on the hypervisor" },
  { t: "Finalizing",   d: "Reading network configuration" },
  { t: "Deployed",     d: "Your VM is ready" },
];

function DeployingModal({ open, hostname, onDone, ip, kind = "VM", error, stage, status }) {
  const [phase, setPhase] = React.useState(0);
  const isContainer = kind === "container";
  const containerPhases = [
    { t: "Pulling image",          d: "Fetching layers from registry" },
    { t: "Allocating compute",     d: "Reserving CPU & memory slots" },
    { t: "Configuring network",    d: "VPC · port mapping · TLS" },
    { t: "Starting container",     d: "Running entrypoint" },
    { t: "Health check",           d: "Waiting for readiness probe" },
    { t: "Routing traffic",        d: "Registering with load balancer" },
    { t: "Deployed",               d: "Your container is live" },
  ];

  // Containers aren't wired to a real provisioner yet — keep a timed placeholder.
  React.useEffect(() => {
    if (!isContainer) return;
    if (!open) { setPhase(0); return; }
    setPhase(0);
    const id = setInterval(() => {
      setPhase(p => {
        if (p >= containerPhases.length - 1) { clearInterval(id); return p; }
        return p + 1;
      });
    }, 700);
    return () => clearInterval(id);
  }, [open, isContainer]);

  if (!open) return null;
  if (error) {
    return (
      <Modal open={open} title="Deployment failed" width={460} onClose={onDone}
        footer={<Btn onClick={onDone}>Close</Btn>}>
        <div className="banner" style={{ background:"color-mix(in oklab, var(--bad) 10%, transparent)", borderColor:"color-mix(in oklab, var(--bad) 30%, transparent)" }}>
          <I.x size={16} stroke="var(--bad)"/>
          <span style={{ color:"var(--bad)" }}>{error}</span>
        </div>
      </Modal>
    );
  }

  const phases = isContainer ? containerPhases : VM_PHASES;
  const vmPhase = status === "running" ? VM_PHASES.length - 1 : Math.max(0, VM_STAGE_ORDER.indexOf(stage));
  const activePhase = isContainer ? phase : vmPhase;
  const done = isContainer ? activePhase >= phases.length - 1 : status === "running";

  return (
    <Modal open={open} title={`Deploying your ${kind}`} width={520}
      onClose={done ? onDone : () => {}}
      footer={done ? <Btn kind="primary" icon={<I.arrowR size={14}/>} onClick={onDone}>View {kind}</Btn> : null}
    >
      <div className="col" style={{ gap: 4 }}>
        {phases.map((p, i) => (
          <div key={i} className="row" style={{ gap: 12, padding: "8px 0" }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
              background: i < activePhase
                ? "color-mix(in oklab, var(--good) 25%, transparent)"
                : i === activePhase
                  ? "var(--accent)"
                  : "var(--surface-3)",
              color: i < activePhase ? "var(--good)" : i === activePhase ? "#fff" : "var(--text-mute)",
              border: "0.5px solid var(--hairline-2)",
            }}>
              {i < activePhase ? "✓" : i === activePhase
                ? <span className="spin" style={{ display: "block", width: 12, height: 12, border: "2px solid #fff3", borderTopColor: "#fff", borderRadius: "50%" }}/>
                : i + 1
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: i === activePhase ? 500 : 400, color: i <= activePhase ? "var(--text)" : "var(--text-mute)" }}>
                {p.t}
              </div>
              <div className="mute" style={{ fontSize: 11.5 }}>{p.d}</div>
            </div>
          </div>
        ))}
      </div>
      {done && (
        <div className="banner ok" style={{ marginTop: 16 }}>
          <I.check size={16} stroke="var(--good)"/>
          <span>
            <strong>{hostname || `your ${kind}`}</strong> is live{ip ? <> · <span className="mono">{ip}</span></> : ""}.
          </span>
        </div>
      )}
    </Modal>
  );
}

function PageCreateVps({ onGo, layout = "stepper" }) {
  const [state, setState] = React.useState({
    hostname: "",
    label: "",
    os: "ubuntu-24.04",
    plan: "s-2-4",
    customImageUrl: "",
    volumes: [],
  });
  const [sshKeys, setSshKeys] = React.useState(null);
  const [deploying, setDeploying] = React.useState(false);
  const [created, setCreated] = React.useState(null);
  const [err, setErr] = React.useState(null);
  const Comp = { stepper: CreateVpsStepper, single: CreateVpsSingle, preview: CreateVpsPreview }[layout] || CreateVpsStepper;

  React.useEffect(() => {
    accountApi.sshKeys().then(setSshKeys).catch(() => setSshKeys([]));
  }, []);

  const pollTimer = React.useRef(null);

  React.useEffect(() => () => clearInterval(pollTimer.current), []);

  const handleDeploy = async () => {
    setErr(null); setCreated(null); setDeploying(true);
    try {
      const r = await resourcesApi.create({
        kind: 'vm',
        name: state.hostname,
        label: state.label,
        os: state.os === 'custom' ? (state.customImageUrl || 'custom') : state.os,
        plan_id: state.plan,
        username: state.username || 'admin',
        password: state.password || undefined,
      });
      setCreated(r);
      toast(`${r.name} is provisioning`, 'success');

      // Poll the real resource — status/stage are set by the Terraform run on the backend.
      pollTimer.current = setInterval(async () => {
        try {
          const latest = await resourcesApi.get(r.id);
          setCreated(latest);
          if (latest.status === 'running' || latest.status === 'failed') {
            clearInterval(pollTimer.current);
            if (latest.status === 'failed') setErr(latest.error_message || 'Provisioning failed.');
          }
        } catch (e) {
          clearInterval(pollTimer.current);
          setErr(e.message);
        }
      }, 1800);
    } catch (e) {
      setErr(e.message);
      toast(e.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 4 }}>
            <a className="mute" style={{ cursor: "pointer", fontSize: 12.5 }} onClick={() => onGo("portal-dashboard")}>Dashboard</a>
            <span className="mute" style={{ fontSize: 12 }}>/</span>
            <a className="mute" style={{ cursor: "pointer", fontSize: 12.5 }} onClick={() => onGo("portal-vps-list")}>VMs</a>
            <span className="mute" style={{ fontSize: 12 }}>/</span>
            <span style={{ fontSize: 12.5 }}>Create</span>
          </div>
          <h1>Create a virtual machine</h1>
          <div className="sub">Pick an image and a plan. We'll provision it in under a minute.</div>
        </div>
      </div>

      <Comp
        state={state}
        setState={setState}
        sshKeys={sshKeys}
        onGo={onGo}
        onCancel={() => onGo("portal-dashboard")}
        onDeploy={handleDeploy}
      />

      <DeployingModal
        open={deploying}
        hostname={state.hostname}
        ip={created?.public_ip}
        stage={created?.stage}
        status={created?.status}
        error={err}
        onDone={() => {
          setDeploying(false);
          clearInterval(pollTimer.current);
          if (created && !err) onGo("portal-vps-detail-" + created.id);
        }}
      />
    </div>
  );
}

export { PageCreateVps, VPS_OS_OPTIONS, VPS_PLANS, ALL_PLANS, DeployingModal }
